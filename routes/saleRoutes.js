const express = require( 'express' );
const SaleController = require( '../controllers/saleController' ); // Doğru dosya adı (küçük harfle)
const { checkPermission } = require( '../middleware/permissions' );
const { PERMISSIONS } = require( '../config/permissionConstants' );
const auth = require( '../middleware/auth' );

const router = express.Router();

// Rota dosyasına giriş logu - GEÇİCİ DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] saleRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Bu router'daki tüm istekler için kimlik doğrulama uygula
router.use( auth );

// Satış listesini getir
router.get( '/',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.listSales
);

// Bekleyen satışları listele
router.get( '/pending',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.listPendingSales
);

// Satış istatistiklerini getir
router.get( '/statistics',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.getSaleStatistics
);

// Satış detayını getir
router.get( '/:id',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.getSaleById
);

// Yeni satış ekle
router.post( '/',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.createSale
);

// Toplu satış ekle
router.post( '/bulk',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.bulkCreateSales
);

// Satış durumunu güncelle
router.put( '/:id/status',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.updateSaleStatus
);

// Satış detaylarını güncelle
router.put( '/:id/details',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.updateSaleDetails
);

// Satışı güncelle
router.put( '/:id',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.updateSale
);

// Satışı sil
router.delete( '/:id',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.deleteSale
);

// Yeni alt menü sayfaları için rotalar
// 1. Satış Onaylama işlemleri
router.get(
    '/awaiting-approval',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.listAwaitingApproval
);

router.post(
    '/:id/approve',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.approveSale
);

router.post(
    '/:id/cancel',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.cancelSale
);

// 2. Fatura Yönetimi
router.get(
    '/invoices',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.listInvoices
);

router.get(
    '/invoices/:id',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.getInvoiceDetail
);

// 3. Detaylı Satış Raporları
router.get(
    '/reports/detailed',
    checkPermission( PERMISSIONS.MANAGE_SALES ),
    SaleController.getDetailedSaleReports
);

module.exports = router;