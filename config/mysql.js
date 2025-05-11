/**
 * MySQL Veritabanı Bağlantı Konfigürasyonu
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// Veritabanı bağlantı bilgileri
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'gdaflv',
    port: process.env.MYSQL_PORT || 3306,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 30,
    queueLimit: parseInt(process.env.MYSQL_QUEUE_LIMIT) || 5,
    enableKeepAlive: true,
    keepAliveInitialDelay: parseInt(process.env.MYSQL_KEEP_ALIVE_DELAY) || 10000,
    connectTimeout: parseInt(process.env.MYSQL_CONNECT_TIMEOUT) || 30000,
    maxIdle: parseInt(process.env.MYSQL_MAX_IDLE) || 10,
    idleTimeout: parseInt(process.env.MYSQL_IDLE_TIMEOUT) || 60000,
    debug: false,
    multipleStatements: true
};

// Bağlantı havuzu oluştur
const pool = mysql.createPool(dbConfig);

// Bağlantı yeniden deneme fonksiyonu
const retryConnection = async (maxRetries = 3, delay = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const connection = await pool.getConnection();
            connection.release();
            return true;
        } catch (error) {
            console.error(`[MySQL] Bağlantı denemesi ${i + 1}/${maxRetries} başarısız:`, error.message);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
};

// Bağlantı havuzu olay dinleyicileri
pool.on('connection', (connection) => {    
    connection.on('error', async (err) => {
        console.error('[MySQL] Bağlantı hatası:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            await retryConnection();
        }
    });
});

// Havuz durumunu periyodik olarak kontrol et
setInterval(async () => {
    try {
        await pool.query('SELECT 1');
    } catch (error) {
        console.error('[MySQL] Bağlantı havuzu sağlık kontrolü hatası:', error);
        await retryConnection();
    }
}, process.env.MYSQL_HEALTH_CHECK_INTERVAL || 60000);

// Uygulama kapatıldığında bağlantı havuzunu temizle
process.on('SIGINT', async () => {
    try {
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('[MySQL] Havuzu kapatılırken hata:', error);
        process.exit(1);
    }
});

module.exports = {
    pool,
    retryConnection
}; 