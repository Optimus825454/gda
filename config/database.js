const mysql = require( 'mysql2/promise' );
require( 'dotenv' ).config(); // Ortam değişkenlerini yükle

const pool = mysql.createPool( {
    host: process.env.DB_HOST || '213.238.183.232',
    user: process.env.DB_USER || 'djerkan96',
    password: process.env.DB_PASSWORD || '518518Erkan',
    database: process.env.DB_DATABASE || 'gdaflv',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 50, // Bağlantı limitini artırdık
    queueLimit: 10, // Kuyruk limitini belirledik
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    maxIdle: 20, // Boşta bekleyen maksimum bağlantı sayısı
    idleTimeout: 60000, // Boşta bekleyen bağlantıların timeout süresi
    acquireTimeout: 30000, // Bağlantı alma zaman aşımı
    debug: false,
    multipleStatements: true
} );

// Bağlantı havuzu durumunu kontrol et
setInterval(async () => {
    try {
        const [rows] = await pool.query('SELECT 1');
        console.log('[MySQL] Bağlantı havuzu sağlık kontrolü başarılı');
    } catch (err) {
        console.error('[MySQL] Bağlantı havuzu sağlık kontrolü hatası:', err);
    }
}, 30000);

// Bağlantı havuzu olaylarını dinle
pool.on('connection', (connection) => {
    console.log('[MySQL] Yeni bağlantı oluşturuldu');
    
    connection.on('error', (err) => {
        console.error('[MySQL] Bağlantı hatası:', err);
    });
});

pool.on('acquire', (connection) => {
    console.log('[MySQL] Bağlantı alındı');
});

pool.on('release', (connection) => {
    console.log('[MySQL] Bağlantı serbest bırakıldı');
});

// Uygulama kapatıldığında bağlantı havuzunu temizle
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('[MySQL] Bağlantı havuzu başarıyla kapatıldı');
        process.exit(0);
    } catch (err) {
        console.error('[MySQL] Bağlantı havuzu kapatılırken hata:', err);
        process.exit(1);
    }
});

// Bağlantı havuzunu dışa aktar
module.exports = pool;

// Bağlantı testi (isteğe bağlı)
pool.getConnection()
    .then( connection => {
        console.log( 'Veritabanı bağlantı havuzu başarıyla oluşturuldu.' );
        connection.release(); // Bağlantıyı hemen serbest bırak
    } )
    .catch( err => {
        console.error( 'Veritabanı bağlantı havuzu oluşturulurken hata:', err.message );
        // Uygulamanın başlamasını engellemek isteyebilirsiniz
        // process.exit(1); 
    } );
