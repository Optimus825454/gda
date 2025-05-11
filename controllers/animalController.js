const AnimalService = require( '../services/AnimalService' );
const Animal = require( '../models/Animal' );
const hayvanlarModel = require( '../models/HayvanlarModel' ); // Hayvanlar modelini import et (singleton)
const AuditService = require( '../services/AuditService' );
const { createTemplate } = require( '../../scripts/create-animal-template' );
const path = require( 'path' );
const fs = require( 'fs' );
const { pool } = require( '../config/mysql' ); // MySQL bağlantı havuzunu import et
const { handleError } = require( '../utils/errorHandler' );
const { calculateAge, calculateGestationDetails } = require( '../utils/dateUtils' );

/**
 * Hayvan istatistiklerini günceller
 * @returns {Promise<void>}
 */
const updateAnimalStatistics = async () => {
    try {
        console.log( 'İstatistikler güncelleniyor...' );
    } catch ( error ) {
        console.error( 'İstatistik güncelleme hatası:', error );
    }
};

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
        if ( status === 404 ) {
            // 404 hataları için daha az ayrıntılı veya farklı bir günlük mesajı kullanın
            console.info( `[INFO] Kaynak bulunamadı (404): ${error.message || error}` );
        } else {
            // Diğer hatalar için orijinal günlük kaydını koru (örn. 500 durum kodları)
            console.error( 'Controller Hatası Detayı:', error );
        }
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
            const data = await hayvanlarModel.findAll( {
                orderBy: 'created_at DESC'
            } );

            AnimalController.success( res, data );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Kategoriye göre hayvanları listeler
     */
    static async listByCategory( req, res ) {
        try {
            const category = req.params.category;
            console.log( `Hayvanlar kategoriye göre listeleniyor: ${category}` );
            AnimalController.success( res, [], `Hayvanlar ${category} kategorisine göre listelendi (placeholder)` );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Test sonucuna göre hayvanları listeler
     */
    static async listByTestResult( req, res ) {
        try {
            const result = req.params.result;
            console.log( `Hayvanlar test sonucuna göre listeleniyor: ${result}` );
            AnimalController.success( res, [], `Hayvanlar ${result} test sonucuna göre listelendi (placeholder)` );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Hedef şirkete göre hayvanları listeler
     */
    static async listByDestination( req, res ) {
        try {
            const company = req.params.company;
            console.log( `Hayvanlar sevk yerine göre listeleniyor: ${company}` );
            AnimalController.success( res, [], `Hayvanlar ${company} sevk yerine göre listelendi (placeholder)` );
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    /**
     * Yeni hayvan ekler
     */
    static async createAnimal( req, res ) {
        try {
            const { name, species, age, gender } = req.body;

            if ( !name || !species || !age || !gender ) {
                return AnimalController.error( res, new Error( 'Tüm alanlar gereklidir: ad, tür, yaş, cinsiyet.' ), 400 );
            }

            const animalData = {
                kupeno: name,
                tur: species,
                yas: age,
                cinsiyet: gender
            };

            const data = await hayvanlarModel.create( animalData );

            await updateAnimalStatistics();

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
     * ID'ye göre hayvanı getirir
     */
    static async getAnimalById( req, res ) {
        try {
            const { id } = req.params;

            if ( id === 'blood-samples' ) {
                const specificError = new Error(
                    "Geçersiz istek: '/animals/blood-samples' bir hayvan ID'si olarak kullanılamaz. " +
                    "Kan örneği işlemleri için farklı bir API yolu (örn: /api/tests/blood-sample) olması muhtemeldir."
                );
                return AnimalController.error( res, specificError, 404 );
            }

            const data = await hayvanlarModel.findById( id );

            if ( !data ) {
                return AnimalController.error( res, new Error( 'Hayvan bulunamadı.' ), 404 );
            }

            AnimalController.success( res, data );
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
            const updateData = req.body;

            const hayvan = await hayvanlarModel.findById( id );
            if ( !hayvan ) {
                return AnimalController.error( res, new Error( 'Güncellenecek hayvan bulunamadı.' ), 404 );
            }

            if ( updateData.tespitno && updateData.tespitno !== hayvan.tespitno ) {
                const sql = 'SELECT id, kupeno FROM hayvanlar WHERE tespitno = ? AND id != ? AND tespitno IS NOT NULL';
                const existingAnimal = await hayvanlarModel.executeQuery( sql, [updateData.tespitno, id] );

                if ( existingAnimal && existingAnimal.length > 0 ) {
                    return AnimalController.error(
                        res,
                        new Error( `Bu tespit numarası zaten ${existingAnimal[0].kupeno} küpe numaralı hayvanda kayıtlıdır.` ),
                        400
                    );
                }
            }

            const updates = {};
            Object.keys( updateData ).forEach( key => {
                if ( updateData[key] !== undefined ) {
                    updates[key] = updateData[key];
                }
            } );

            if ( Object.keys( updates ).length === 0 ) {
                return AnimalController.error( res, new Error( 'Güncellenecek alan belirtilmedi.' ), 400 );
            }

            const result = await hayvanlarModel.update( id, updates );
            if ( !result ) {
                return AnimalController.error( res, new Error( 'Güncelleme işlemi başarısız oldu.' ), 500 );
            }

            try {
                await updateAnimalStatistics();
            } catch ( error ) {
                console.warn( 'İstatistik güncellemesi başarısız oldu:', error.message );
            }

            const updatedAnimal = await hayvanlarModel.findById( id );

            AnimalController.success( res, updatedAnimal, 'Hayvan başarıyla güncellendi.' );

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
            const result = await hayvanlarModel.delete( id );

            if ( !result ) {
                return AnimalController.error( res, new Error( 'Silinecek hayvan bulunamadı.' ), 404 );
            }

            await updateAnimalStatistics();

            res.status( 204 ).send();
        } catch ( error ) {
            AnimalController.error( res, error );
        }
    }

    // animalRoutes.js'de başvurulan eksik metotlar için yer tutucular
    static async downloadTemplate( req, res ) {
        console.log( 'downloadTemplate çağrıldı' );
        AnimalController.success( res, null, 'Şablon indirme (placeholder)' );
    }

    static async getConstants( req, res ) {
        console.log( 'getConstants çağrıldı' );
        AnimalController.success( res, {}, 'Sabitler (placeholder)' );
    }

    /**
     * Hayvan araması
     */
    static async searchAnimals( req, res ) {
        // console.log( '[DEBUG] searchAnimals req.query:', req.query );
        let { query: searchTerm } = req.query;
        // console.log('searchAnimals çağrıldı, arama terimi:', searchTerm);

        if ( !searchTerm || searchTerm.trim() === '' ) {
            return AnimalController.success( res, [], 'Arama terimi boş veya geçersiz.' );
        }

        // Search term'deki boşlukları kaldır
        searchTerm = searchTerm.replace( /\s+/g, '' );
        // console.log( '[DEBUG] searchAnimals Temizlenmiş searchTerm:', searchTerm );

        try {
            const sqlQuery = `
                SELECT
                    id,
                    kupeno,
                    tespitno,
                    dogtar,
                    kategori
                FROM hayvanlar
                WHERE (kupeno LIKE ? OR tespitno LIKE ?)
                ORDER BY kupeno ASC
                LIMIT 15;
            `;
            const queryParams =[`%${searchTerm}%`, `%${searchTerm}%`];
            // console.log( '[DEBUG] searchAnimals SQL Query:', sqlQuery );
            // console.log( '[DEBUG] searchAnimals SQL Params:', queryParams );

            // const [hayvanlarFromDB] = await hayvanlarModel.executeQuery(sqlQuery, queryParams); // ESKİ YAPI: Sadece ilk elemanı alıyordu
            const allMatchingAnimals = await hayvanlarModel.executeQuery( sqlQuery, queryParams ); // YENİ YAPI: Dönen dizinin tamamını al
            // console.log( '[DEBUG] searchAnimals allMatchingAnimals from DB:', allMatchingAnimals );

            const dataFromDB = Array.isArray( allMatchingAnimals ) ? allMatchingAnimals : []; // Dizi kontrolünü yeni değişkenle yap
            const suggestions = dataFromDB.map( hayvan => ( {
                id: hayvan.id,
                kupeno: hayvan.kupeno, // Frontend'de 'kupeno' olarak bekleniyor
                tespitno: hayvan.tespitno,
                dogtar: hayvan.dogtar, // Frontend'de 'dogtar' olarak bekleniyor
                kategori: hayvan.kategori
            } ) );

            AnimalController.success( res, suggestions, 'Hayvan arama sonuçları başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'searchAnimals Error:', error );
            AnimalController.error( res, 'Hayvan arama sırasında bir sunucu hatası oluştu.' );
        }
    }

    /**
     * Satış için küpe numarasına göre hayvan arar.
     * Sadece satışa uygun olanları ve henüz satılmamış olanları listeler.
     */
    static async searchAnimalsForSaleByEarTag( req, res ) {
        const { term } = req.query;
        const limit = parseInt( req.query.limit ) || 15;

        if ( !term || term.trim().length < 2 ) {
            return AnimalController.success( res, [], 'Arama terimi en az 2 karakter olmalıdır.' );
        }

        try {
            const sqlQuery = `
                SELECT
                    kupeno AS ear_tag,     -- Frontend'de ear_tag olarak bekleniyor
                    tespitno,
                    kategori,
                    gebelikdurum,
                    akibet AS sale_status
                FROM hayvanlar
                WHERE kupeno LIKE ?
                  AND akibet = 'ÇİFTLİKTE'
                  -- AND (sold_at IS NULL AND deleted_at IS NULL) -- Eğer satılmış veya silinmişse hariç tut
                ORDER BY kupeno ASC
                LIMIT ?;
            `;
            const queryParams =[`%${term}%`, limit];
            const results = await hayvanlarModel.executeQuery( sqlQuery, queryParams );

            AnimalController.success( res, results, 'Küpe no ile satışa uygun hayvan arama sonuçları.' );
        } catch ( error ) {
            console.error( 'searchAnimalsForSaleByEarTag Error:', error );
            // Log the full error object for debugging
            console.error( 'searchAnimalsForSaleByEarTag Detailed Error:', error );
            AnimalController.error( res, 'Küpe no ile hayvan arama sırasında bir sunucu hatası oluştu.' );
        }
    }

    /**
     * Satış için tespit numarasına (animal_id) göre hayvan arar.
     * Sadece satışa uygun olanları ve henüz satılmamış olanları listeler.
     */
    static async searchAnimalsForSaleByAnimalId( req, res ) {
        const { term } = req.query;
        const limit = parseInt( req.query.limit ) || 15;

        if ( !term || term.trim().length < 2 ) { // Tespit no için de minimum karakter kontrolü
            return AnimalController.success( res, [], 'Arama terimi en az 2 karakter olmalıdır.' );
        }

        try {
            const sqlQuery = `
                SELECT
                    id AS animal_id, -- Return id as animal_id
                    kupeno AS ear_tag,
                    tespitno, -- Return tespitno as tespitno
                    cinsiyet AS gender,
                    kategori,
                    gebelikdurum,
                    akibet AS sale_status
                FROM hayvanlar
                WHERE tespitno LIKE ?
                  AND akibet = 'ÇİFTLİKTE'
                  -- AND (sold_at IS NULL AND deleted_at IS NULL)
                ORDER BY tespitno ASC
                LIMIT ?;
            `;
            const queryParams =[`%${term}%`, limit];
            const results = await hayvanlarModel.executeQuery( sqlQuery, queryParams );

            AnimalController.success( res, results, 'Tespit no ile satışa uygun hayvan arama sonuçları.' );
        } catch ( error ) {
            console.error( 'searchAnimalsForSaleByAnimalId Error:', error );
            AnimalController.error( res, 'Tespit no ile hayvan arama sırasında bir sunucu hatası oluştu.' );
        }
    }

    static async getAnimalReportCounts( req, res ) {
        console.log( 'getAnimalReportCounts çağrıldı' );
        AnimalController.success( res, {}, 'Hayvan rapor sayıları (placeholder)' );
    }

    static async getPregnantCows( req, res ) {
        // console.log( 'getPregnantCows çağrıldı' );
        const kategoriInek = 'İnek'; // Kullanıcıdan teyit alınabilir veya ayar dosyasından okunabilir
        const durumGebe = 'Gebe';   // Kullanıcıdan teyit alınabilir veya ayar dosyasından okunabilir

        try {
            // HAYVAN_GEBELIK TABLOSU OLMADIĞI İÇİN SORGUNUN DEĞİŞMESİ GEREKİR.
            // HAYVANLAR TABLOSUNDA `gebelikdurum` VE `tohumlama_tarihi` (VEYA BENZERİ) KULLANILACAK.
            // LÜTFEN `hayvanlar` TABLOSUNDAKİ DOĞRU TOHUMLAMA TARİHİ SÜTUN ADINI BELİRTİN.
            // Şimdilik 'tohtar' olarak varsayıyorum.
            const sqlQuery = `
                SELECT
                    id,
                    kupeno,
                    dogtar,
                    kategori,
                    amac,
                    gebelikdurum,
                    tohtar  
                FROM hayvanlar
                WHERE kategori = ? AND gebelikdurum = ?
            `;
            const results = await hayvanlarModel.executeQuery( sqlQuery, [kategoriInek, durumGebe] ); // Doğru yakalama

            // results'ın bir dizi olduğundan emin olalım
            const recordsToMap = results; // results zaten bir dizi olmalı

            const dataToReturn = recordsToMap.map( item => {
                let statusDisplay = '-';
                if ( durumGebe ) statusDisplay = item.gebelikdurum;

                return {
                    animal_id: item.kupeno, // id yerine kupeno kullanılacak
                    birth_date: item.dogtar,
                    category: item.kategori,
                    purpose: item.amac,
                    pregnancy_status: item.gebelikdurum,
                    tohumlama_tarihi: item.tohtar
                };
            } );

            AnimalController.success( res, dataToReturn, 'Gebe inekler başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'getPregnantCows Error:', error.message );
            console.error( 'Stack Trace:', error.stack );
            AnimalController.error( res, error, 500 ); // Düzeltilmiş çağrı
        }
    }

    static async getPregnantHeifers( req, res ) {
        // console.log( 'getPregnantHeifers çağrıldı' );
        const kategoriDuve = 'DÜVE'; // Kullanıcıdan teyit alınabilir veya ayar dosyasından okunabilir
        const durumGebe = 'GEBE';   // Kullanıcıdan teyit alınabilir veya ayar dosyasından okunabilir

        try {
            // HAYVAN_GEBELIK TABLOSU OLMADIĞI İÇİN SORGUNUN DEĞİŞMESİ GEREKİR.
            // HAYVANLAR TABLOSUNDA `gebelikdurum` VE `tohumlama_tarihi` (VEYA BENZERİ) KULLANILACAK.
            // LÜTFEN `hayvanlar` TABLOSUNDAKİ DOĞRU TOHUMLAMA TARİHİ SÜTUN ADINI BELİRTİN.
            // Şimdilik 'tohtar' olarak varsayıyorum.
            const sqlQuery = `
                SELECT
                    id,
                    kupeno,
                    dogtar,
                    kategori,
                    amac,
                    gebelikdurum,
                    tohtar
                FROM hayvanlar
                WHERE kategori = ? AND gebelikdurum = ?
            `;
            const results = await hayvanlarModel.executeQuery( sqlQuery, [kategoriDuve, durumGebe] ); // Doğru yakalama

            // results'ın bir dizi olduğundan emin olalım
            const recordsToMap = results; // results zaten bir dizi olmalı

            const dataToReturn = recordsToMap.map( item => {
                let statusDisplay = '-';
                if ( durumGebe ) statusDisplay = item.gebelikdurum;

                return {
                    animal_id: item.kupeno, // id yerine kupeno kullanılacak
                    birth_date: item.dogtar,
                    category: item.kategori,
                    purpose: item.amac,
                    pregnancy_status: item.gebelikdurum,
                    tohumlama_tarihi: item.tohtar
                };
            } );

            AnimalController.success( res, dataToReturn, 'Gebe düveler başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'getPregnantHeifers Error:', error.message );
            console.error( 'Stack Trace:', error.stack );
            AnimalController.error( res, error, 500 ); // Düzeltilmiş çağrı
        }
    }

    static async getDryCows( req, res ) {
        const kategoriInek = 'İnek'; // Data Dictionary'ye uygun olarak düzeltildi.
        const durum = 'kuru'; // Data Dictionary'ye uygun olarak düzeltildi.

        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        // Beklenen buzağılama tarihi ve kalan gün hesaplama
        // function calculateGestationDetails( inseminationDateString, gestationPeriodDays = 283 ) {
        //     if ( !inseminationDateString ) return { expectedCalvingDate: null, remainingDays: null };
        //     const inseminationDate = new Date( inseminationDateString );
        //     if ( isNaN( inseminationDate.getTime() ) ) return { expectedCalvingDate: null, remainingDays: "Geçersiz Toh. Tarihi" };

        //     const expectedCalvingDate = new Date( inseminationDate );
        //     expectedCalvingDate.setDate( inseminationDate.getDate() + gestationPeriodDays );

        //     const today = new Date();
        //     today.setHours( 0, 0, 0, 0 );
        //     const expectedCalvingDateMidnight = new Date( expectedCalvingDate );
        //     expectedCalvingDateMidnight.setHours( 0, 0, 0, 0 );

        //     let remainingDays;
        //     if ( expectedCalvingDateMidnight < today ) {
        //         remainingDays = "Doğum Zamanı Geçmiş/Bilinmiyor";
        //     } else {
        //         const diffTime = expectedCalvingDateMidnight.getTime() - today.getTime();
        //         remainingDays = Math.ceil( diffTime / ( 1000 * 60 * 60 * 24 ) );
        //     }
        //     return {
        //         expectedCalvingDate: expectedCalvingDate.toLocaleDateString( 'tr-TR' ),
        //         remainingDays: remainingDays
        //     };
        // }

        try {
            const sqlQuery = `
                SELECT
                    id,     
                    kupeno, 
                    dogtar, 
                    kategori,
                    amac,
                    gebelikdurum,
                    tohtar  
                FROM hayvanlar
                WHERE durum  = ?`; // Filtreleme düzeltildi

            const results = await hayvanlarModel.executeQuery( sqlQuery, [durum] ); // Parametreler düzeltildi
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => {
                const gestationInfo = calculateGestationDetails( item.tohtar );
                return {
                    kupeno: item.kupeno,
                    kategori: item.kategori,
                    amac: item.amac,
                    mevcut_durum: item.gebelikdurum, // Bu 'KURUDA' olacak
                    yas: calculateAge( item.dogtar ),
                    tohumlama_tarihi: item.tohtar ? new Date( item.tohtar ).toLocaleDateString( 'tr-TR' ) : null,
                    beklenen_buzagilama_tarihi: gestationInfo.expectedCalvingDate,
                    tahmini_doguma_kalan_gun: gestationInfo.remainingDays
                };
            } );

            AnimalController.success( res, dataToReturn, 'Kuru inekler başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'getDryCows Error:', error.message );
            AnimalController.error( res, error, 500 );
        }
    }

    static async getMaleCalves( req, res ) {
        const CINSIYET_ERKEK = 'ERKEK';
        const KATEGORI_BUZAGI = 'Erkek';

        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        try {
            const sqlQuery = `
                SELECT
                    id,
                    kupeno,
                    dogtar,
                    cinsiyet,
                    kategori
                FROM hayvanlar
                WHERE cinsiyet = ? AND kategori = ?`;

            const results = await hayvanlarModel.executeQuery( sqlQuery, [CINSIYET_ERKEK, KATEGORI_BUZAGI] );
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => ( {
                kupeno: item.kupeno,
                yas: calculateAge( item.dogtar ),
                cinsiyet: item.cinsiyet,
                kategori: item.kategori
            } ) );

            AnimalController.success( res, dataToReturn, 'Erkek buzağılar başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'Error in getMaleCalves:', error.message );
            AnimalController.error( res, error, 'Erkek buzağılar alınırken bir hata oluştu.' );
        }
    }

    static async getSlaughteredAnimals( req, res ) {
        console.log( 'getSlaughteredAnimals çağrıldı' );
        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        try {
            // VARSAYIM: 'hayvanlar' tablosunda 'kesim_tarihi' adında bir sütun var.
            // Eğer kesim bilgisi 'hayvan_cikis' tablosunda 'cikis_nedeni = KESİM' veya
            // 'hayvanlar' tablosunda 'aktif_mi = FALSE' gibi farklı bir yolla tutuluyorsa, sorgu değişmeli.
            const sqlQuery = `
                SELECT
                    h.id,
                    h.kupeno,
                    h.dogtar,
                    h.kategori,
                    h.kesim_tarihi      -- Varsayılan sütun adı
                FROM hayvanlar h
                WHERE h.kesim_tarihi IS NOT NULL`; // Kesim tarihi olanları filtrele

            const results = await hayvanlarModel.executeQuery( sqlQuery, [] );
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => ( {
                kupeno: item.kupeno,
                yas: calculateAge( item.dogtar ),
                kategori: item.kategori,
                kesim_tarihi: item.kesim_tarihi ? new Date( item.kesim_tarihi ).toLocaleDateString( 'tr-TR' ) : null
            } ) );

            AnimalController.success( res, dataToReturn, 'Kesilmiş hayvanlar başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'Error in getSlaughteredAnimals:', error.message );
            AnimalController.error( res, error, 'Kesilmiş hayvanlar alınırken bir hata oluştu.' );
        }
    }

    static async getSlaughterReferral( req, res ) {
        console.log( 'getSlaughterReferral çağrıldı' );
        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        try {
            // VARSAYIM: 'hayvanlar' tablosunda 'kesime_sevk_tarihi' (dolu) ve 'kesim_tarihi' (boş) sütunları var.
            const sqlQuery = `
                SELECT
                    h.id,
                    h.kupeno,
                    h.dogtar,
                    h.kategori,
                    h.kesime_sevk_tarihi -- Varsayılan sütun adı
                FROM hayvanlar h
                WHERE h.kesime_sevk_tarihi IS NOT NULL AND (h.kesim_tarihi IS NULL OR h.kesim_tarihi = '')`;

            const results = await hayvanlarModel.executeQuery( sqlQuery, [] );
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => ( {
                kupeno: item.kupeno,
                yas: calculateAge( item.dogtar ),
                kategori: item.kategori,
                kesime_sevk_tarihi: item.kesime_sevk_tarihi ? new Date( item.kesime_sevk_tarihi ).toLocaleDateString( 'tr-TR' ) : null
            } ) );

            AnimalController.success( res, dataToReturn, 'Kesime sevk edilen hayvanlar başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'Error in getSlaughterReferral:', error.message );
            AnimalController.error( res, error, 'Kesime sevk edilen hayvanlar alınırken bir hata oluştu.' );
        }
    }

    static async getBreedingStock( req, res ) {
        const AMAC_DAMIZLIK = 'DAMIZLIK';

        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        try {
            const sqlQuery = `
                SELECT
                    h.id,
                    h.kupeno,
                    h.dogtar,
                    h.kategori,
                    h.cinsiyet,
                    h.amac
                FROM hayvanlar h
                WHERE h.amac = ?`;

            const results = await hayvanlarModel.executeQuery( sqlQuery, [AMAC_DAMIZLIK] );
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => ( {
                kupeno: item.kupeno,
                yas: calculateAge( item.dogtar ),
                kategori: item.kategori,
                cinsiyet: item.cinsiyet,
                amac: item.amac
            } ) );

            AnimalController.success( res, dataToReturn, 'Damızlık hayvanlar başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'Error in getBreedingStock:', error.message );
            AnimalController.error( res, error, 'Damızlık hayvanlar alınırken bir hata oluştu.' );
        }
    }

    static async getAllCows( req, res ) {
        const KATEGORI_INEK = 'İNEK';

        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        try {
            const sqlQuery = `
                SELECT
                    h.id,
                    h.kupeno,
                    h.dogtar,
                    h.kategori,
                    h.cinsiyet,
                    h.amac,
                    h.gebelikdurum
                FROM hayvanlar h
                WHERE h.kategori = ?`;

            const results = await hayvanlarModel.executeQuery( sqlQuery, [KATEGORI_INEK] );
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => ( {
                kupeno: item.kupeno,
                yas: calculateAge( item.dogtar ),
                kategori: item.kategori,
                cinsiyet: item.cinsiyet,
                amac: item.amac,
                gebelikdurum: item.gebelikdurum
            } ) );

            AnimalController.success( res, dataToReturn, 'Tüm inekler başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'Error in getAllCows:', error.message );
            AnimalController.error( res, error, 'Tüm inekler alınırken bir hata oluştu.' );
        }
    }

    static async getSoldAnimals( req, res ) {
        console.log( 'getSoldAnimals çağrıldı' );
        // Gerçek implementasyon için örnek (animals tablosunda 'status' kolonu olduğunu varsayalım)
        // try {
        //     const [soldAnimals] = await pool.query("SELECT * FROM animals WHERE status = 'Satıldı'");
        //     AnimalController.success(res, soldAnimals, 'Satılan hayvanlar başarıyla alındı.');
        // } catch (error) {
        //     console.error('getSoldAnimals Error:', error);
        //     AnimalController.error(res, 'Satılan hayvanlar alınırken bir hata oluştu.');
        // }
        AnimalController.success( res, [], 'Satılan hayvanlar (placeholder)' );
    }

    static async getAnimalGroups( req, res ) {
        // console.log('getAnimalGroups çağrıldı');
        const { purpose, test_result, processing_status, sale_status } = req.query;
        try {
            let sqlQuery = `
                SELECT 
                    id, 
                    kupeno, 
                    amac, 
                    dogtar,
                    akibet, 
                    test_sonucu,
                    created_at 
                FROM hayvanlar
            `;

            const conditions = [];
            const params = [];

            if ( purpose ) {
                conditions.push( "amac = ?" );
                params.push( purpose );
            }
            if ( test_result ) {
                conditions.push( "test_sonucu = ?" );
                params.push( test_result );
            }
            if ( processing_status ) {
                // Bu alan için DB'deki doğru kolon adını kontrol edin, örnek olarak 'akibet' kullanıldı
                conditions.push( "akibet = ?" );
                params.push( processing_status );
            }
            if ( sale_status ) {
                conditions.push( "akibet = ?" );
                params.push( sale_status );
            }

            if ( conditions.length > 0 ) {
                sqlQuery += " WHERE " + conditions.join( " AND " );
            }

            sqlQuery += " ORDER BY created_at DESC;"; // Son eklenenler üste gelsin

            const [animalsFromDB] = await hayvanlarModel.executeQuery( sqlQuery, params );
            const dataFromDB = Array.isArray( animalsFromDB ) ? animalsFromDB : []; // Dizi kontrolünü yeni değişkenle yap
            const hayvanlar = dataFromDB.map( hayvan => {
                let statusDisplay = '-';
                if ( purpose ) statusDisplay = hayvan.amac;
                else if ( test_result ) statusDisplay = hayvan.test_sonucu;
                else if ( processing_status ) statusDisplay = hayvan.akibet; // Örneğin 'Kesildi'
                else if ( sale_status ) statusDisplay = hayvan.akibet; // Örneğin 'Satıldı'

                return {
                    id: hayvan.id,
                    tag_number: hayvan.kupeno, // Modal bu alanı bekliyor
                    status: statusDisplay,      // Modal bu alanı bekliyor
                    sample_date: hayvan.created_at, // Modal 'sample_date' veya 'created_at' bekleyebilir, 'created_at' kullanalım
                    // Belki modal'da başka alanlar da gösterilmek istenebilir, dogtar gibi.
                    // Şimdilik sadece modal'ın temel olarak ihtiyaç duyduğu alanları ekleyelim.
                    birth_date: hayvan.dogtar
                };
            } );

            AnimalController.success( res, hayvanlar, 'Hayvan grup verileri başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'getAnimalGroups Error:', error );
            AnimalController.error( res, 'Hayvan grup verileri alınırken bir sunucu hatası oluştu.' );
        }
    }

    // Yeni Rapor: 13 Aylıktan Küçük Dişiler ve Annelerinin Süt Verimi
    static async getYoungFemalesWithDamYield( req, res ) {
        const CİNSİYET_DİŞİ = 'DİŞİ';

        // Yaş hesaplama yardımcı fonksiyonu
        // function calculateAge( dobString ) {
        //     if ( !dobString ) return null;
        //     const dob = new Date( dobString );
        //     if ( isNaN( dob.getTime() ) ) return null;
        //     const today = new Date();
        //     let ageYears = today.getFullYear() - dob.getFullYear();
        //     let ageMonths = today.getMonth() - dob.getMonth();
        //     let ageDays = today.getDate() - dob.getDate();

        //     if ( ageDays < 0 ) {
        //         ageMonths--;
        //         const daysInLastMonth = new Date( today.getFullYear(), today.getMonth(), 0 ).getDate();
        //         ageDays += daysInLastMonth;
        //     }
        //     if ( ageMonths < 0 ) {
        //         ageYears--;
        //         ageMonths += 12;
        //     }
        //     return `${ageYears} yıl, ${ageMonths} ay, ${ageDays} gün`;
        // }

        try {
            const sqlQuery = `
                SELECT
                    h.kupeno,
                    h.dogtar,
                    h.anne_kupeno,
                    sv.sutort AS anneverim
                FROM
                    hayvanlar h
                LEFT JOIN
                    sutverim sv ON h.anne_kupeno = sv.kupeno
                WHERE
                    h.cinsiyet = ?
                    AND h.dogtar > DATE_SUB(CURDATE(), INTERVAL 13 MONTH)
                ORDER BY h.dogtar DESC; 
            `;
            // Not: DATE_SUB ve CURDATE() MySQL fonksiyonlarıdır.
            // Farklı bir DB kullanılıyorsa sözdizimi değişebilir.

            const results = await hayvanlarModel.executeQuery( sqlQuery, [CİNSİYET_DİŞİ] );
            const recordsToMap = Array.isArray( results ) ? results : [];

            const dataToReturn = recordsToMap.map( item => ( {
                kupeno: item.kupeno,
                yas: calculateAge( item.dogtar ),
                anne_kupeno: item.anne_kupeno,
                anneverim: item.anneverim !== null && item.anneverim !== undefined ? item.anneverim : null 
            } ) );

            AnimalController.success( res, dataToReturn, '13 aylıktan küçük dişi hayvanlar ve annelerinin süt verimleri başarıyla alındı.' );
        } catch ( error ) {
            console.error( 'Error in getYoungFemalesWithDamYield:', error.message );
            AnimalController.error( res, error, 'Genç dişi hayvanlar ve anne verimleri alınırken bir hata oluştu.' );
        }
    }

    // Ölüm Girişi İçin Öneri API
    static async getDeathSuggestions(req, res) {
        try {
            const { earTagEnd } = req.params;

            if (!earTagEnd || earTagEnd.length !== 2) {
                return AnimalController.error(res, new Error('Kulak numarasının son 2 hanesi belirtilmeli.'), 400);
            }

            // TODO: Implement actual database query using hayvanlarModel
            // Query animals where kupeno ends with earTagEnd and death_date is NULL
            const suggestedAnimals = await hayvanlarModel.findLivingAnimalsByEarTagEnd(earTagEnd);

            AnimalController.success(res, suggestedAnimals);
        } catch (error) {
            AnimalController.error(res, error);
        }
    }

    // Ölüm Kaydı Ekleme API
    static async createDeathEntry(req, res) {
        try {
            const { animalId, deathDate, deathReason } = req.body;

            if (!animalId || !deathDate || !deathReason) {
                return AnimalController.error(res, new Error("Hayvan ID'si, ölüm tarihi ve ölüm nedeni gereklidir."), 400);
            }

            // Ölüm bilgisini veritabanına kaydet
            const updateData = {
                olum_tarihi: deathDate, // Veritabanı sütun adınıza göre ayarlayın
                olum_nedeni: deathReason, // Veritabanı sütun adınıza göre ayarlayın
                // Gerekirse başka durum güncellemeleri (örn. durum = 'Ölü') eklenebilir
            };

            const result = await hayvanlarModel.update(animalId, updateData);

            if (!result) {
                return AnimalController.error(res, new Error('Hayvan bulunamadı veya güncelleme başarısız oldu.'), 404);
            }

            // Denetim kaydı oluştur
            await AuditService.logAction({
                userId: req.user?.id,
                action: 'UPDATE',
                entity: 'Animal',
                entityId: animalId,
                details: { deathDate, deathReason }
            });

            AnimalController.success(res, { id: animalId }, 'Ölüm bilgisi başarıyla kaydedildi.');

        } catch (error) {
            AnimalController.error(res, error);
        }
    }

    // Doğum Girişi İçin Öneri Stub
    static async getBirthSuggestions(req, res) {
        console.log( 'getBirthSuggestions çağrıldı' );
        // TODO: Implement actual logic to fetch birth suggestions
        AnimalController.success( res, [], 'Doğum önerileri (placeholder)' );
    }

    // Doğum Kaydı Stub
    static async createBirthEntry(req, res) {
        AnimalController.success(res, null, 'Doğum kaydı başarıyla oluşturuldu (stub).');
    }

    // Ölen hayvanları listeler
    static async listDeadAnimals(req, res) {
        try {
            // TODO: Implement database query using hayvanlarModel
            // Query animals where olum_tarihi IS NOT NULL
            const deadAnimals = await hayvanlarModel.findDeadAnimals();

            AnimalController.success(res, deadAnimals);
        } catch (error) {
            AnimalController.error(res, error);
        }
    }
}

module.exports = AnimalController;
