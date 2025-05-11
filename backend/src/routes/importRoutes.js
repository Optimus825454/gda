/**
 * importRoutes.js - CSV ve Excel dosyaları üzerinden toplu veri içe aktarma için API rotaları
 */

const express = require( 'express' );
const router = express.Router();
const ImportController = require( '../controllers/ImportController' );
const auth = require( '../middleware/auth' );
const { checkPermission } = require( '../middleware/permissions' );

// Rota dosyasına giriş logu
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] importRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Bu router'daki tüm istekler için kimlik doğrulama uygula
router.use( auth );

// CSV/Excel dosyasından hayvan verileri yükleme
router.post( '/animals/upload',
    checkPermission( 'WRITE_ANIMAL' ),
    ImportController.uploadAnimals
);

// Toplu test sonucu güncelleme
router.post( '/tests/bulk',
    checkPermission( 'MANAGE_TESTS' ),
    ImportController.bulkUpdateTestResults
);

// İçe aktarma şablonu indirme
router.get( '/templates/:type',
    ImportController.downloadTemplate
);

module.exports = router;