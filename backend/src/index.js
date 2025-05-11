require( 'dotenv' ).config();
const express = require( 'express' );
const cors = require( 'cors' );
const morgan = require( 'morgan' );
const helmet = require( 'helmet' );
const rateLimit = require( 'express-rate-limit' );
const authMiddleware = require( './middleware/authMiddleware' );
const { errorHandler } = require( './middleware/errorHandler' );
const { initDb, closeDb } = require( './utils/dbConnector' );

// Route imports
const authRoutes = require( './routes/authRoutes' );
const userRoutes = require( './routes/userRoutes' );
const animalRoutes = require( './routes/animalRoutes' );
const testRoutes = require( './routes/testRoutes' );
const saleRoutes = require( './routes/saleRoutes' );
const locationRoutes = require( './routes/locationRoutes' );
const settingRoutes = require( './routes/settingRoutes' );
const healthRoutes = require( './routes/healthRoutes' );
const logisticsRoutes = require( './routes/logisticsRoutes' );
const importRoutes = require( './routes/importRoutes' );
const constantsRoutes = require( './routes/constantsRoutes' );
const shelterRoutes = require( './routes/shelterRoutes' );
const dashboardRoutes = require( './routes/dashboardRoutes' );
const bloodSampleRoutes = require( './routes/bloodSampleRoutes' );

const app = express();

// Trust proxy for correct IP logging with rate limiting
app.set( 'trust proxy', 1 );

// Middleware
app.use( cors() );
app.use( helmet() );
app.use( morgan( 'dev' ) );
app.use( express.json() );
app.use( express.urlencoded( { extended: true } ) );

// Rate limiting
const limiter = rateLimit( {
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100 // IP başına istek limiti
} );
app.use( limiter );

// Base route
app.get( '/', ( req, res ) => {
    res.json( {
        message: 'GDA FlowSystems API',
        version: '1.0.0',
        status: 'active',
        developer: 'ErkanERDEM',
        dbType: 'MySQL'
    } );
} );

// Health check route
app.get( '/health', ( req, res ) => {
    res.json( {
        status: 'OK',
        timestamp: new Date().toISOString(),
        dbType: 'MySQL'
    } );
} );

// API routes
app.use( '/api/auth', authRoutes );
app.use( '/api/users', userRoutes );
app.use( '/api/animals', animalRoutes ); // authMiddleware kaldırıldı
app.use( '/api/blood-samples', bloodSampleRoutes ); // Kan numunesi route'u
app.use( '/api/tests', testRoutes ); // authMiddleware kaldırıldı
app.use( '/api/sales', saleRoutes ); // authMiddleware kaldırıldı
app.use( '/api/locations', locationRoutes ); // authMiddleware kaldırıldı
app.use( '/api/settings', settingRoutes ); // authMiddleware kaldırıldı
app.use( '/api/health-records', healthRoutes ); // authMiddleware kaldırıldı
app.use( '/api/logistics', logisticsRoutes ); // authMiddleware kaldırıldı
app.use( '/api/import', importRoutes ); // authMiddleware kaldırıldı
app.use( '/api/constants', constantsRoutes );
app.use( '/api/shelter', shelterRoutes ); // authMiddleware kaldırıldı
app.use( '/api/dashboard', dashboardRoutes ); // authMiddleware kaldırıldı

// Error handling
app.use( errorHandler );

// 404 handler
app.use( ( req, res ) => {
    res.status( 404 ).json( {
        success: false,
        message: 'İstenilen kaynak bulunamadı'
    } );
} );

const PORT = process.env.PORT || 5001;

// Veritabanı bağlantısını başlat
(async () => {
    try {
        const dbConnected = await initDb();
        
        // Express sunucusunu başlat
        app.listen(PORT, () => {
            console.log(`\n=== GDA FlowSystems API Sunucusu ===`);
            console.log(`- Port: ${PORT}`);
            console.log(`- Veritabanı: ${dbConnected ? 'Bağlı ✓' : 'Bağlantı Hatası ✗'}`);
            console.log(`- Ortam: ${process.env.NODE_ENV || 'development'}`);
            console.log(`=====================================\n`);
        });
    } catch (error) {
        console.error('Sunucu başlatma hatası:', error);
        process.exit(1);
    }
})();

// Uygulama kapatma işleyicisi
process.on('SIGINT', async () => {
    try {
        await closeDb();
        console.log('\nUygulama güvenli bir şekilde kapatıldı.');
        process.exit(0);
    } catch (error) {
        console.error('\nUygulama kapatma hatası:', error);
        process.exit(1);
    }
});

module.exports = { app };