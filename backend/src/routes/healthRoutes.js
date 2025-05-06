/**
 * healthRoutes.js - Sağlık kayıtları API rotaları
 */

const express = require( 'express' );
const router = express.Router();
const healthController = require( '../controllers/healthController' );

function isUUID( str ) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test( str );
}

// Sistem durumu kontrolü (health check)
router.get( '/system-status', healthController.checkSystemStatus );

// Tüm sağlık kayıtlarını getir
router.get( '/', healthController.getAllHealthRecords );

// Yaklaşan sağlık işlemlerini getir
router.get( '/upcoming', healthController.getUpcomingHealthRecords );

// Tarih aralığına göre sağlık kayıtlarını getir
router.get( '/date-range', healthController.getHealthRecordsByDateRange );

// Kayıt türüne göre sağlık kayıtlarını getir
router.get( '/type/:type', healthController.getHealthRecordsByType );

// Hayvan ID'sine göre sağlık kayıtlarını getir
router.get( '/animal/:animalId', healthController.getHealthRecordsByAnimalId );

// Belirli bir sağlık kaydını ID'ye göre getir
router.get( '/:id', ( req, res ) => {
    const { id } = req.params;
    if ( !isUUID( id ) ) {
        return res.status( 400 ).json( { error: 'Geçersiz sağlık kaydı ID formatı' } );
    }
    healthController.getHealthRecordById( req, res );
} );

// Yeni sağlık kaydı ekle
router.post( '/', healthController.createHealthRecord );

// Sağlık kaydını güncelle
router.put( '/:id', healthController.updateHealthRecord );

// Sağlık kaydını sil
router.delete( '/:id', healthController.deleteHealthRecord );

module.exports = router;