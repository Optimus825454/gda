const { pool } = require('../config/mysql');
const { handleError } = require('../utils/errorHandler');

class BloodSampleController {
    /**
     * Yeni kan numunesi kaydı oluşturur
     */
    static async create(req, res) {
        const connection = await pool.getConnection();
        try {
            const { 
                animal_id, 
                tag_number, 
                sample_date, 
                status = 'SONUÇ BEKLENİYOR',
                result = null,
                detection_tag 
            } = req.body;

            // Hayvanın zaten bir testi olup olmadığını kontrol et (SONUÇ BEKLENİYOR veya SONUÇLANDI)
            const [anyExistingTests] = await connection.query(
                'SELECT id, status FROM blood_samples WHERE animal_id = ? AND (status = ? OR status = ?)',
                [animal_id, 'SONUÇ BEKLENİYOR', 'SONUÇLANDI']
            );

            if (anyExistingTests && anyExistingTests.length > 0) {
                let message = 'Bu hayvan için zaten bekleyen bir test kaydı bulunmaktadır.';
                if (anyExistingTests.some(test => test.status === 'SONUÇLANDI')) {
                    message = 'Bu hayvan için daha önce sonuçlanmış bir test kaydı bulunmaktadır. Sistemsel olarak aynı hayvana birden fazla test kaydı girilmesine izin verilmemektedir.';
                }
                return res.status(400).json({
                    success: false,
                    message: message
                });
            }

            // Tespit numarası başka bir hayvanda kullanılmış mı kontrol et
            const [existingTag] = await connection.query(
                'SELECT h.kupeno FROM hayvanlar h WHERE h.tespitno = ? AND h.id != ?',
                [detection_tag, animal_id]
            );

            if (existingTag && existingTag.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Bu tespit numarası zaten ${existingTag[0].kupeno} küpe numaralı hayvanda kayıtlıdır.`
                });
            }

            // Transaction başlat
            await connection.beginTransaction();

            // Önce kan numunesi kaydını oluştur
            const [bloodSample] = await connection.query(
                `INSERT INTO blood_samples (
                    animal_id, 
                    tag_number, 
                    sample_date, 
                    status,
                    result,
                    detection_tag,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [animal_id, tag_number, sample_date, status, result, detection_tag]
            );

            // Hayvanın tespit numarasını güncelle
            const [updateResult] = await connection.query(
                'UPDATE hayvanlar SET tespitno = ?, updated_at = NOW() WHERE id = ?',
                [detection_tag, animal_id]
            );

            // Transaction'ı commit et
            await connection.commit();

            // Loglama - Başarılı kayıt
            const userIdForLogOnCreate = req.user?.id || null;
            if (userIdForLogOnCreate) {
                try {
                    await connection.query(
                        'INSERT INTO logs SET ?',
                        {
                            user_id: userIdForLogOnCreate,
                            action: 'CREATE_SUCCESS',
                            islem_tipi: 'KAYIT_OLUSTURMA',
                            modul: 'KAN_TESTI_KAYDI',
                            kayit_id: bloodSample.insertId,
                            animal_id: animal_id, // Log tablosunda bu alan var
                            aciklama: `Yeni kan testi kaydı oluşturuldu. ID: ${bloodSample.insertId}, Hayvan ID: ${animal_id}, Küpe No: ${tag_number}, Tespit No: ${detection_tag}`,
                            detaylar: JSON.stringify(req.body),
                            new_db_status: status, // Varsayılan 'SONUÇ BEKLENİYOR'
                            // new_db_result henüz yok
                            olusturma_tarihi: new Date()
                        }
                    );
                } catch (logError) {
                    console.error('[BloodSampleController] Başarılı kan testi kaydı logu yazılırken hata:', logError);
                }
            }

            // Başarılı yanıt döndür
            res.status(201).json({
                success: true,
                message: 'Kan numunesi başarıyla kaydedildi',
                data: {
                    id: bloodSample.insertId,
                    animal_id,
                    tag_number,
                    sample_date,
                    status,
                    result,
                    detection_tag,
                    updateResult: {
                        affectedRows: updateResult.affectedRows,
                        changedRows: updateResult.changedRows
                    }
                }
            });

        } catch (error) {
            // Hata durumunda rollback yap
            await connection.rollback();
            console.error('Kan numunesi kaydedilirken hata:', error);
            
            // Loglama - Hata durumu
            const userIdForLogError = req.user?.id || null;
            if (userIdForLogError) {
                try {
                    await connection.query(
                        'INSERT INTO logs SET ?',
                        {
                            user_id: userIdForLogError,
                            action: 'CREATE_ERROR',
                            islem_tipi: error.code === 'ER_NO_REFERENCED_ROW_2' ? 'HATA_REFERANS_BULUNAMADI' : 'GENEL_HATA',
                            modul: 'KAN_TESTI_KAYDI',
                            animal_id: req.body.animal_id, // Hata oluşsa da loglamaya çalışalım
                            aciklama: `Kan testi kaydedilirken hata oluştu: ${error.message}`,
                            detaylar: JSON.stringify({ body: req.body, error: error.message, code: error.code }),
                            olusturma_tarihi: new Date()
                        }
                    );
                } catch (logError) {
                    console.error('[BloodSampleController] Kan testi kaydı hata logu yazılırken ek hata:', logError);
                }
            }

            // Özel hata mesajları
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({
                    success: false,
                    message: 'Belirtilen hayvan bulunamadı.',
                    error: error.message
                });
            }
            
            // Genel hata durumu
            res.status(500).json({
                success: false,
                message: 'Kan numunesi kaydedilirken bir hata oluştu.',
                error: error.message,
                code: error.code
            });
        } finally {
            // Bağlantıyı havuza geri ver
            connection.release();
        }
    }

    /**
     * Tüm kan numunelerini listeler
     */
    static async list(req, res) {
        try {
            const { status } = req.query;
            let sql = `SELECT 
                    bs.id,
                    bs.animal_id,
                    bs.tag_number,
                    bs.sample_date,
                    bs.status,
                    bs.result,
                    bs.detection_tag,
                    bs.notes,
                    bs.created_at,
                    bs.updated_at,
                    h.kupeno,
                    h.tespitno,
                    h.kategori,
                    h.durum,
                    h.dogtar
                FROM blood_samples bs
                LEFT JOIN hayvanlar h ON bs.animal_id = h.id`;
            const params = [];
            if (status) {
                sql += ' WHERE bs.status = ?';
                params.push(status);
            }
            sql += ' ORDER BY bs.created_at DESC';
            const [samples] = await pool.query(sql, params);

            // Verileri DataGrid için uygun formata dönüştür
            const formattedSamples = samples.map(sample => ({
                id: sample.id,
                tag_number: sample.kupeno, // Küpe No
                detection_tag: sample.tespitno || sample.detection_tag, // Tespit No
                sample_date: sample.sample_date, // Numune Tarihi
                status: sample.status, // Durum
                result: sample.result, // Sonuç
                created_at: sample.created_at,
                updated_at: sample.updated_at,
                animal_info: {
                    kategori: sample.kategori,
                    durum: sample.durum,
                    dogtar: sample.dogtar
                }
            }));

            res.json({
                success: true,
                data: formattedSamples
            });

        } catch (error) {
            console.error('Kan numuneleri listelenirken hata:', error);
            res.status(500).json({
                success: false,
                message: 'Kan numuneleri listelenirken bir hata oluştu.',
                error: error.message
            });
        }
    }

    /**
     * Belirli bir kan numunesini getirir
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const [samples] = await pool.query(
                `SELECT 
                    bs.*,
                    h.kupeno,
                    h.kategori,
                    h.durum,
                    h.dogtar
                FROM blood_samples bs
                LEFT JOIN hayvanlar h ON bs.animal_id = h.id
                WHERE bs.id = ?`,
                [id]
            );

            if (samples.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Kan numunesi bulunamadı'
                });
            }

            res.json({
                success: true,
                data: samples[0]
            });

        } catch (error) {
            console.error('Kan numunesi getirilirken hata:', error);
            handleError(res, error);
        }
    }

    /**
     * Kan numunesini günceller (özellikle test sonucu ve notlar için)
     */
    static async update(req, res) {
        const connection = await pool.getConnection();
        try {
            const { id } = req.params; // Test (blood_sample) ID
            // Frontend'den gelen status aslında sonucun kendisi (POZİTİF, NEGATİF vb.)
            const { status: resultValue, result_date, notes } = req.body; 

            const userIdForLog = req.user?.id || null;

            if (resultValue === undefined || result_date === undefined) {
                if (userIdForLog) {
                    try {
                        await connection.query(
                            'INSERT INTO logs SET ?',
                            {
                                user_id: userIdForLog,
                                action: 'UPDATE_VALIDATION_ERROR',
                                islem_tipi: 'HATA_ISTEK',
                                modul: 'KAN_TESTI_GUNCELLEME',
                                kayit_id: id,
                                aciklama: 'Kan testi güncelleme isteğinde eksik parametre (status [resultValue] veya result_date).',
                                detaylar: JSON.stringify(req.body),
                                olusturma_tarihi: new Date()
                            }
                        );
                    } catch (logError) {
                        console.error('[BloodSampleController] Eksik parametre hata logu yazılırken ek hata:', logError);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: 'Sonuç (POZİTİF/NEGATİF vb.) ve sonuç tarihi alanları gereklidir.'
                });
            }

            await connection.beginTransaction();

            const [existingTestRows] = await connection.query(
                'SELECT animal_id, status as old_db_status, result as old_db_result FROM blood_samples WHERE id = ?',
                [id]
            );

            if (existingTestRows.length === 0) {
                await connection.rollback();
                if (userIdForLog) {
                     try {
                        await connection.query(
                            'INSERT INTO logs SET ?',
                            {
                                user_id: userIdForLog,
                                action: 'UPDATE_NOT_FOUND',
                                islem_tipi: 'HATA_KAYIT_BULUNAMADI',
                                modul: 'KAN_TESTI_GUNCELLEME',
                                kayit_id: id,
                                aciklama: 'Güncellenmek istenen kan testi kaydı bulunamadı.',
                                detaylar: JSON.stringify({ params: req.params, body: req.body }),
                                olusturma_tarihi: new Date()
                            }
                        );
                    } catch (logError) {
                        console.error('[BloodSampleController] Kayıt bulunamadı hata logu yazılırken ek hata:', logError);
                    }
                }
                return res.status(404).json({
                    success: false,
                    message: 'Güncellenecek kan testi kaydı bulunamadı.'
                });
            }
            const animal_id = existingTestRows[0].animal_id;
            const old_db_status = existingTestRows[0].old_db_status;
            const old_db_result = existingTestRows[0].old_db_result;

            const statusForDb = 'SONUÇLANDI'; // Her zaman SONUÇLANDI olacak
            const resultForDb = resultValue;    // POZİTİF, NEGATİF, BELİRSİZ for blood_samples.result

            const [updateBloodSampleResult] = await connection.query(
                `UPDATE blood_samples
                 SET status = ?, result = ?, result_date = ?, notes = ?, updated_at = NOW()
                 WHERE id = ?`,
                [statusForDb, resultForDb, result_date, notes || null, id]
            );

            // Hayvanlar tablosunu güncelleme başlangıcı
            let hayvanDetaylariGuncellendi = false;
            const [mevcutHayvanRows] = await connection.query('SELECT amac, test_sonucu FROM hayvanlar WHERE id = ?', [animal_id]);

            if (mevcutHayvanRows.length > 0) {
                const mevcutHayvan = mevcutHayvanRows[0];
                const eskiAmacHayvan = mevcutHayvan.amac;
                const eskiTestSonucuHayvan = mevcutHayvan.test_sonucu;

                let yeniAmacHayvan = eskiAmacHayvan; // Varsayılan olarak mevcut amacı koru
                const yeniTestSonucuHayvan = resultForDb; // Test sonucu ne ise hayvanın test sonucu da o olacak

                if (resultForDb === 'POZİTİF') {
                    yeniAmacHayvan = 'Kesim';
                } else if (resultForDb === 'NEGATİF') {
                    yeniAmacHayvan = 'Damızlık';
                }
                // BELİRSİZ veya diğer sonuçlarda amac değişmeyecek, yukarıda atanan eskiAmacHayvan kullanılacak.

                // Sadece gerçekten bir değişiklik varsa hayvanlar tablosunu güncelle
                if (yeniTestSonucuHayvan !== eskiTestSonucuHayvan || yeniAmacHayvan !== eskiAmacHayvan) {
                    await connection.query(
                        'UPDATE hayvanlar SET test_sonucu = ?, amac = ?, updated_at = NOW() WHERE id = ?',
                        [yeniTestSonucuHayvan, yeniAmacHayvan, animal_id]
                    );
                    hayvanDetaylariGuncellendi = true;

                    // Hayvan güncelleme logu
                    if (userIdForLog) {
                        try {
                            await connection.query('INSERT INTO logs SET ?', {
                                user_id: userIdForLog,
                                action: 'UPDATE_ANIMAL_FROM_TEST',
                                islem_tipi: 'ILISKILI_KAYIT_GUNCELLEME',
                                modul: 'HAYVAN',
                                kayit_id: animal_id,
                                aciklama: `Hayvan (ID: ${animal_id}) detayları, kan testi (ID: ${id}, Sonuç: ${resultForDb}) sonucuna göre güncellendi.`,
                                detaylar: JSON.stringify({
                                    animal_id: animal_id,
                                    triggering_test_id: id,
                                    old_values: { amac: eskiAmacHayvan, test_sonucu: eskiTestSonucuHayvan },
                                    new_values: { amac: yeniAmacHayvan, test_sonucu: yeniTestSonucuHayvan }
                                }),
                                olusturma_tarihi: new Date()
                            });
                        } catch (logError) {
                            console.error('[BloodSampleController] Hayvan güncelleme logu (testten tetiklenen) yazılırken hata:', logError);
                        }
                    }
                }
            } else {
                // Hayvan bulunamadı, bu durumu logla (önceki uyarı loguna benzer şekilde)
                if (userIdForLog) {
                    try {
                        await connection.query('INSERT INTO logs SET ?', {
                            user_id: userIdForLog,
                            action: 'UPDATE_ANIMAL_NOT_FOUND_FOR_TEST',
                            islem_tipi: 'UYARI_ILISKILI_KAYIT_BULUNAMADI',
                            modul: 'HAYVAN',
                            kayit_id: animal_id,
                            aciklama: `Kan testi (ID: ${id}) sonucu güncellendi ancak ilişkili hayvan (ID: ${animal_id}) bulunamadığı için hayvan detayları (test_sonucu, amac) güncellenemedi.`,
                            detaylar: JSON.stringify({ test_id: id, animal_id_not_found: animal_id, new_test_result: resultForDb }),
                            olusturma_tarihi: new Date()
                        });
                    } catch (logError) {
                        console.error('[BloodSampleController] İlişkili hayvan bulunamadı (test güncellemesi sırasında) uyarı logu yazılırken ek hata:', logError);
                    }
                }
            }
            // Hayvanlar tablosunu güncelleme sonu

            // Kan Testi Güncelleme Logu (Bu log her zaman atılmalı)
            const logTestUpdate = {
                user_id: userIdForLog,
                action: 'UPDATE_RESULT_SUCCESS',
                islem_tipi: 'KAYIT_GUNCELLEME',
                modul: 'KAN_TESTI_GUNCELLEME',
                kayit_id: id,
                animal_id: animal_id,
                aciklama: `Kan testi (ID: ${id}) sonucu güncellendi. Yeni DB Durum: ${statusForDb}, Yeni Sonuç: ${resultForDb}.`,
                detaylar: JSON.stringify({
                    test_id: id,
                    animal_id: animal_id,
                    new_db_status: statusForDb,
                    new_db_result: resultForDb,
                    old_db_status: old_db_status,
                    old_db_result: old_db_result,
                    result_date: result_date,
                    notes: notes || null
                }),
                new_db_status: statusForDb,
                new_db_result: resultForDb,
                old_db_status: old_db_status,
                old_db_result: old_db_result,
                result_date: result_date,
                olusturma_tarihi: new Date()
            };
            await connection.query('INSERT INTO logs SET ?', logTestUpdate);

            await connection.commit();
            res.json({
                success: true,
                message: 'Test kaydı başarıyla güncellendi.' + (hayvanDetaylariGuncellendi ? ' Hayvan detayları da güncellendi.' : ''),
                data: { 
                    id, 
                    status: resultForDb, // Frontend'in `status` olarak beklediği ana test sonucu
                    result_date, 
                    notes, 
                    animal_id, 
                    db_status: statusForDb, // blood_samples tablosundaki asıl status ('SONUÇLANDI')
                    // updated_animal_amac: yeniAmacHayvan // Bu değişken bu scope'ta olmayabilir, gerekirse yukarıdan alınmalı
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('[BloodSampleController] Update işlemi sırasında hata:', error);
            
            const errorUserIdForLog = req.user?.id || null;
            try {
                await connection.query(
                    'INSERT INTO logs SET ?',
                    {
                        user_id: errorUserIdForLog,
                        action: 'UPDATE_GENERAL_ERROR',
                        islem_tipi: 'GENEL_HATA',
                        modul: 'KAN_TESTI_GUNCELLEME',
                        kayit_id: req.params.id || null, 
                        aciklama: `Kan testi güncellenirken sunucu hatası: ${error.message}`,
                        detaylar: JSON.stringify({
                            error_message: error.message,
                            error_stack: error.stack,
                            params: req.params,
                            body: req.body
                        }),
                        olusturma_tarihi: new Date()
                    }
                );
            } catch (logError) {
                console.error('[BloodSampleController] Genel hata logu yazılırken ek hata:', logError);
            }

            res.status(500).json({
                success: false,
                message: 'Kan testi güncellenirken bir sunucu hatası oluştu.',
                error: error.message // Hata mesajını olduğu gibi client'a gönderiyoruz.
            });
        } finally {
            connection.release();
        }
    }

    /**
     * Kan numunesini siler
     */
    static async delete(req, res) {
        const connection = await pool.getConnection();
        try {
            const { id } = req.params;

            await connection.beginTransaction();

            // Önce test kaydının var olup olmadığını ve hayvan bilgilerini kontrol et
            const [existingTest] = await connection.query(
                `SELECT bs.*, h.kupeno, h.tespitno 
                FROM blood_samples bs
                LEFT JOIN hayvanlar h ON bs.animal_id = h.id
                WHERE bs.id = ?`,
                [id]
            );

            if (existingTest.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Silinecek test kaydı bulunamadı'
                });
            }

            // Test durumunu kontrol et
            if (existingTest[0].status === 'SONUÇLANDI') {
                return res.status(400).json({
                    success: false,
                    message: 'Sonuçlanmış test kayıtları silinemez'
                });
            }

            // Hayvanın tespit numarasını kontrol et ve güncelle
            if (existingTest[0].tespitno === existingTest[0].detection_tag) {
                await connection.query(
                    'UPDATE hayvanlar SET tespitno = NULL, updated_at = NOW() WHERE id = ?',
                    [existingTest[0].animal_id]
                );

                // Log ekle
                await connection.query(
                    `INSERT INTO logs (
                        table_name,
                        record_id,
                        action_type,
                        old_value,
                        new_value,
                        description,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        'hayvanlar',
                        existingTest[0].animal_id,
                        'UPDATE',
                        existingTest[0].tespitno,
                        'NULL',
                        `Test kaydı silindiği için hayvanın tespit numarası temizlendi. Silinen test no: ${existingTest[0].detection_tag}`
                    ]
                );
            }

            // Test kaydını sil
            await connection.query(
                'DELETE FROM blood_samples WHERE id = ?',
                [id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Test kaydı başarıyla silindi',
                data: {
                    testId: id,
                    animalId: existingTest[0].animal_id,
                    kupeno: existingTest[0].kupeno,
                    tespitnoTemizlendi: existingTest[0].tespitno === existingTest[0].detection_tag
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Test kaydı silinirken hata:', error);
            res.status(500).json({
                success: false,
                message: 'Test kaydı silinirken bir hata oluştu.',
                error: error.message
            });
        } finally {
            connection.release();
        }
    }
}

module.exports = BloodSampleController; 