const TestResult = require( '../models/TestResult' );
const Animal = require( '../models/Animal' );
const AnimalService = require( '../services/AnimalService' ); // AnimalService'i import et
const Test = require( '../models/Test' );
const pool = require( '../config/database' );
const { createLog } = require( '../utils/logHelper' );
const { handleError } = require( '../utils/errorHandler' );

class TestController {
    /**
     * Tüm test sonuçlarını listele
     */
    static async listTests( req, res ) {
        try {
            const tests = await Test.findAll();
            res.json( {
                success: true,
                data: tests
            } );
        } catch ( error ) {
            handleError( res, error );
        }
    }

    /**
     * Bekleyen testleri listele
     */
    static async listPendingTests( req, res ) {
        try {
            const tests = await TestResult.findPendingTests();
            res.json( {
                success: true,
                data: tests
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Yeni test kaydı oluştur
     */
    static async createTest( req, res ) {
        try {
            const { animal_id, detection_number, result, notes } = req.body;

            // Hayvan kontrolü
            const [rows] = await pool.query( 'SELECT * FROM hayvanlar WHERE id = ?', [animal_id] );
            if ( rows.length === 0 ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Hayvan bulunamadı'
                } );
            }

            // Test oluştur
            const test = await Test.create( {
                animal_id,
                detection_number,
                result,
                notes
            } );

            // Hayvanın amacını güncelle
            if ( result ) {
                const purpose = result === 'POZİTİF' ? 'Kesim' : 'Damızlık';
                await pool.query(
                    'UPDATE hayvanlar SET amac = ? WHERE id = ?',
                    [purpose, animal_id]
                );
            }

            // Log kaydı
            await createLog( 'TEST_CREATE', req.user.id, {
                test_id: test.id,
                animal_id,
                detection_number,
                result
            } );

            res.json( {
                success: true,
                data: test
            } );
        } catch ( error ) {
            handleError( res, error );
        }
    }

    /**
     * Toplu test sonucu kaydet
     */
    static async bulkCreateTests( req, res ) {
        try {
            const testResults = req.body;
            const results = await TestResult.bulkCreate( testResults );

            res.json( {
                success: true,
                data: results,
                message: 'Test sonuçları işlendi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Test istatistiklerini getir
     */
    static async getTestStatistics( req, res ) {
        try {
            const stats = await TestResult.getTestStatistics();
            res.json( {
                success: true,
                data: stats
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Test durumunu güncelle
     */
    static async updateTestStatus( req, res ) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const test = await TestResult.findById( id );
            test.status = status;
            const updatedTest = await test.save();

            res.json( {
                success: true,
                data: updatedTest,
                message: 'Test durumu güncellendi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Kan numunesi alma
     */
    static async addBloodSample( req, res ) {
        try {
            const { animal_id, detection_tag, sample_date, notes } = req.body;

            // Validasyonlar
            if ( !animal_id ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Hayvan küpe numarası zorunludur'
                } );
            }

            if ( !detection_tag ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Tespit numarası zorunludur'
                } );
            }

            // Hayvanı bul
            const animal = await Animal.findByAnimalId( animal_id );

            if ( !animal ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: `${animal_id} küpe numaralı hayvan bulunamadı`
                } );
            }

            // Hayvanın tespit_no alanını güncelle (MySQL ile)
            try {
                await pool.query( 'UPDATE hayvanlar SET tespit_no = ? WHERE id = ?', [detection_tag, animal.id] );
            } catch ( updateError ) {
                console.error( 'Hayvan tespit_no güncellenirken hata:', updateError );
            }

            // Test verisi oluştur  
            const testData = {
                animal_id: animal.id, // animal.uuid yerine animal.id kullanıldı
                kupeno: hayvanlar.kupeno,
                sample_date: sample_date || new Date().toISOString(),
                notes: notes || `Kan numunesi alındı. Tespit No: ${detection_tag}`,
                created_by: req.user.id,
                status: 'BEKLEMEDE',
                photo_urls: []
            };

            console.log( 'Test verisi oluşturuldu:', testData );

            // Test sonucunu kaydet
            const testResult = new TestResult( testData );
            const savedTest = await testResult.save();

            if ( !savedTest ) {
                return res.status( 500 ).json( {
                    success: false,
                    error: 'Kan numunesi kaydedilemedi'
                } );
            }

            return res.status( 201 ).json( {
                success: true,
                message: 'Kan numunesi başarıyla kaydedildi',
                data: savedTest
            } );

        } catch ( error ) {
            console.error( 'Kan numunesi kaydedilirken hata:', error );
            return res.status( 500 ).json( {
                success: false,
                error: 'Kan numunesi kaydedilemedi',
                details: error.message
            } );
        }
    }

    /**
     * Test sonucunu güncelle
     */
    static async updateTestResult( req, res ) {
        try {
            const { id } = req.params;
            const { result, result_date, animal_updates } = req.body;

            // Test kaydını bul
            const test = await TestResult.findById( id );
            if ( !test ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: 'Test kaydı bulunamadı'
                } );
            }

            // Test sonucunu güncelle
            test.result = result;
            test.result_date = result_date;
            const savedTest = await test.save();

            // Hayvan bilgilerini güncelle (MySQL ile)
            if ( animal_updates && test.animal_id ) {
                try {
                    await pool.query(
                        'UPDATE hayvanlar SET purpose = ?, destination_company = ?, test_result = ? WHERE id = ?',
                        [animal_updates.purpose, animal_updates.destination_company, animal_updates.test_result, test.animal_id]
                    );
                } catch ( updateError ) {
                    console.error( 'Hayvan bilgileri güncellenirken hata:', updateError );
                }
            }

            return res.json( {
                success: true,
                data: savedTest,
                message: 'Test sonucu başarıyla güncellendi'
            } );

        } catch ( error ) {
            console.error( 'Test sonucu güncellenirken hata:', error );
            return res.status( 500 ).json( {
                success: false,
                error: 'Test sonucu güncellenirken bir hata oluştu',
                details: error.message
            } );
        }
    }

    /**
     * Testleri ara
     */
    static async searchTests( req, res ) {
        try {
            const { detection_tag } = req.query;

            if ( !detection_tag || detection_tag.length < 2 ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Arama terimi en az 2 karakter olmalıdır'
                } );
            }

            // MySQL sorgusu
            const query = `
                SELECT 
                    bs.id, 
                    bs.tag_number, 
                    bs.animal_id AS blood_sample_animal_fk_id, 
                    bs.sample_date, 
                    bs.result, 
                    bs.result_date, 
                    bs.notes,
                    h.animal_id AS animal_ear_tag, 
                    h.birth_date, 
                    h.breed, 
                    h.purpose,  
                    h.test_result 
                FROM blood_samples bs
                LEFT JOIN hayvanlar h ON bs.animal_id = h.id
                WHERE bs.tag_number LIKE ?
                ORDER BY bs.created_at DESC
            `;
            const [tests] = await pool.query( query, [`%${detection_tag}%`] );

            // Sonuçları formatla
            const formattedTests = tests.map( test => ( {
                id: test.id,
                detection_tag: test.tag_number,
                animal_id: test.animal_ear_tag,
                sample_date: test.sample_date,
                result: test.result,
                result_date: test.result_date,
                notes: test.notes,
                animal_info: {
                    birth_date: test.birth_date,
                    breed: test.breed,
                    purpose: test.purpose,
                    test_result: test.test_result
                }
            } ) );

            return res.json( {
                success: true,
                data: formattedTests
            } );

        } catch ( error ) {
            console.error( 'Testler aranırken hata:', error );
            return res.status( 500 ).json( {
                success: false,
                error: 'Testler aranırken bir hata oluştu',
                details: error.message
            } );
        }
    }

    /**
     * Dashboard verilerini getir
     */
    static async getDashboardData( req, res ) {
        try {
            // AnimalService'den rapor verilerini al
            const dashboardData = await AnimalService.generateReports();

            res.json( {
                success: true,
                data: dashboardData
            } );
        } catch ( error ) {
            console.error( 'Dashboard verileri alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: 'Dashboard verileri alınırken bir hata oluştu'
            } );
        }
    }

    /**
     * Test detayını getir
     */
    static async getTestById( req, res ) {
        try {
            const test = await Test.findByPk( req.params.id );

            if ( !test ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Test bulunamadı'
                } );
            }

            res.json( {
                success: true,
                data: test
            } );
        } catch ( error ) {
            handleError( res, error );
        }
    }

    /**
     * Test güncelle
     */
    static async updateTest( req, res ) {
        try {
            const { result, notes } = req.body;
            const test = await Test.findByPk( req.params.id );

            if ( !test ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Test bulunamadı'
                } );
            }

            // Test sonucunu güncelle
            const updatedTest = await Test.update( req.params.id, {
                result,
                notes
            } );

            // Hayvanın amacını güncelle
            if ( result ) {
                const purpose = result === 'POZİTİF' ? 'Kesim' : 'Damızlık';
                await pool.query(
                    'UPDATE hayvanlar SET amac = ? WHERE id = ?',
                    [purpose, test.animal_id]
                );
            }

            // Log kaydı
            await createLog( 'TEST_UPDATE', req.user.id, {
                test_id: test.id,
                result,
                notes
            } );

            res.json( {
                success: true,
                data: updatedTest
            } );
        } catch ( error ) {
            handleError( res, error );
        }
    }

    /**
     * Test sil
     */
    static async deleteTest( req, res ) {
        try {
            const test = await Test.findByPk( req.params.id );

            if ( !test ) {
                return res.status( 404 ).json( {
                    success: false,
                    message: 'Test bulunamadı'
                } );
            }

            // Test silindiğinde hayvanın tespit numarasını temizle
            await pool.query(
                'UPDATE hayvanlar SET tespit_no = NULL WHERE id = ?',
                [test.animal_id]
            );

            await Test.destroy( req.params.id );

            // Log kaydı
            await createLog( 'TEST_DELETE', req.user.id, {
                test_id: req.params.id
            } );

            res.json( {
                success: true,
                message: 'Test başarıyla silindi'
            } );
        } catch ( error ) {
            handleError( res, error );
        }
    }
}

module.exports = TestController;