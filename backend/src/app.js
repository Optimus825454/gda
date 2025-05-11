const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { handleError } = require('./utils/errorHandler');

// Routes
const animalRoutes = require('./routes/animalRoutes');
const bloodSampleRoutes = require('./routes/bloodSampleRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/animals', animalRoutes);
app.use('/api/blood-samples', bloodSampleRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error('Global hata yakalayıcı:', err);
    handleError(res, err);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'İstenilen kaynak bulunamadı'
    });
});

module.exports = app; 