/**
 * Hayvanlar tablosundaki verileri düzenleme scripti
 * Bu script, hayvanlar tablosundaki durum, sagmal, cinsiyet, kategori ve gebelikdurum
 * alanlarını standardize eder.
 */
require('dotenv').config();
const { pool, query } = require('../../src/config/mysql');

async function normalizeHayvanlarData() {
    try {
        console.log('Hayvanlar tablosundaki veriler düzenleniyor...');
        
        // Bağlantı kontrolü
        console.log('Veritabanı bağlantısı kontrol ediliyor...');
        const connection = await pool.getConnection();
        console.log('Veritabanına bağlantı sağlandı.');
        
        // 1. Toplam kayıt sayısını kontrol et
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM hayvanlar');
        const totalRecords = countResult[0].total;
        console.log(`Toplam ${totalRecords} kayıt bulundu.`);
        
        if (totalRecords === 0) {
            console.error('Hayvanlar tablosu boş, düzenlenecek veri yok!');
            connection.release();
            return false;
        }
        
        // 2. Hangi alanlar için hangi değerlerin kullanıldığını göster
        console.log('\nMevcut değerler:');
        const fields = ['durum', 'sagmal', 'cinsiyet', 'kategori', 'gebelikdurum'];
        
        for (const field of fields) {
            const [results] = await connection.execute(`SELECT DISTINCT ${field} FROM hayvanlar`);
            console.log(`\n${field.toUpperCase()} için mevcut değerler:`);
            results.forEach((row, index) => {
                console.log(`  ${index + 1}. ${row[field] || 'NULL'}`);
            });
        }
        
        // İşlem bloğu - Transaction başlat
        try {
            await connection.beginTransaction();
            
            // 3. Durum alanını düzenle
            console.log('\nDurum alanı düzenleniyor...');
            await connection.execute(`UPDATE hayvanlar SET durum = 'İnek' WHERE durum = 'Inek' OR durum = 'inek' OR durum = 'İNEK'`);
            await connection.execute(`UPDATE hayvanlar SET durum = 'Kuru' WHERE durum = 'kuru' OR durum = 'KURU'`);
            await connection.execute(`UPDATE hayvanlar SET durum = 'Gebe' WHERE durum = 'gebe' OR durum = 'GEBE'`);
            await connection.execute(`UPDATE hayvanlar SET durum = 'Düve' WHERE durum = 'düve' OR durum = 'DÜVE' OR durum = 'duve'`);
            console.log('Durum alanı düzenlendi.');
            
            // 4. Sagmal alanını düzenle
            console.log('Sagmal alanı düzenleniyor...');
            // Sayısal değerler için güncelleme
            await connection.execute(`UPDATE hayvanlar SET sagmal = 1 WHERE sagmal = 1`);
            await connection.execute(`UPDATE hayvanlar SET sagmal = 0 WHERE sagmal = 0 OR sagmal IS NULL`);
            console.log('Sagmal alanı düzenlendi.');
            
            // 5. Cinsiyet alanını düzenle
            console.log('Cinsiyet alanı düzenleniyor...');
            await connection.execute(`UPDATE hayvanlar SET cinsiyet = 'Dişi' WHERE cinsiyet = 'dişi' OR cinsiyet = 'disi' OR cinsiyet = 'DİŞİ' OR cinsiyet = 'D' OR cinsiyet = 'F'`);
            await connection.execute(`UPDATE hayvanlar SET cinsiyet = 'Erkek' WHERE cinsiyet = 'erkek' OR cinsiyet = 'ERKEK' OR cinsiyet = 'E' OR cinsiyet = 'M'`);
            console.log('Cinsiyet alanı düzenlendi.');
            
            // 6. Kategori alanını düzenle
            console.log('Kategori alanı düzenleniyor...');
            await connection.execute(`UPDATE hayvanlar SET kategori = 'İnek' WHERE kategori = 'Inek' OR kategori = 'inek' OR kategori = 'İNEK' OR kategori = 'INEK'`);
            await connection.execute(`UPDATE hayvanlar SET kategori = 'Gebe Düve' WHERE kategori = 'GEBE_DUVE' OR kategori = 'gebe düve' OR kategori = 'Gebe duve'`);
            await connection.execute(`UPDATE hayvanlar SET kategori = 'Düve' WHERE kategori = 'düve' OR kategori = 'DÜVE' OR kategori = 'duve' OR kategori = 'DUVE'`);
            await connection.execute(`UPDATE hayvanlar SET kategori = 'Erkek' WHERE kategori = 'erkek' OR kategori = 'ERKEK'`);
            console.log('Kategori alanı düzenlendi.');
            
            // 7. Gebelik durumu alanını düzenle
            console.log('Gebelik durumu alanı düzenleniyor...');
            await connection.execute(`UPDATE hayvanlar SET gebelikdurum = 'gebe' WHERE gebelikdurum = 'Gebe' OR gebelikdurum = 'GEBE'`);
            await connection.execute(`UPDATE hayvanlar SET gebelikdurum = NULL WHERE gebelikdurum = 'BOŞ' OR gebelikdurum = 'Boş' OR gebelikdurum = 'bos' OR gebelikdurum IS NULL`);
            console.log('Gebelik durumu alanı düzenlendi.');
            
            // 8. İşlemi tamamla
            await connection.commit();
            console.log('\nVeriler başarıyla düzenlendi!');
            
            // 9. Düzenlenen verilerin kontrol edilmesi
            console.log('\nDüzenlenen değerler:');
            for (const field of fields) {
                const [results] = await connection.execute(`SELECT DISTINCT ${field}, COUNT(*) as count FROM hayvanlar GROUP BY ${field}`);
                console.log(`\n${field.toUpperCase()} için düzenlenmiş değerler:`);
                results.forEach((row, index) => {
                    console.log(`  ${index + 1}. ${row[field] || 'NULL'}: ${row.count} adet`);
                });
            }
            
            return true;
        } catch (error) {
            // Hata durumunda işlemi geri al
            await connection.rollback();
            console.error('Veri düzenleme sırasında hata:', error.message);
            throw error;
        } finally {
            // Bağlantıyı serbest bırak
            connection.release();
        }
    } catch (error) {
        console.error('Beklenmeyen hata:', error.message);
        return false;
    } finally {
        // Havuzu kapat
        await pool.end();
    }
}

// Script doğrudan çalıştırıldığında
if (require.main === module) {
    normalizeHayvanlarData()
        .then(success => {
            console.log(`\nİşlem ${success ? 'başarılı' : 'başarısız'} oldu.`);
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            console.error('Kritik hata:', err);
            process.exit(1);
        });
}

module.exports = { normalizeHayvanlarData }; 