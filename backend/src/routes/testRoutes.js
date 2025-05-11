const express = require( 'express' );
const TestController = require( '../controllers/testController' );
const { checkPermission } = require( '../middleware/permissions' );
const { PERMISSIONS } = require( '../config/permissionConstants' );
const auth = require( '../middleware/auth' );
const router = express.Router();

// Rota dosyasına giriş logu - GEÇİCİ DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] testRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Bu router'daki tüm istekler için kimlik doğrulama uygula
router.use( auth );

// Test Listeleme
router.get( '/',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.listTests
);

// Test Arama
router.get( '/search',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.searchTests
);

// Test Sonucu Kaydetme
router.post( '/',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.createTest
);

// Toplu Test Sonucu Kaydetme
router.post( '/bulk',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.bulkCreateTests
);

// Test İstatistikleri
router.get( '/statistics',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.getTestStatistics
);

// Test Durumu Güncelleme
router.put( '/:id/status',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.updateTestStatus
);

// Test Sonucu Güncelleme
router.put( '/:id/result',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.updateTestResult
);

// Kan Numunesi Alma Endpoint'i
router.post( '/blood-sample',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.addBloodSample
);

// Bekleyen Testler
router.get( '/pending',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.listPendingTests
);

// Dashboard Verileri
router.get('/dashboard',
    checkPermission( PERMISSIONS.MANAGE_TESTS ),
    TestController.getDashboardData
);

// Test listesi ve işlemleri
router.get('/:id', TestController.getTestById);
router.put('/:id', TestController.updateTest);
router.delete('/:id', TestController.deleteTest);

module.exports = router;
