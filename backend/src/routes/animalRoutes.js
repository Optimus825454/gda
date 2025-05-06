/**
 * animalRoutes.js - Hayvan işlemleri için API rotaları
 */

const express = require( 'express' );
const animalController = require( '../controllers/AnimalController' );
const { checkPermission } = require( '../middleware/permissions' );
const { PERMISSIONS } = require( '../config/permissionConstants' );
const authenticateToken = require( '../middleware/auth' );
const Animal = require( '../models/Animal' );

const router = express.Router();

// Ana rota dosyasına giriş logu - GEÇİCİ DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] animalRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Toplu hayvan şablonunu indirme endpoint'i - auth isteğe bağlı olarak ayarlanıyor
router.get('/template', (req, res) => {
    console.log('Template endpointi çağrıldı');
    animalController.downloadTemplate(req, res);
});

// Hayvan grupları için endpoint'ler
router.get( '/groups', authenticateToken, animalController.getAnimals );
router.get( '/blood-samples', authenticateToken, animalController.getBloodSamples );

// Hayvan önerilerini getir (arama çubuğu için)
router.get( '/suggestions', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.getAnimalSuggestions );

// Kategoriye göre hayvanları listele
router.get( '/category/:category', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.listByCategory );

// Test sonucuna göre hayvanları listele
router.get( '/test-result/:result', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.listByTestResult );

// Hedef şirkete göre hayvanları listele
router.get( '/destination/:company', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.listByDestination );

// Satış durumuna göre hayvanları listele
router.get( '/sale-status/:status', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.listBySaleStatus );

// Raporlar
router.get( '/reports', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.getReports );

// Detaylı rapor endpointleri
router.get('/reports/sold-animals', checkPermission(PERMISSIONS.READ_ANIMAL), async (req, res) => {
    try {
        // Satılan hayvanları getir
        const animals = await Animal.findBySaleStatus(Animal.SALE_STATUS.SATILDI);
        res.json({
            success: true,
            data: animals
        });
    } catch (error) {
        console.error('Satılan hayvanlar raporu alınırken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Satılan hayvanlar raporu alınırken hata oluştu'
        });
    }
});

router.get('/reports/pregnant-cows', checkPermission(PERMISSIONS.READ_ANIMAL), async (req, res) => {
    try {
        // Gebe inekleri getir
        const pregnantCows = await Animal.findByCategory('PREGNANT_COW');
        res.json({
            success: true,
            data: pregnantCows
        });
    } catch (error) {
        console.error('Gebe inekler raporu alınırken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Gebe inekler raporu alınırken hata oluştu'
        });
    }
});

// Test sonucu kaydı
router.post( '/:animalId/test-result', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.recordTestResult );

// Satış işlemi
router.post( '/:animalId/complete-sale', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.completeSale );

// Toplu işlemler
router.post( '/bulk-create', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.bulkCreate );
router.post( '/bulk-update', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.bulkUpdate );
router.post( '/bulk-test', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.bulkProcessTestResults );
router.post( '/bulk-sale', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.bulkCompleteSales );

// Temel CRUD işlemleri
router.get( '/', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.listAnimals );
router.post( '/', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.createAnimal );
router.get( '/:id', checkPermission( PERMISSIONS.READ_ANIMAL ), animalController.getAnimalById );
router.put( '/:id', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.updateAnimal );
router.delete( '/:id', checkPermission( PERMISSIONS.WRITE_ANIMAL ), animalController.deleteAnimal );

module.exports = router;
