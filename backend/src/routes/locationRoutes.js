const express = require( 'express' );
const router = express.Router();
const LocationController = require( '../controllers/LocationController' );
const authMiddleware = require( '../middleware/auth' ); // İsim düzeltildi
const { checkPermission } = require( '../middleware/permissions' );
const {
    handleValidationErrors,
    validateCreateLocation,
    validateUpdateLocation,
    validateUpdateAnimal // Hayvan lokasyon güncellemesi için gerekli olabilir
} = require( '../middleware/validation' );
const { param, body } = require( 'express-validator' );


// Routes
router.get( '/',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:update' ), // İzin kontrolü eklendi
    LocationController.getAllLocations
);

router.get( '/available',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:read' ), // İzin kontrolü eklendi
    LocationController.getAvailableLocations
);

router.get( '/:id',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:read' ), // İzin kontrolü eklendi
    param( 'id' ).isUUID().withMessage( 'Geçersiz lokasyon ID' ),
    handleValidationErrors,
    LocationController.getLocation
);

router.get( '/:id/occupancy',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:read' ), // İzin kontrolü eklendi
    param( 'id' ).isUUID().withMessage( 'Geçersiz lokasyon ID' ),
    handleValidationErrors,
    LocationController.getOccupancyRate
);

router.get( '/:id/animals',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'animal:read' ), // İzin kontrolü eklendi
    param( 'id' ).isUUID().withMessage( 'Geçersiz lokasyon ID' ),
    handleValidationErrors,
    LocationController.getAnimalsInLocation
);

router.post( '/',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:create' ),
    validateCreateLocation, // Doğrulama middleware'i kullanıldı
    LocationController.createLocation
);

router.put( '/:id',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:update' ),
    validateUpdateLocation, // Doğrulama middleware'i kullanıldı
    LocationController.updateLocation
);

router.delete( '/:id',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'location:delete' ),
    param( 'id' ).isUUID().withMessage( 'Geçersiz lokasyon ID' ),
    handleValidationErrors,
    LocationController.deleteLocation
);

// Hayvan lokasyon güncelleme rotası (transfer yerine updateLocation kullanıldı)
router.patch( '/:id/animal/:animalId/location',
    authMiddleware, // İsim düzeltildi
    checkPermission( 'animal:update' ), // İzin kontrolü
    param( 'id' ).isUUID().withMessage( 'Geçersiz lokasyon ID' ),
    param( 'animalId' ).isUUID().withMessage( 'Geçersiz hayvan ID' ),
    body( 'reason' ).optional().trim(), // Taşıma nedeni
    handleValidationErrors,
    LocationController.updateAnimalLocation // Yeni controller metodu
);


module.exports = router;