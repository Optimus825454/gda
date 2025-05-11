/**
 * constantsRoutes.js - Sabit değerler için API rotaları
 */

const express = require( 'express' );
const AnimalController = require( '../controllers/animalController' );

const router = express.Router();

// Eski endpoint için hata mesajı
router.get( '/constants', ( req, res ) => {
    res.status( 410 ).json( {
        error: 'Bu endpoint artık kullanımdan kaldırıldı',
        message: 'Lütfen /api/animal-constants endpointini kullanın',
        newEndpoint: '/api/animal-constants'
    } );
} );

module.exports = router;
