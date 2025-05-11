/**
 * healthController.js - Sağlık kayıtları için HTTP isteklerini işleyen controller
 */

const HealthProtocol = require( '../services/HealthProtocol' );
const HealthRecord = require( '../models/HealthRecord' );
const AnimalService = require( '../services/AnimalService' );
const { supabase, adminAuthClient } = require( '../config/supabase' );
const healthProtocol = new HealthProtocol();

class HealthController {
    /**
     * Tüm sağlık kayıtlarını getirir
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async getAllHealthRecords( req, res ) {
        try {
            const healthRecords = await healthProtocol.getAllHealthRecords();
            res.status( 200 ).json( { success: true, data: healthRecords } );
        } catch ( error ) {
            console.error( 'Sağlık kayıtlarını getirirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: 'Sağlık kayıtları alınırken bir hata oluştu'
            } );
        }
    }

    /**
     * ID'ye göre sağlık kaydını getirir
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async getHealthRecordById( req, res ) {
        try {
            const { id } = req.params;
            const healthRecord = await healthProtocol.getHealthRecordById( id );
            res.status( 200 ).json( { success: true, data: healthRecord } );
        } catch ( error ) {
            if ( error.message && error.message.includes( 'bulunamadı' ) ) {
                res.status( 404 ).json( { success: false, error: error.message } );
            } else {
                console.error( `ID: ${req.params.id} olan sağlık kaydını getirirken hata:`, error );
                res.status( 500 ).json( {
                    success: false,
                    error: 'Sağlık kaydı alınırken bir hata oluştu'
                } );
            }
        }
    }

    /**
     * Hayvan ID'sine göre sağlık kayıtlarını getirir
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async getHealthRecordsByAnimalId( req, res ) {
        try {
            const { animalId } = req.params;
            const healthRecords = await healthProtocol.getHealthRecordsByAnimalId( animalId );
            res.status( 200 ).json( { success: true, data: healthRecords } );
        } catch ( error ) {
            console.error( `Hayvan ID: ${req.params.animalId} için sağlık kayıtlarını getirirken hata:`, error );
            res.status( 500 ).json( {
                success: false,
                error: 'Hayvanın sağlık kayıtları alınırken bir hata oluştu'
            } );
        }
    }

    /**
     * Türüne göre sağlık kayıtlarını getirir
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async getHealthRecordsByType( req, res ) {
        try {
            const { type } = req.params;
            const healthRecords = await healthProtocol.getHealthRecordsByType( type );
            res.status( 200 ).json( { success: true, data: healthRecords } );
        } catch ( error ) {
            console.error( `Tür: ${req.params.type} olan sağlık kayıtlarını getirirken hata:`, error );
            res.status( 500 ).json( {
                success: false,
                error: 'Sağlık kayıtları türe göre alınırken bir hata oluştu'
            } );
        }
    }

    /**
     * Tarih aralığına göre sağlık kayıtlarını getirir
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async getHealthRecordsByDateRange( req, res ) {
        try {
            const { startDate, endDate } = req.query;

            if ( !startDate || !endDate ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Başlangıç ve bitiş tarihleri gereklidir'
                } );
            }

            const healthRecords = await healthProtocol.getHealthRecordsByDateRange( startDate, endDate );
            res.status( 200 ).json( { success: true, data: healthRecords } );
        } catch ( error ) {
            if ( error.message && ( error.message.includes( 'Tarih formatı' ) || error.message.includes( 'tarihi' ) ) ) {
                res.status( 400 ).json( { success: false, error: error.message } );
            } else {
                console.error( 'Tarih aralığındaki sağlık kayıtlarını getirirken hata:', error );
                res.status( 500 ).json( {
                    success: false,
                    error: 'Tarih aralığındaki sağlık kayıtları alınırken bir hata oluştu'
                } );
            }
        }
    }

    /**
     * Yeni sağlık kaydı oluşturur
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async createHealthRecord( req, res ) {
        try {
            const healthData = req.body;
            const createdRecord = await healthProtocol.createHealthRecord( healthData );
            res.status( 201 ).json( {
                success: true,
                data: createdRecord,
                message: 'Sağlık kaydı başarıyla oluşturuldu'
            } );
        } catch ( error ) {
            // Doğrulama hatası kontrolü
            if ( error.message && error.message.startsWith( '{' ) ) {
                try {
                    const validationErrors = JSON.parse( error.message );
                    return res.status( 400 ).json( { success: false, errors: validationErrors } );
                } catch ( e ) {
                    // JSON ayrıştırma hatası
                }
            }

            console.error( 'Sağlık kaydı oluşturulurken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: 'Sağlık kaydı oluşturulurken bir hata oluştu'
            } );
        }
    }

    /**
     * Sağlık kaydını günceller
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async updateHealthRecord( req, res ) {
        try {
            const { id } = req.params;
            const healthData = req.body;
            const updatedRecord = await healthProtocol.updateHealthRecord( id, healthData );
            res.status( 200 ).json( {
                success: true,
                data: updatedRecord,
                message: 'Sağlık kaydı başarıyla güncellendi'
            } );
        } catch ( error ) {
            if ( error.message && error.message.includes( 'bulunamadı' ) ) {
                return res.status( 404 ).json( { success: false, error: error.message } );
            }

            // Doğrulama hatası kontrolü
            if ( error.message && error.message.startsWith( '{' ) ) {
                try {
                    const validationErrors = JSON.parse( error.message );
                    return res.status( 400 ).json( { success: false, errors: validationErrors } );
                } catch ( e ) {
                    // JSON ayrıştırma hatası
                }
            }

            console.error( `ID: ${req.params.id} olan sağlık kaydını güncellerken hata:`, error );
            res.status( 500 ).json( {
                success: false,
                error: 'Sağlık kaydını güncellerken bir hata oluştu'
            } );
        }
    }

    /**
     * Sağlık kaydını siler
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async deleteHealthRecord( req, res ) {
        try {
            const { id } = req.params;
            await healthProtocol.deleteHealthRecord( id );
            res.status( 200 ).json( {
                success: true,
                message: 'Sağlık kaydı başarıyla silindi'
            } );
        } catch ( error ) {
            if ( error.message && error.message.includes( 'bulunamadı' ) ) {
                return res.status( 404 ).json( { success: false, error: error.message } );
            }

            console.error( `ID: ${req.params.id} olan sağlık kaydını silerken hata:`, error );
            res.status( 500 ).json( {
                success: false,
                error: 'Sağlık kaydını silerken bir hata oluştu'
            } );
        }
    }

    /**
     * Yaklaşan sağlık işlemlerini getirir
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async getUpcomingHealthRecords( req, res ) {
        try {
            // Varsayılan olarak 7 gün, ama query ile değiştirilebilir
            const daysAhead = req.query.days ? parseInt( req.query.days ) : 7;

            if ( isNaN( daysAhead ) || daysAhead < 1 || daysAhead > 90 ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Geçerli bir gün sayısı belirtmelisiniz (1-90)'
                } );
            }

            const upcomingRecords = await healthProtocol.getUpcomingHealthRecords( daysAhead );
            res.status( 200 ).json( { success: true, data: upcomingRecords } );
        } catch ( error ) {
            console.error( 'Yaklaşan sağlık işlemlerini getirirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: 'Yaklaşan sağlık işlemleri alınırken bir hata oluştu'
            } );
        }
    }

    /**
     * Test sonucu kaydet
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async addTestResult( req, res ) {
        try {
            const { animalId } = req.params;
            const testData = req.body;

            // Test sonucunu kaydet ve hayvan bilgisini güncelle
            const result = await AnimalService.processTestResult( animalId, testData );

            res.status( 200 ).json( result );
        } catch ( error ) {
            console.error( 'Test sonucu eklerken hata:', error );
            res.status( 500 ).json( { error: error.message } );
        }
    }

    /**
     * Hayvan sağlık geçmişini getir
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async getAnimalHealthHistory( req, res ) {
        try {
            const { animalId } = req.params;
            const healthRecords = await HealthRecord.findByAnimalId( animalId );

            res.status( 200 ).json( healthRecords );
        } catch ( error ) {
            console.error( 'Sağlık geçmişi getirirken hata:', error );
            res.status( 500 ).json( { error: error.message } );
        }
    }

    /**
     * Sistem durumunu ve Supabase bağlantısını kontrol eder
     * @param {Object} req - HTTP istek nesnesi
     * @param {Object} res - HTTP yanıt nesnesi
     */
    static async checkSystemStatus( req, res ) {
        try {
            const status = {
                system: {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                },
                database: {
                    status: 'unknown',
                    message: ''
                }
            };

            // Supabase bağlantısını test et - basit bir tablo sorgusu ile
            try {
                console.log( 'Supabase bağlantısı test ediliyor...' );
                const { data, error } = await supabase
                    .from( 'user_roles' ) // Bu tablo muhtemelen mevcut
                    .select( 'count(*)' )
                    .limit( 1 );

                if ( error ) {
                    console.error( 'Supabase bağlantı hatası:', error );
                    status.database = {
                        status: 'error',
                        message: `Veritabanı bağlantı hatası: ${error.message}`,
                        details: error
                    };
                } else {
                    status.database = {
                        status: 'OK',
                        message: 'Veritabanına başarıyla bağlanıldı.'
                    };
                }
            } catch ( dbError ) {
                console.error( 'Supabase bağlantısı test edilirken yakalanan hata:', dbError );
                status.database = {
                    status: 'error',
                    message: `Veritabanı bağlantısı test edilirken hata: ${dbError.message}`,
                    details: dbError.toString()
                };
            }

            // Şema sorgulamasını test et - özellikle "Database error querying schema" hatası için
            try {
                console.log( 'Şema sorgulaması test ediliyor...' );
                const { data: schemas, error: schemasError } = await supabase
                    .rpc( 'get_schemas' ); // NOT: Bu RPC fonksiyonu yoksa, .from('pg_catalog.pg_tables').select('schemaname').limit(1) gibi bir sorgu kullanın

                if ( schemasError ) {
                    console.error( 'Şema sorgulama hatası:', schemasError );
                    status.schema = {
                        status: 'error',
                        message: `Şema sorgulama hatası: ${schemasError.message}`,
                        details: schemasError
                    };
                } else {
                    status.schema = {
                        status: 'OK',
                        message: 'Şema başarıyla sorgulandı.'
                    };
                }
            } catch ( schemaError ) {
                console.error( 'Şema sorgulanırken yakalanan hata:', schemaError );
                status.schema = {
                    status: 'error',
                    message: `Şema sorgulanırken hata: ${schemaError.message}`,
                    details: schemaError.toString()
                };
            }

            res.status( 200 ).json( status );
        } catch ( error ) {
            console.error( 'Sistem durumu kontrolünde hata:', error );
            res.status( 500 ).json( {
                status: 'error',
                message: 'Sistem durumu kontrol edilirken bir hata oluştu.',
                error: error.message
            } );
        }
    }
}

module.exports = HealthController;