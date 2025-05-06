/**
 * LogisticsService.js - Kesimhane operasyonları ve sevkiyat yönetimi servisi
 */

const Logistics = require( '../models/Logistics' );
const Shipment = require( '../models/Shipment' );
const { supabase } = require( '../config/supabase' );

class LogisticsService {
    /**
     * Yeni operasyon başlatır
     */
    async startOperation( operationData ) {
        try {
            const logistics = new Logistics( operationData );
            await this.validateOperation( logistics );
            return await logistics.save();
        } catch ( error ) {
            throw new Error( `Operasyon başlatılamadı: ${error.message}` );
        }
    }

    /**
     * Operasyon validasyonu yapar
     */
    async validateOperation( logistics ) {
        const validation = logistics.validate();
        if ( !validation.valid ) {
            throw new Error( validation.errors.join( ', ' ) );
        }

        // Aynı parti numarasıyla aktif operasyon var mı kontrolü
        const existingOp = await Logistics.findByBatchNumber( logistics.batchNumber );
        if ( existingOp && existingOp.status !== Logistics.OPERATION_STATUS.TAMAMLANDI ) {
            throw new Error( 'Bu parti numarası için aktif bir operasyon zaten mevcut' );
        }
    }

    /**
     * Operasyon durumunu günceller ve ilgili aksiyonları tetikler
     */
    async updateOperationStatus( id, newStatus ) {
        try {
            const operation = await Logistics.findById( id );
            const updated = await operation.updateStatus( newStatus );

            // Durum değişikliğine göre ek aksiyonlar
            if ( newStatus === Logistics.OPERATION_STATUS.TAMAMLANDI ) {
                await this.handleCompletedOperation( operation );
            }

            return updated;
        } catch ( error ) {
            throw new Error( `Operasyon durumu güncellenemedi: ${error.message}` );
        }
    }

    /**
     * Tamamlanan operasyon için gerekli işlemleri yapar
     */
    async handleCompletedOperation( operation ) {
        // Kalite kontrol kaydı oluştur
        await this.createQualityCheck( operation );

        // Sevkiyata hazırlık
        if ( operation.processType === Logistics.PROCESS_TYPES.PAKETLEME ) {
            await this.prepareForShipment( operation );
        }
    }

    /**
     * Yeni sevkiyat planlar
     */
    async planShipment( shipmentData ) {
        try {
            const shipment = new Shipment( shipmentData );
            await this.validateShipment( shipment );
            return await shipment.save();
        } catch ( error ) {
            throw new Error( `Sevkiyat planlanamadı: ${error.message}` );
        }
    }

    /**
     * Sevkiyat validasyonu yapar
     */
    async validateShipment( shipment ) {
        const validation = shipment.validate();
        if ( !validation.valid ) {
            throw new Error( validation.errors.join( ', ' ) );
        }

        // Belirtilen partilerin sevkiyata uygunluğunu kontrol et
        for ( const batchNumber of shipment.batchNumbers ) {
            const operation = await Logistics.findByBatchNumber( batchNumber );
            if ( !operation || operation.status !== Logistics.OPERATION_STATUS.TAMAMLANDI ) {
                throw new Error( `Parti No ${batchNumber} sevkiyata uygun değil` );
            }
        }
    }

    /**
     * Sevkiyat durumunu günceller ve ilgili aksiyonları tetikler
     */
    async updateShipmentStatus( id, newStatus, locationUpdate = null ) {
        try {
            const shipment = await Shipment.findById( id );
            const updated = await shipment.updateStatus( newStatus, locationUpdate );

            // Durum değişikliğine göre ek aksiyonlar
            if ( newStatus === Shipment.SHIPMENT_STATUS.TESLIM_EDILDI ) {
                await this.handleDeliveredShipment( shipment );
            }

            return updated;
        } catch ( error ) {
            throw new Error( `Sevkiyat durumu güncellenemedi: ${error.message}` );
        }
    }

    /**
     * Teslim edilen sevkiyat için gerekli işlemleri yapar
     */
    async handleDeliveredShipment( shipment ) {
        // Teslimat dokümanlarını güncelle
        await this.updateDeliveryDocuments( shipment );
    }

    /**
     * Günlük operasyon planlaması yapar
     */
    async planDailyOperations( date = new Date() ) {
        try {
            const operations = await Logistics.getDailyOperations( date );
            return this.optimizeOperations( operations );
        } catch ( error ) {
            throw new Error( `Günlük operasyon planlaması yapılamadı: ${error.message}` );
        }
    }

    /**
     * Operasyonları optimize eder
     */
    optimizeOperations( operations ) {
        // Operasyonları öncelik ve süreye göre optimize et
        return operations.sort( ( a, b ) => b.priority - a.priority );
    }

    /**
     * Anlık operasyon ve sevkiyat durumunu raporlar
     */
    async getLogisticsStatus() {
        try {
            const [operations, shipments] = await Promise.all( [
                Logistics.findAll( { status: Logistics.OPERATION_STATUS.ISLEMDE } ),
                Shipment.findAll( { status: Shipment.SHIPMENT_STATUS.YOLDA } )
            ] );

            return {
                activeOperations: operations,
                activeShipments: shipments,
                summary: await this.generateStatusSummary( operations, shipments )
            };
        } catch ( error ) {
            throw new Error( `Durum raporu alınamadı: ${error.message}` );
        }
    }

    /**
     * Durum özeti oluşturur
     */
    async generateStatusSummary( operations, shipments ) {
        return {
            totalActiveOperations: operations.length,
            totalActiveShipments: shipments.length,
            operationsByType: this.groupOperationsByType( operations ),
            shipmentsByStatus: this.groupShipmentsByStatus( shipments )
        };
    }

    /**
     * Operasyonları tipine göre gruplar
     */
    groupOperationsByType( operations ) {
        return operations.reduce( ( acc, op ) => {
            acc[op.processType] = ( acc[op.processType] || 0 ) + 1;
            return acc;
        }, {} );
    }

    /**
     * Sevkiyatları durumuna göre gruplar
     */
    groupShipmentsByStatus( shipments ) {
        return shipments.reduce( ( acc, ship ) => {
            acc[ship.status] = ( acc[ship.status] || 0 ) + 1;
            return acc;
        }, {} );
    }
}

module.exports = new LogisticsService();