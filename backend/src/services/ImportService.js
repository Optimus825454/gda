/**
 * ImportService.js - Excel/CSV vb. dosyalardan toplu veri ithalatı için servis
 */

const fs = require( 'fs' );
const path = require( 'path' );
const csv = require( 'csv-parser' );
const xlsx = require( 'xlsx' );
const { supabase } = require( '../config/supabase' );
const Animal = require( '../models/Animal' );
const { v4: uuidv4 } = require( 'uuid' );

class ImportService {
    /**
     * CSV dosyasından hayvan verilerini okur
     * @param {string} filePath - CSV dosyasının yolu
     * @returns {Promise<Array>} - İşlenmiş hayvan verileri dizisi
     */
    static async importAnimalsFromCsv( filePath ) {
        return new Promise( ( resolve, reject ) => {
            const results = [];

            fs.createReadStream( filePath )
                .pipe( csv() )
                .on( 'data', ( data ) => results.push( this.formatAnimalData( data ) ) )
                .on( 'end', () => {
                    resolve( results );
                } )
                .on( 'error', ( error ) => {
                    reject( error );
                } );
        } );
    }

    /**
     * Excel dosyasından hayvan verilerini okur
     * @param {string} filePath - Excel dosyasının yolu
     * @returns {Promise<Array>} - İşlenmiş hayvan verileri dizisi
     */
    static async importAnimalsFromExcel( filePath ) {
        try {
            const workbook = xlsx.readFile( filePath );
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json( worksheet );

            return data.map( row => this.formatAnimalData( row ) );
        } catch ( error ) {
            throw new Error( `Excel dosyası işlenirken hata oluştu: ${error.message}` );
        }
    }

    /**
     * Ham veri nesnesini uygun formata dönüştürür
     * @param {Object} rawData - Ham hayvan verisi
     * @returns {Object} - Formatlı hayvan verisi
     */
    static formatAnimalData( rawData ) {
        // CSV/Excel başlıklarını veritabanı alanlarıyla eşleştir
        const mapping = {
            'Kupe No': 'animal_id',
            'Kupelemek': 'animal_id',
            'KupeNo': 'animal_id',
            'Kategori': 'category',
            'Tür': 'type',
            'Cins': 'breed',
            'Yaş': 'age',
            'Cinsiyet': 'gender',
            'DoğumTarihi': 'birth_date',
            'Ağırlık': 'weight',
            'HedefŞirket': 'destination_company',
            'TestSonucu': 'test_result',
            'SatışDurumu': 'sale_status',
            // İhtiyaca göre daha fazla alan eşleştirmesi eklenebilir
        };

        // Yeni nesnede alanları doğru keylere dönüştür
        const formattedData = {};

        // ID ekle
        formattedData.id = uuidv4();
        formattedData.created_at = new Date().toISOString();
        formattedData.updated_at = new Date().toISOString();

        // CSV/Excel başlıklarını veritabanı alanlarına dönüştür
        Object.keys( rawData ).forEach( key => {
            // Türkçe karakter ve boşluk içeren anahtarları normalize et
            const normalizedKey = key.normalize( "NFD" ).replace( /[\u0300-\u036f]/g, "" ).replace( /\s+/g, "" );
            const dbField = mapping[key] || mapping[normalizedKey] || key.toLowerCase().replace( /\s+/g, '_' );

            // Değeri ayarla, boşsa null olsun
            formattedData[dbField] = rawData[key] || null;
        } );

        // Kategori ve tür bilgisini kontrol et ve doğrula
        if ( formattedData.category && !Object.values( Animal.CATEGORIES ).includes( formattedData.category ) ) {
            formattedData.category = 'DIGER'; // Varsayılan değer
        }

        // Test sonucu yoksa beklemede olarak işaretle
        if ( !formattedData.test_result ) {
            formattedData.test_result = 'BEKLEMEDE';
        }

        // Satış durumu yoksa satışa hazır değil olarak işaretle
        if ( !formattedData.sale_status ) {
            formattedData.sale_status = 'SATISA_HAZIR_DEGIL';
        }

        return formattedData;
    }

    /**
     * Hayvanları veritabanına toplu olarak kaydeder
     * @param {Array} animals - Hayvan verileri dizisi
     * @returns {Promise<Object>} - İşlem sonucu
     */
    static async bulkInsertAnimals( animals ) {
        try {
            // Sayıları izlemek için sayaçlar
            const result = {
                total: animals.length,
                inserted: 0,
                failed: 0,
                errors: []
            };

            // Veritabanına kaydetme - büyük veriler için chunk'lara ayrılabilir
            const CHUNK_SIZE = 100; // Her seferde 100 kayıt ekle

            for ( let i = 0; i < animals.length; i += CHUNK_SIZE ) {
                const chunk = animals.slice( i, i + CHUNK_SIZE );

                const { data, error } = await supabase
                    .from( 'animals' )
                    .insert( chunk )
                    .select();

                if ( error ) {
                    result.failed += chunk.length;
                    result.errors.push( `Chunk ${i / CHUNK_SIZE + 1}: ${error.message}` );
                } else {
                    result.inserted += data.length;
                }
            }

            return result;
        } catch ( error ) {
            throw new Error( `Toplu hayvan kaydında hata: ${error.message}` );
        }
    }

    /**
     * Dosyadan hayvanları içeri aktarıp veritabanına kaydeder
     * @param {string} filePath - Dosya yolu
     * @param {string} fileType - Dosya tipi (csv, xlsx)
     * @returns {Promise<Object>} - İşlem sonucu
     */
    static async importAnimalsFromFile( filePath, fileType ) {
        try {
            let animals;

            // Dosya tipine göre içe aktarma metodunu seç
            if ( fileType === 'csv' ) {
                animals = await this.importAnimalsFromCsv( filePath );
            } else if ( fileType === 'xlsx' || fileType === 'xls' ) {
                animals = await this.importAnimalsFromExcel( filePath );
            } else {
                throw new Error( 'Desteklenmeyen dosya tipi. CSV veya XLSX dosyası yükleyin.' );
            }

            // Hayvanları veritabanına kaydet
            const result = await this.bulkInsertAnimals( animals );

            // Dosyayı sil (isteğe bağlı)
            fs.unlinkSync( filePath );

            return {
                success: true,
                message: `${result.inserted} hayvan başarıyla içeri aktarıldı, ${result.failed} kayıt başarısız oldu.`,
                result
            };
        } catch ( error ) {
            // Hata durumunda dosyayı temizlemeyi dene
            try {
                if ( fs.existsSync( filePath ) ) {
                    fs.unlinkSync( filePath );
                }
            } catch ( cleanupError ) {
                console.error( 'Dosya temizlenirken hata:', cleanupError );
            }

            throw new Error( `İçe aktarma hatası: ${error.message}` );
        }
    }

    /**
     * Test sonuçlarını toplu olarak güncellemek için kullanılır
     * @param {Array} testResults - Test sonucu kayıtları
     * @returns {Promise<Object>} - İşlem sonucu
     */
    static async bulkUpdateTestResults( testResults ) {
        try {
            const result = {
                total: testResults.length,
                updated: 0,
                failed: 0,
                errors: []
            };

            // Her hayvan için ayrı güncelleme yap
            for ( const test of testResults ) {
                const { animal_id, test_result, test_date, notes } = test;

                // Önce hayvanı ID'ye göre bul
                const { data: animal, error: findError } = await supabase
                    .from( 'animals' )
                    .select( 'id' )
                    .eq( 'animal_id', animal_id )
                    .single();

                if ( findError ) {
                    result.failed++;
                    result.errors.push( `${animal_id}: ${findError.message}` );
                    continue;
                }

                if ( !animal ) {
                    result.failed++;
                    result.errors.push( `${animal_id}: Hayvan bulunamadı` );
                    continue;
                }

                // Test sonucunu güncelle
                const { error: updateError } = await supabase
                    .from( 'animals' )
                    .update( {
                        test_result,
                        test_date: test_date || new Date().toISOString(),
                        notes: notes,
                        updated_at: new Date().toISOString(),
                        // Test sonucu pozitif ise hedef şirketi AsyaEt olarak, negatif ise Gülvet olarak ayarla
                        destination_company: test_result === 'POZITIF' ? 'ASYA_ET' : ( test_result === 'NEGATIF' ? 'GULVET' : null )
                    } )
                    .eq( 'id', animal.id );

                if ( updateError ) {
                    result.failed++;
                    result.errors.push( `${animal_id}: ${updateError.message}` );
                } else {
                    result.updated++;
                }
            }

            return {
                success: result.updated > 0,
                message: `${result.updated} hayvan test sonucu başarıyla güncellendi, ${result.failed} kayıt güncellenemedi.`,
                result
            };
        } catch ( error ) {
            throw new Error( `Toplu test sonucu güncelleme hatası: ${error.message}` );
        }
    }
}

module.exports = ImportService;