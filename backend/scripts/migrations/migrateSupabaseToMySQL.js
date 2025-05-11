/**
 * Supabase'den MySQL'e veri taşıma scripti
 * Bu script, Supabase veritabanından dışa aktarılan verileri MySQL'e aktarmak için kullanılır.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('../../src/config/mysql');

// Supabase'den dışa aktarılan JSON dosyasının yolu
const EXPORT_FILE_PATH = path.resolve(__dirname, '../../data/supabase_export.json');

async function migrateData() {
    try {
        console.log('Supabase\'den MySQL\'e veri taşıma işlemi başlatılıyor...');
        
        // Veritabanı bağlantısını kontrol et
        const connected = await mysql.testConnection();
        if (!connected) {
            console.error('MySQL veritabanına bağlanılamadı. İşlem iptal ediliyor.');
            return false;
        }
        
        // JSON dosyasını oku
        if (!fs.existsSync(EXPORT_FILE_PATH)) {
            console.error(`Supabase export dosyası bulunamadı: ${EXPORT_FILE_PATH}`);
            console.log('Lütfen Supabase verilerinizi dışa aktarıp belirtilen konuma yerleştirin.');
            return false;
        }
        
        // JSON dosyasını oku ve parse et
        const supabaseData = JSON.parse(fs.readFileSync(EXPORT_FILE_PATH, 'utf8'));
        console.log(`Supabase export dosyası başarıyla okundu. Toplam kayıt: ${supabaseData.length}`);
        
        // Veri taşıma işlemlerini transaksiyon içinde yap
        await mysql.withTransaction(async (connection) => {
            // 1. Ana hayvan verilerini aktar
            console.log('Hayvanlar tablosuna veri aktarımı başlatılıyor...');
            for (const animal of supabaseData) {
                try {
                    // Hayvan tablosuna kayıt ekle
                    const sql = `
                        INSERT INTO hayvanlar (
                            kupeno, durum, tohtar, sagmal, anano, babano, dogtar, 
                            cinsiyet, kategori, gebelikdurum, tespitno, isim, irk, 
                            agirlik, amac, fiyat, notlar, resim_url, 
                            current_location_id, test_group, blood_test_tag, 
                            test_status, transport_status, sinif, animal_id
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, 
                            ?, ?, ?, ?, ?, ?, 
                            ?, ?, ?, ?, ?,
                            ?, ?, ?,
                            ?, ?, ?, ?
                        )
                    `;
                    
                    const params = [
                        animal.tag_number || null,
                        animal.status || animal.durum || 'aktif',
                        animal.tohumlama_tarihi || null,
                        animal.category === 'sagmal' ? 1 : 0,
                        animal.anne_no || null,
                        animal.baba_no || null,
                        animal.birth_date || null,
                        animal.gender || animal.cinsiyet || 'erkek',
                        animal.category || null,
                        animal.pregnancy_status || null,
                        animal.tespit_no || null,
                        animal.name || null,
                        animal.breed || null,
                        null, // ağırlık
                        animal.purpose || null,
                        animal.price || null,
                        animal.notes || null,
                        animal.image_url || null,
                        animal.current_location_id || null,
                        animal.test_group || null,
                        animal.blood_test_tag || null,
                        animal.test_status || null,
                        animal.transport_status || null,
                        animal.sinif || null,
                        animal.animal_id || null
                    ];
                    
                    const [result] = await connection.execute(sql, params);
                    const animalId = result.insertId;
                    
                    // 2. Hayvan test kayıtlarını ekle (eğer varsa)
                    if (animal.test_result || animal.test_status) {
                        const testSql = `
                            INSERT INTO hayvan_test (
                                hayvan_id, test_tipi, test_tarihi, sonuc, 
                                tespit_no, yapan_kisi, notlar, test_grubu, 
                                kan_testi_etiketi, test_durumu
                            ) VALUES (
                                ?, ?, ?, ?, 
                                ?, ?, ?, ?,
                                ?, ?
                            )
                        `;
                        
                        const testParams = [
                            animalId,
                            animal.test_group || 'Genel',
                            animal.created_at || new Date(),
                            animal.test_result || null,
                            animal.tespit_no || animal.blood_test_tag || null,
                            'Sistem',
                            'Supabase\'den aktarılmıştır',
                            animal.test_group || null,
                            animal.blood_test_tag || null,
                            animal.test_status || null
                        ];
                        
                        await connection.execute(testSql, testParams);
                    }
                    
                    // 3. Satış kaydı ekle (eğer varsa)
                    if (animal.sale_date || animal.sale_price || animal.sale_status) {
                        const satisSql = `
                            INSERT INTO hayvan_satis (
                                hayvan_id, satis_tarihi, satis_tipi, 
                                fiyat, durum, hedef_sirket, 
                                notlar, tasima_durumu
                            ) VALUES (
                                ?, ?, ?, 
                                ?, ?, ?, 
                                ?, ?
                            )
                        `;
                        
                        const satisParams = [
                            animalId,
                            animal.sale_date || null,
                            'normal',
                            animal.sale_price || animal.price || null,
                            animal.sale_status || 'beklemede',
                            animal.destination_company || null,
                            'Supabase\'den aktarılmıştır',
                            animal.transport_status || null
                        ];
                        
                        await connection.execute(satisSql, satisParams);
                    }
                    
                    console.log(`Hayvan aktarıldı: ${animal.tag_number || animal.name || animalId}`);
                } catch (error) {
                    console.error(`Hayvan aktarma hatası:`, error.message);
                    // Hatayı fırlat ve işlemi geri al
                    throw error;
                }
            }
            
            console.log('Veri aktarımı başarıyla tamamlandı!');
        });
        
        return true;
    } catch (error) {
        console.error('Veri taşıma sırasında hata:', error);
        return false;
    } finally {
        // Bağlantı havuzunu kapat
        try {
            await mysql.pool.end();
        } catch (err) {
            console.error('Bağlantı havuzu kapatılırken hata:', err);
        }
    }
}

// Script doğrudan çalıştırıldığında
if (require.main === module) {
    migrateData()
        .then((result) => {
            console.log('İşlem sonucu:', result ? 'Başarılı' : 'Başarısız');
            process.exit(result ? 0 : 1);
        })
        .catch((err) => {
            console.error('Beklenmeyen hata:', err);
            process.exit(1);
        });
}

module.exports = { migrateData }; 