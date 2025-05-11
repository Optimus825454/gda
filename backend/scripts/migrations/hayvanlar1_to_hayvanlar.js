/**
 * hayvanlar1 tablosundan hayvanlar tablosuna veri aktarım scripti
 */
require('dotenv').config();
const { pool, query } = require('../../src/config/mysql');

async function migrateData() {
    try {
        console.log('Veri aktarımı başlatılıyor...');
        
        // Bağlantı kontrolü
        console.log('Veritabanı bağlantısı kontrol ediliyor...');
        const connection = await pool.getConnection();
        console.log('Veritabanına bağlantı sağlandı.');
        
        // İşlem bloğu
        await connection.beginTransaction();
        
        try {
            // 1. hayvanlar1 tablosundan kayıt sayısını kontrol et
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM hayvanlar1');
            const totalRecords = countResult[0].total;
            console.log(`hayvanlar1 tablosunda toplam ${totalRecords} kayıt bulundu.`);
            
            if (totalRecords === 0) {
                console.error('hayvanlar1 tablosu boş, aktarılacak veri yok!');
                await connection.rollback();
                return false;
            }
            
            // 2. hayvanlar tablosunu temizle
            console.log('hayvanlar tablosu temizleniyor...');
            try {
                // Foreign key kısıtlamalarını geçici olarak devre dışı bırak
                await connection.execute('SET FOREIGN_KEY_CHECKS=0');
                await connection.execute('TRUNCATE TABLE hayvanlar');
                // Foreign key kısıtlamalarını tekrar etkinleştir
                await connection.execute('SET FOREIGN_KEY_CHECKS=1');
                console.log('hayvanlar tablosu temizlendi.');
            } catch (error) {
                console.error('Tablo temizleme hatası:', error.message);
                await connection.rollback();
                throw error;
            }
            
            // 3. Verileri aktar
            console.log('Veriler aktarılıyor...');
            const [insertResult] = await connection.execute(`
                INSERT INTO hayvanlar (
                    id, kupeno, durum, tohtar, sagmal, anano, babano, 
                    dogtar, cinsiyet, kategori, gebelikdurum, tespitno
                )
                SELECT 
                    id, kupeno, durum, tohtar, 
                    CASE 
                        WHEN sagmal = 'Evet' OR sagmal = 'evet' OR sagmal = 'EVET' OR sagmal = '1' OR sagmal = 'E' THEN 1 
                        ELSE 0
                    END as sagmal,
                    anano, babano, 
                    dogtar, cinsiyet, kategori, gebelikdurum, tespitno
                FROM 
                    hayvanlar1
            `);
            
            // 4. Aktarılan kayıt sayısını kontrol et
            const affectedRows = insertResult.affectedRows;
            console.log(`${affectedRows} kayıt başarıyla aktarıldı.`);
            
            // 5. İşlemi tamamla
            await connection.commit();
            console.log('Veri aktarımı başarıyla tamamlandı!');
            
            // 6. Örnek kayıtları göster
            const [sampleRecords] = await connection.execute('SELECT * FROM hayvanlar LIMIT 5');
            console.log('Aktarılan örnek kayıtlar:');
            console.table(sampleRecords);
            
            return true;
        } catch (error) {
            // Hata durumunda işlemi geri al
            await connection.rollback();
            console.error('Veri aktarımı sırasında hata:', error.message);
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
    migrateData()
        .then(success => {
            console.log(`İşlem ${success ? 'başarılı' : 'başarısız'} oldu.`);
            process.exit(success ? 0 : 1);
        })
        .catch(err => {
            console.error('Kritik hata:', err);
            process.exit(1);
        });
}

module.exports = { migrateData }; 