require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/authMiddleware');
const { errorHandler } = require('./middleware/errorHandler');
const { createSettingsTable, fixPermissionsTable, initAllPermissions } = require('./scripts/init');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const animalRoutes = require('./routes/animalRoutes');
const testRoutes = require('./routes/testRoutes');
const saleRoutes = require('./routes/saleRoutes');
const locationRoutes = require('./routes/locationRoutes');
const settingRoutes = require('./routes/settingRoutes');
const healthRoutes = require('./routes/healthRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const roleRoutes = require('./routes/roleRoutes');
const importRoutes = require('./routes/importRoutes');
const constantsRoutes = require('./routes/constantsRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Trust proxy for correct IP logging with rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100 // IP başına istek limiti
});
app.use(limiter);

// Base route
app.get('/', (req, res) => {
    res.json({
        message: 'GDA FlowSystems API',
        version: '1.0.0',
        status: 'active',
        developer: 'ErkanERDEM'
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/animals', authMiddleware, animalRoutes);
app.use('/api/tests', authMiddleware, testRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/locations', authMiddleware, locationRoutes);
app.use('/api/settings', authMiddleware, settingRoutes);
app.use('/api/health-records', authMiddleware, healthRoutes);
app.use('/api/logistics', authMiddleware, logisticsRoutes);
app.use('/api/roles', authMiddleware, roleRoutes);
app.use('/api/import', authMiddleware, importRoutes);
app.use('/api/constants', constantsRoutes);
app.use('/api/shelter', authMiddleware, shelterRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'İstenilen kaynak bulunamadı'
    });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
    // Initialize settings table and permissions before starting the server
    Promise.all([
        fixPermissionsTable(),
        createSettingsTable(),
        initAllPermissions()
    ])
    .then(() => {
        console.log('Veritabanı ve izinler hazırlandı. Sunucu başlatılıyor...');
        app.listen(PORT, () => {
            console.log(`Server ${PORT} portunda çalışıyor`);
            
            // Tüm API rotalarını logla
            console.log('===== TÜM API ROTALARI =====');
            const routes = app._router.stack
                .filter(r => r.route)
                .map(r => ({
                    path: r.route?.path,
                    methods: Object.keys(r.route?.methods || {})
                }));
            console.log(JSON.stringify(routes, null, 2));
            console.log('============================');
        });
    })
    .catch(error => {
        console.error('Veritabanı hazırlama hatası:', error);
        console.log('Hata oluştu, ancak sunucu başlatılıyor...');
        app.listen(PORT, () => {
            console.log(`Server ${PORT} portunda çalışıyor`);
        });
    });
}

module.exports = { app };