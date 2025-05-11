/**
 * MySQL tabloları oluşturma scripti
 * Bu script, .sql dosyasını okuyup MySQL veritabanında tabloları oluşturur
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/config/mysql');

const setupTables = async () => {
    try {
        console.log('MySQL tablolarını oluşturma işlemi başlatılıyor...');
        
        // SQL dosyasını oku
        const sqlFilePath = path.join(__dirname, '../sql/create_hayvanlar_table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // SQL sorgularını ayır (her biri ';' ile biter)
        const sqlStatements = sqlContent
            .split(';')
            .filter(statement => statement.trim() !== '');
        
        console.log(`Toplam ${sqlStatements.length} SQL sorgusu çalıştırılacak.`);
        
        // Her bir sorguyu çalıştır
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i].trim() + ';';
            try {
                await pool.query(statement);
                console.log(`[${i+1}/${sqlStatements.length}] Sorgu başarıyla çalıştırıldı.`);
            } catch (error) {
                console.error(`[${i+1}/${sqlStatements.length}] Sorgu hatası:`, error.message);
                console.error('Hatalı sorgu:', statement);
            }
        }
        
        console.log('MySQL tablolarının oluşturulması tamamlandı.');
        return true;
    } catch (error) {
        console.error('MySQL tabloları oluşturulurken hata:', error);
        return false;
    } finally {
        // Bağlantı havuzunu kapat
        try {
            await pool.end();
        } catch (err) {
            console.error('Bağlantı havuzu kapatılırken hata:', err);
        }
    }
};

// Script doğrudan çalıştırıldığında
if (require.main === module) {
    setupTables()
        .then((result) => {
            console.log('İşlem sonucu:', result ? 'Başarılı' : 'Başarısız');
            process.exit(result ? 0 : 1);
        })
        .catch((err) => {
            console.error('Beklenmeyen hata:', err);
            process.exit(1);
        });
}

module.exports = { setupTables }; 