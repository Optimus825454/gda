/**
 * logisticsRoutes.js - Kesimhane ve sevkiyat operasyonları için API rotaları
 */

const express = require( 'express' );
const router = express.Router();
const LogisticsController = require( '../controllers/LogisticsController' );
const auth = require( '../middleware/auth' );
const permissions = require( '../middleware/permissions' );

// Operasyon yönetimi rotaları
router.post( '/operations',
    auth,

    LogisticsController.createOperation
);

router.get( '/operations',
    auth,

    LogisticsController.listOperations
);

router.get( '/operations/:id',
    auth,

    LogisticsController.getOperation
);

router.patch( '/operations/:id/status',
    auth,

    LogisticsController.updateOperationStatus
);

// Sevkiyat yönetimi rotaları
router.post( '/shipments',
    auth,

    LogisticsController.createShipment
);

router.get( '/shipments',
    auth,

    LogisticsController.listShipments
);

router.get( '/shipments/:id',
    auth,

    LogisticsController.getShipment
);

router.patch( '/shipments/:id/status',
    auth,

    LogisticsController.updateShipmentStatus
);

// Çevresel veri yönetimi rotaları
router.patch( '/operations/:id/environmental',
    auth,

    LogisticsController.updateEnvironmentalData
);

router.patch( '/shipments/:id/environmental',
    auth,

    LogisticsController.updateEnvironmentalData
);

// Raporlama rotaları
router.get( '/daily-operations',
    auth,

    LogisticsController.getDailyOperations
);

router.get( '/daily-shipments',
    auth,

    LogisticsController.getDailyShipments
);

router.get( '/statistics',
    auth,

    LogisticsController.getLogisticsStats
);

module.exports = router;