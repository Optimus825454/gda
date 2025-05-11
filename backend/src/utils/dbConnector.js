/**
 * Veritabanı bağlantı yöneticisi
 * Şu anda sadece MySQL bağlantısını kullanıyor.
 */
const { pool } = require('../config/mysql');

/**
 * Veritabanı bağlantısını test et ve başlat
 */
const initDb = async () => {
    try {
        // Bağlantıyı test et
        const connection = await pool.getConnection();
        console.log('MySQL veritabanı bağlantısı başarılı.');
        
        // Test başarılı olduysa bağlantıyı serbest bırak
        connection.release();
        
        // Başarılı bağlantı mesajı
        console.log('Veritabanı bağlantı havuzu başarıyla oluşturuldu.');
        
        return true;
    } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
        console.error('MySQL veritabanı bağlantısı kurulamadı.');
        return false;
    }
};

/**
 * Veritabanı bağlantısını kapat
 */
const closeDb = async () => {
    try {
        await pool.end();
        console.log('Veritabanı bağlantısı kapatıldı.');
    } catch (error) {
        console.error('Veritabanı kapatma hatası:', error);
        throw error;
    }
};

/**
 * Genel sorgu çalıştırma fonksiyonu
 */
const runQuery = async (sql, params = []) => {
    return await pool.query(sql, params);
};

/**
 * Veritabanı bağlantısını geçici süreliğine bir işlem boyunca açar ve kapatır
 * Transaction işlemleri için kullanılabilir
 */
const withConnection = async (callback) => {
    const connection = await pool.getConnection();
    
    try {
        // Callback fonksiyonunu connection ile çağır
        const result = await callback(connection);
        return result;
    } finally {
        // Bağlantıyı her durumda serbest bırak
        connection.release();
    }
};

/**
 * Transaction (işlem) başlat, çalıştır ve sonlandır
 */
const withTransaction = async (callback) => {
    return await withConnection(async (connection) => {
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
};

module.exports = {
    initDb,
    closeDb,
    runQuery,
    withConnection,
    withTransaction,
    pool
}; 