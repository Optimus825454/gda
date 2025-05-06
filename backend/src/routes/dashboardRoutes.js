const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authenticateToken = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/checkPermission');

// Dashboard verileri
router.get('/data', 
    authenticateToken,
    checkPermission(['VIEW_DASHBOARD']),
    DashboardController.getDashboardData
);

// Son aktiviteler
router.get('/activities',
    authenticateToken,
    checkPermission(['VIEW_DASHBOARD']),
    DashboardController.getRecentActivities
);

module.exports = router; 