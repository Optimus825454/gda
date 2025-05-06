const { supabaseAdmin: supabase } = require( '../config/supabase' ); // Supabase istemcisini import et
const AnimalService = require( '../services/AnimalService' );
const Animal = require( '../models/Animal' );
const AuditService = require( '../services/AuditService' );
const { createTemplate } = require('../../scripts/create-animal-template');
const path = require('path');
const fs = require('fs');

class AnimalController {
    /**
     * Başarılı yanıt oluşturur
     */
    static success( res, data, message = '' ) {
        res.json( {
            success: true,
            message,
            data
        } );
    }

    /**
     * Hata yanıtı oluşturur
     */
    static error( res, error, status = 500 ) {
        console.error( 'Controller Hatası:', error ); // Hata detayını logla
        res.status( status ).json( {
            success: false,
            error: error.message || error
        } );
    }

    /**
     * Tüm hayvanları listeler
     */
    static async listAnimals( req, res ) {
        try {
            // Supabase kullanarak hayvanları çek
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .order( 'created_at', { ascending: false } );

            if ( error ) throw error;
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * ID'ye göre hayvanı getirir
     */
    static async getAnimalById( req, res ) {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .eq( 'id', id )
                .single(); // Tek bir kayıt bekliyoruz

            if ( error ) {
                // Kayıt bulunamazsa 404 döndür
                if ( error.code === 'PGRST116' ) {
                    return AnimalController.error( res, new Error( 'Hayvan bulunamadı.' ), 404 );
                }
                throw error; // Diğer hataları fırlat
            }
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Yeni hayvan ekler
     */
    static async createAnimal( req, res ) {
        try {
            const animalData = req.body;

            // Gerekli alan kontrolü (Örnek: animal_id)
            if ( !animalData.animal_id ) {
                return AnimalController.error( res, new Error( 'Hayvan ID (animal_id) gereklidir.' ), 400 );
            }

            const { data, error } = await supabase
                .from( 'animals' )
                .insert( [animalData] )
                .select()
                .single(); // Eklenen kaydı döndür

            if ( error ) throw error;

            // Audit log kaydı
            await AuditService.logAction( {
                userId: req.user?.id,
                action: 'CREATE',
                entity: 'Animal',
                entityId: data?.id,
                details: animalData
            } );

            AnimalController.success( res, data, 'Hayvan başarıyla eklendi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hayvanı günceller
     */
    static async updateAnimal( req, res ) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Güncellenmemesi gereken alanları kaldır (opsiyonel)
            delete updates.id;
            delete updates.created_at;

            const { data, error } = await supabase
                .from( 'animals' )
                .update( updates )
                .eq( 'id', id )
                .select()
                .single(); // Güncellenen kaydı döndür

            if ( error ) {
                if ( error.code === 'PGRST116' ) {
                    return AnimalController.error( res, new Error( 'Güncellenecek hayvan bulunamadı.' ), 404 );
                }
                throw error;
            }
            AnimalController.success( res, data, 'Hayvan başarıyla güncellendi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hayvanı siler
     */
    static async deleteAnimal( req, res ) {
        try {
            const { id } = req.params;
            const { error } = await supabase
                .from( 'animals' )
                .delete()
                .eq( 'id', id );

            if ( error ) throw error;

            // Başarılı silme sonrası 204 No Content döndür
            res.status( 204 ).send();
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Kategoriye göre hayvanları listeler
     */
    static async listByCategory( req, res ) {
        try {
            const { category } = req.params;
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .eq( 'category', category ); // Supabase'de 'category' alanı varsa

            if ( error ) throw error;
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Test sonucuna göre hayvanları listeler
     */
    static async listByTestResult( req, res ) {
        try {
            const { result } = req.params;
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .eq( 'test_result', result ); // Supabase'de 'test_result' alanı varsa

            if ( error ) throw error;
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hedef şirkete göre hayvanları listeler
     */
    static async listByDestination( req, res ) {
        try {
            const { company } = req.params;
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .eq( 'destination_company', company ); // Supabase'de 'destination_company' alanı varsa

            if ( error ) throw error;
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Satış durumuna göre hayvanları listeler
     */
    static async listBySaleStatus( req, res ) {
        try {
            const { status } = req.params;
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .eq( 'sale_status', status ); // Supabase'de 'sale_status' alanı varsa

            if ( error ) throw error;
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Yeni hayvan ekler (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async addAnimal( req, res ) {
        try {
            const animalData = req.body;
            const animal = await AnimalService.addAnimal( animalData );
            AnimalController.success( res, animal, 'Hayvan başarıyla eklendi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Test sonucu kaydeder (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async recordTestResult( req, res ) {
        try {
            const { animalId } = req.params;
            const testData = req.body;
            const result = await AnimalService.processTestResult( animalId, testData );
            AnimalController.success( res, result, 'Test sonucu başarıyla kaydedildi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Satış işlemini tamamlar (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async completeSale( req, res ) {
        try {
            const { animalId } = req.params;
            const { price } = req.body;
            const result = await AnimalService.completeSale( animalId, price );
            AnimalController.success( res, result, 'Satış işlemi başarıyla tamamlandı' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Raporları getirir (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async getReports( req, res ) {
        try {
            const reports = await AnimalService.generateReports();
            AnimalController.success( res, reports );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Toplu hayvan ekleme (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async bulkCreate( req, res ) {
        try {
            const result = await AnimalService.bulkCreate( req.body );
            AnimalController.success( res, result, 'Hayvanlar başarıyla eklendi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Toplu hayvan güncelleme (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async bulkUpdate( req, res ) {
        try {
            const result = await AnimalService.bulkUpdate( req.body );
            AnimalController.success( res, result, 'Hayvanlar başarıyla güncellendi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Toplu test sonucu kaydetme (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async bulkProcessTestResults( req, res ) {
        try {
            const result = await AnimalService.bulkProcessTestResults( req.body );
            AnimalController.success( res, result, 'Test sonuçları başarıyla kaydedildi' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Toplu satış tamamlama (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async bulkCompleteSales( req, res ) {
        try {
            const result = await AnimalService.bulkCompleteSales( req.body );
            AnimalController.success( res, result, 'Satış işlemleri başarıyla tamamlandı' );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Detaylı raporları getirir (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async getDetailedReports( req, res ) {
        try {
            const report = await AnimalService.generateDetailedReport();
            AnimalController.success( res, report );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hayvanlarla ilgili sabit değerleri getirir
     */
    static async getConstants( req, res ) {
        try {
            // Supabase'den sabitleri çekme mantığı buraya eklenecek
            // Şimdilik örnek sabitler dönüyoruz
            const animalConstants = {
                genders: ['MALE', 'FEMALE'],
                statuses: ['ACTIVE', 'SOLD', 'DECEASED'],
                purposes: ['KESIMLIK', 'DAMIZLIK'],
                testResults: ['POSITIVE', 'NEGATIVE', 'PENDING'],
                saleStatuses: ['BEKLIYOR', 'SEVK_EDILDI', 'TAMAMLANDI']
            };

            AnimalController.success( res, animalConstants );

        } catch ( error ) {
            console.error( 'Sabitler getirilirken hata:', error );
            AnimalController.error( res, new Error( 'Sabitler getirilirken bir hata oluştu' ) );
        }
    }

    /**
     * Test bekleyen hayvanlar için toplu test işlemi (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async processPendingTests( req, res ) {
        try {
            const testResults = req.body;
            const results = await AnimalService.processPendingTests( testResults );
            AnimalController.success( res, results );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Satış sürecini yönet (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async manageSaleProcess( req, res ) {
        try {
            const summary = await AnimalService.manageSaleProcess();
            AnimalController.success( res, summary );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Test sonuçlarına göre grupla (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async groupByTestResults( req, res ) {
        try {
            const groups = await AnimalService.groupByTestResults();
            AnimalController.success( res, groups );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Satış istatistikleri (Mevcut implementasyon AnimalService kullanıyor)
     */
    static async getSaleStatistics( req, res ) {
        try {
            const stats = await AnimalService.generateSaleStatistics();
            AnimalController.success( res, stats );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hayvan önerilerini arama terimine ve alana göre listeler
     */
    static async getAnimalSuggestions( req, res ) {
        try {
            const { searchTerm, searchField } = req.query;

            if ( !searchTerm || searchTerm.length < 2 ) {
                return AnimalController.success( res, [], 'Arama terimi en az 2 karakter olmalıdır.' );
            }

            let query = supabase
                .from( 'animals' )
                .select( 'id, animal_id, tespit_no, category, birth_date, gender, purpose, status, price, image_url, sale_status, sale_date, anne_no, baba_no, tohumlama_tarihi' )
                .limit( 10 ); // Performans için öneri sayısını sınırla

            if ( searchField === 'animal_id' ) {
                query = query.ilike( 'animal_id', `%${searchTerm}%` );
            } else if ( searchField === 'tespit_no' ) {
                query = query.ilike( 'tespit_no', `%${searchTerm}%` );
            } else {
                return AnimalController.error( res, new Error( 'Geçersiz arama alanı belirtildi.' ), 400 );
            }

            const { data, error } = await query;

            if ( error ) throw error;
            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hayvanları filtrelerle getir
     */
    static async getAnimals(req, res) {
        try {
            let query = supabase
                .from('animals')
                .select(`
                    id,
                    animal_id,
                    purpose,
                    test_result,
                    test_status,
                    sale_status,
                    pregnancy_status,
                    tespit_no
                `);

            // Filtreler
            if (req.query.purpose) {
                query = query.eq('purpose', req.query.purpose);
            }
            if (req.query.test_result) {
                query = query.eq('test_result', req.query.test_result);
            }
            if (req.query.test_status) {
                query = query.eq('test_status', req.query.test_status);
            }
      
            if (req.query.sale_status) {
                query = query.eq('sale_status', req.query.sale_status);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Hayvanlar getirilirken hata:', error);
                return res.status(500).json({ error: 'Hayvanlar getirilirken bir hata oluştu.' });
            }

            return res.status(200).json({ data });
        } catch (error) {
            console.error('Hayvanlar getirilirken hata:', error);
            return res.status(500).json({ error: 'Hayvanlar getirilirken bir hata oluştu.' });
        }
    }

    /**
     * Kan örneklerini getir
     */
    static async getBloodSamples(req, res) {
        try {
            let query = supabase
                .from('blood_samples')
                .select(`
                    id,
                    animal_id,
                    status,
                    created_at
                `);

            // Filtreler
            if (req.query.status) {
                query = query.eq('status', req.query.status);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Kan örnekleri getirilirken hata:', error);
                return res.status(500).json({ error: 'Kan örnekleri getirilirken bir hata oluştu.' });
            }

            return res.status(200).json({ data });
        } catch (error) {
            console.error('Kan örnekleri getirilirken hata:', error);
            return res.status(500).json({ error: 'Kan örnekleri getirilirken bir hata oluştu.' });
        }
    }

    /**
     * Toplu hayvan yükleme şablonu indirir
     */
    static async downloadTemplate(req, res) {
        try {
            console.log('Şablon indirme isteği alındı');
            
            // Şablon dosyasının var olup olmadığını kontrol et
            const templateDir = path.join(__dirname, '../../templates');
            const templatePath = path.join(templateDir, 'hayvan_yukleme_sablonu.xlsx');
            
            console.log('Şablon dosya konumu:', templatePath);
            console.log('Dosya mevcut mu:', fs.existsSync(templatePath));
            
            // Şablon yoksa oluştur
            if (!fs.existsSync(templatePath)) {
                console.log('Şablon dosyası bulunamadı, oluşturuluyor...');
                await createTemplate();
                console.log('Şablon dosyası oluşturuldu');
            }
            
            // Dosyayı gönder
            res.download(templatePath, 'hayvan_yukleme_sablonu.xlsx', (err) => {
                if (err) {
                    console.error('Şablon indirme hatası:', err);
                    return AnimalController.error(res, new Error('Şablon indirme başarısız'), 500);
                }
                console.log('Şablon dosyası başarıyla gönderildi');
            });
        } catch (error) {
            console.error('Şablon indirme işlemi sırasında hata:', error);
            AnimalController.error(res, error);
        }
    }
}

// Tüm metotları export et
module.exports = {
    listAnimals: AnimalController.listAnimals,
    getAnimalById: AnimalController.getAnimalById,
    createAnimal: AnimalController.createAnimal,
    updateAnimal: AnimalController.updateAnimal,
    deleteAnimal: AnimalController.deleteAnimal,
    listByCategory: AnimalController.listByCategory,
    listByTestResult: AnimalController.listByTestResult,
    listByDestination: AnimalController.listByDestination,
    listBySaleStatus: AnimalController.listBySaleStatus,
    recordTestResult: AnimalController.recordTestResult,
    completeSale: AnimalController.completeSale,
    getReports: AnimalController.getReports,
    bulkCreate: AnimalController.bulkCreate,
    bulkUpdate: AnimalController.bulkUpdate,
    bulkProcessTestResults: AnimalController.bulkProcessTestResults,
    bulkCompleteSales: AnimalController.bulkCompleteSales,
    getDetailedReports: AnimalController.getDetailedReports,
    getConstants: AnimalController.getConstants,
    processPendingTests: AnimalController.processPendingTests,
    manageSaleProcess: AnimalController.manageSaleProcess,
    groupByTestResults: AnimalController.groupByTestResults,
    getSaleStatistics: AnimalController.getSaleStatistics,
    getAnimalSuggestions: AnimalController.getAnimalSuggestions,
    getAnimals: AnimalController.getAnimals,
    getBloodSamples: AnimalController.getBloodSamples,
    downloadTemplate: AnimalController.downloadTemplate
};