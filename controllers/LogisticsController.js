/**
 * LogisticsController.js - Kesimhane operasyonları ve sevkiyat yönetimi kontrolcüsü
 */

const Logistics = require( '../models/Logistics' );
const Shipment = require( '../models/Shipment' );
const { supabase } = require( '../config/supabase' );

class LogisticsController {
    /**
     * Yeni operasyon kaydı oluşturur
     */
    async createOperation( req, res ) {
        try {
            const logistics = new Logistics( req.body );
            const result = await logistics.save();
            res.status( 201 ).json( result );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Operasyon detaylarını getirir
     */
    async getOperation( req, res ) {
        try {
            const { id } = req.params;
            const operation = await Logistics.findById( id );
            res.json( operation );
        } catch ( error ) {
            res.status( 404 ).json( { error: error.message } );
        }
    }

    /**
     * Tüm operasyonları listeler
     */
    async listOperations( req, res ) {
        try {
            const operations = await Logistics.findAll( req.query );
            res.json( operations );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Operasyon durumunu günceller
     */
    async updateOperationStatus( req, res ) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const operation = await Logistics.findById( id );
            const updated = await operation.updateStatus( status );
            res.json( updated );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Yeni sevkiyat kaydı oluşturur
     */
    async createShipment( req, res ) {
        try {
            const shipment = new Shipment( req.body );
            const result = await shipment.save();
            res.status( 201 ).json( result );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Sevkiyat detaylarını getirir
     */
    async getShipment( req, res ) {
        try {
            const { id } = req.params;
            const shipment = await Shipment.findById( id );
            res.json( shipment );
        } catch ( error ) {
            res.status( 404 ).json( { error: error.message } );
        }
    }

    /**
     * Tüm sevkiyatları listeler
     */
    async listShipments( req, res ) {
        try {
            const shipments = await Shipment.findAll( req.query );
            res.json( shipments );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Sevkiyat durumunu günceller
     */
    async updateShipmentStatus( req, res ) {
        try {
            const { id } = req.params;
            const { status, locationUpdate } = req.body;
            const shipment = await Shipment.findById( id );
            const updated = await shipment.updateStatus( status, locationUpdate );
            res.json( updated );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Günlük operasyon özetini getirir
     */
    async getDailyOperations( req, res ) {
        try {
            const { date } = req.query;
            const operations = await Logistics.getDailyOperations( date ? new Date( date ) : new Date() );
            res.json( operations );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Günlük sevkiyat özetini getirir
     */
    async getDailyShipments( req, res ) {
        try {
            const { date } = req.query;
            const shipments = await Shipment.getDailyShipments( date ? new Date( date ) : new Date() );
            res.json( shipments );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Operasyon ve sevkiyat istatistiklerini getirir
     */
    async getLogisticsStats( req, res ) {
        try {
            const [operationsSummary, shipmentsSummary] = await Promise.all( [
                Logistics.getOperationsSummary(),
                Shipment.getShipmentsSummary()
            ] );

            res.json( {
                operations: operationsSummary,
                shipments: shipmentsSummary
            } );
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }

    /**
     * Çevresel verileri günceller (sıcaklık, nem vb.)
     */
    async updateEnvironmentalData( req, res ) {
        try {
            const { id } = req.params;
            const { temperature, humidity } = req.body;

            if ( req.query.type === 'shipment' ) {
                const shipment = await Shipment.findById( id );
                const updated = await shipment.updateEnvironmentalData( temperature, humidity );
                res.json( updated );
            } else {
                const operation = await Logistics.findById( id );
                const updated = await operation.updateTemperature( temperature );
                res.json( updated );
            }
        } catch ( error ) {
            res.status( 400 ).json( { error: error.message } );
        }
    }
}

module.exports = new LogisticsController();