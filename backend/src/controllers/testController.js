const TestResult = require('../models/TestResult');
const Animal = require('../models/Animal');
const supabase = require('../config/supabaseClient');

class TestController {
    /**
     * Tüm test sonuçlarını listele
     */
    static async listTests( req, res ) {
        try {
            const { animalId, status } = req.query;
            let tests;

            if ( animalId ) {
                tests = await TestResult.findByAnimalId( animalId );
            } else if ( status ) {
                tests = await TestResult.findByStatus( status );
            } else {
                tests = await TestResult.findAll();
            }

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
     * Yeni test sonucu kaydet
     */
    static async createTest( req, res ) {
        try {
            const testData = req.body;
            const test = new TestResult( testData );
            const savedTest = await test.save();

            res.json( {
                success: true,
                data: savedTest,
                message: 'Test sonucu başarıyla kaydedildi'
            } );
        } catch ( error ) {
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
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
    static async addBloodSample(req, res) {
        try {
            const { animal_id, detection_tag, sample_date, notes } = req.body;
            
            // Validasyonlar
            if (!animal_id) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Hayvan küpe numarası zorunludur' 
                });
            }
            
            if (!detection_tag) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Tespit numarası zorunludur' 
                });
            }
            
            // Hayvanı bul
            const animal = await Animal.findByAnimalId(animal_id);
            
            if (!animal) {
                return res.status(404).json({ 
                    success: false,
                    error: `${animal_id} küpe numaralı hayvan bulunamadı` 
                });
            }

            // Hayvanın testpit_no alanını güncelle
            const { data: updateResult, error: updateError } = await supabase
                .from('animals')
                .update({ testpit_no: detection_tag })
                .eq('animal_id', animal_id);

            if (updateError) {
                console.error('Hayvan testpit_no güncellenirken hata:', updateError);
            }

            // Test verisi oluştur
            const testData = {
                animal_id: animal.uuid,
                tag_number: detection_tag,
                sample_date: sample_date || new Date().toISOString(),
                notes: notes || `Kan numunesi alındı. Tespit No: ${detection_tag}`,
                created_by: req.user.id,
                status: 'BEKLEMEDE',
                photo_urls: []
            };

            console.log('Test verisi oluşturuldu:', testData);

            // Test sonucunu kaydet
            const testResult = new TestResult(testData);
            const savedTest = await testResult.save();

            if (!savedTest) {
                return res.status(500).json({
                    success: false,
                    error: 'Kan numunesi kaydedilemedi'
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Kan numunesi başarıyla kaydedildi',
                data: savedTest
            });

        } catch (error) {
            console.error('Kan numunesi kaydedilirken hata:', error);
            return res.status(500).json({
                success: false,
                error: 'Kan numunesi kaydedilemedi',
                details: error.message
            });
        }
    }

    /**
     * Test sonucunu güncelle
     */
    static async updateTestResult(req, res) {
        try {
            const { id } = req.params;
            const { result, result_date, animal_updates } = req.body;

            // Test kaydını bul
            const test = await TestResult.findById(id);
            if (!test) {
                return res.status(404).json({
                    success: false,
                    error: 'Test kaydı bulunamadı'
                });
            }

            // Test sonucunu güncelle
            test.result = result;
            test.result_date = result_date;
            const savedTest = await test.save();

            // Hayvan bilgilerini güncelle
            if (animal_updates && test.animal_id) {
                const { data: updateResult, error: updateError } = await supabase
                    .from('animals')
                    .update({
                        purpose: animal_updates.purpose,
                        destination_company: animal_updates.destination_company,
                        test_result: animal_updates.test_result
                    })
                    .eq('id', test.animal_id);

                if (updateError) {
                    console.error('Hayvan bilgileri güncellenirken hata:', updateError);
                }
            }

            return res.json({
                success: true,
                data: savedTest,
                message: 'Test sonucu başarıyla güncellendi'
            });

        } catch (error) {
            console.error('Test sonucu güncellenirken hata:', error);
            return res.status(500).json({
                success: false,
                error: 'Test sonucu güncellenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    /**
     * Testleri ara
     */
    static async searchTests(req, res) {
        try {
            const { detection_tag } = req.query;

            if (!detection_tag || detection_tag.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Arama terimi en az 2 karakter olmalıdır'
                });
            }

            const { data: tests, error } = await supabase
                .from('blood_samples')
                .select(`
                    *,
                    animals!blood_samples_animal_id_fkey (
                        animal_id,
                        birth_date,
                        breed,
                        purpose,
                        test_result
                    )
                `)
                .ilike('tag_number', `%${detection_tag}%`)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            // Sonuçları formatla
            const formattedTests = tests.map(test => ({
                id: test.id,
                detection_tag: test.tag_number,
                animal_id: test.animals?.animal_id,
                sample_date: test.sample_date,
                result: test.result,
                result_date: test.result_date,
                notes: test.notes,
                animal_info: {
                    birth_date: test.animals?.birth_date,
                    breed: test.animals?.breed,
                    purpose: test.animals?.purpose,
                    test_result: test.animals?.test_result
                }
            }));

            return res.json({
                success: true,
                data: formattedTests
            });

        } catch (error) {
            console.error('Testler aranırken hata:', error);
            return res.status(500).json({
                success: false,
                error: 'Testler aranırken bir hata oluştu',
                details: error.message
            });
        }
    }

    /**
     * Dashboard verilerini getir
     */
    static async getDashboardData(req, res) {
        try {
            // Bekleyen testleri getir
            const { data: pendingTests, error: pendingError } = await supabase
                .from('blood_samples')
                .select('*')
                .is('result', null);

            if (pendingError) throw pendingError;

            // Test sonuçlarını getir
            const { data: testResults, error: testError } = await supabase
                .from('blood_samples')
                .select('result, count(*)')
                .not('result', 'is', null)
                .group('result');

            if (testError) throw testError;

            // Lokasyon bazlı test durumunu getir
            const { data: locationSummary, error: locationError } = await supabase
                .from('animals')
                .select('current_location_id, test_result, count(*)')
                .group('current_location_id, test_result');

            if (locationError) throw locationError;

            // Test gruplarını hesapla
            const testGroups = {
                temizGrup: 0,
                izoleGrup: 0,
                suspectGrup: 0
            };

            testResults.forEach(result => {
                if (result.result === 'NEGATIF') {
                    testGroups.temizGrup = parseInt(result.count);
                } else if (result.result === 'POZITIF') {
                    testGroups.izoleGrup = parseInt(result.count);
                }
            });

            // Bekleyen test sayısını ekle
            testGroups.suspectGrup = pendingTests.length;

            res.json({
                success: true,
                data: {
                    pendingTests: pendingTests.length,
                    animalTestGroups: testGroups,
                    locationSummary,
                    lastUpdated: new Date()
                }
            });
        } catch (error) {
            console.error('Dashboard verileri alınırken hata:', error);
            res.status(500).json({
                success: false,
                error: 'Dashboard verileri alınırken bir hata oluştu'
            });
        }
    }
}

module.exports = TestController;