/**
 * Shipment.js - Sevkiyat yönetimi veri modeli
 */

const { supabase } = require( '../config/supabase' );

class Shipment {
    static SHIPMENT_STATUS = {
        PLANLANMIS: 'PLANLANMIS',
        YUKLENIYOR: 'YUKLENIYOR',
        YOLDA: 'YOLDA',
        TESLIM_EDILDI: 'TESLIM_EDILDI',
        IPTAL: 'IPTAL'
    };

    static VEHICLE_TYPES = {
        KAMYON: 'KAMYON',
        KAMYONET: 'KAMYONET',
        TIR: 'TIR'
    };

    static PRIORITY_LEVELS = {
        NORMAL: 1,
        ONCELIKLI: 2,
        EKSPRES: 3
    };

    constructor( data = {} ) {
        this.id = data.id;
        this.shipmentNumber = data.shipment_number;
        this.batchNumbers = data.batch_numbers || []; // Logistics'ten gelen parti numaraları
        this.vehicleType = data.vehicle_type;
        this.vehiclePlate = data.vehicle_plate;
        this.driverInfo = data.driver_info;
        this.originLocation = data.origin_location;
        this.destinationLocation = data.destination_location;
        this.plannedDepartureTime = data.planned_departure_time;
        this.actualDepartureTime = data.actual_departure_time;
        this.estimatedArrivalTime = data.estimated_arrival_time;
        this.actualArrivalTime = data.actual_arrival_time;
        this.status = data.status || Shipment.SHIPMENT_STATUS.PLANLANMIS;
        this.priority = data.priority || Shipment.PRIORITY_LEVELS.NORMAL;
        this.temperature = data.temperature; // Soğuk zincir takibi
        this.humidity = data.humidity; // Nem takibi
        this.notes = data.notes || '';
        this.documents = data.documents || []; // Sevkiyat belgeleri
        this.createdAt = data.created_at || new Date();
        this.updatedAt = data.updated_at || new Date();
    }

    validate() {
        const errors = [];

        if ( !this.shipmentNumber ) {
            errors.push( 'Sevkiyat numarası zorunludur' );
        }

        if ( !this.batchNumbers || this.batchNumbers.length === 0 ) {
            errors.push( 'En az bir parti numarası gereklidir' );
        }

        if ( !this.vehicleType || !Object.values( Shipment.VEHICLE_TYPES ).includes( this.vehicleType ) ) {
            errors.push( 'Geçersiz araç tipi' );
        }

        if ( !this.vehiclePlate ) {
            errors.push( 'Araç plakası zorunludur' );
        } else if ( !/^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/.test( this.vehiclePlate ) ) {
            errors.push( 'Geçersiz plaka formatı' );
        }

        if ( !this.originLocation ) {
            errors.push( 'Çıkış lokasyonu zorunludur' );
        }

        if ( !this.destinationLocation ) {
            errors.push( 'Varış lokasyonu zorunludur' );
        }

        if ( !this.plannedDepartureTime ) {
            errors.push( 'Planlanan çıkış zamanı zorunludur' );
        }

        if ( this.temperature !== undefined && ( this.temperature < -5 || this.temperature > 5 ) ) {
            errors.push( 'Sıcaklık -5°C ile 5°C arasında olmalıdır' );
        }

        if ( this.humidity !== undefined && ( this.humidity < 0 || this.humidity > 100 ) ) {
            errors.push( 'Nem değeri 0-100 arasında olmalıdır' );
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async save() {
        const validation = this.validate();
        if ( !validation.valid ) {
            throw new Error( `Validasyon hatası: ${validation.errors.join( ', ' )}` );
        }

        this.updatedAt = new Date();

        const { data, error } = await supabase
            .from( 'shipments' )
            .upsert( {
                id: this.id,
                shipment_number: this.shipmentNumber,
                batch_numbers: this.batchNumbers,
                vehicle_type: this.vehicleType,
                vehicle_plate: this.vehiclePlate,
                driver_info: this.driverInfo,
                origin_location: this.originLocation,
                destination_location: this.destinationLocation,
                planned_departure_time: this.plannedDepartureTime,
                actual_departure_time: this.actualDepartureTime,
                estimated_arrival_time: this.estimatedArrivalTime,
                actual_arrival_time: this.actualArrivalTime,
                status: this.status,
                priority: this.priority,
                temperature: this.temperature,
                humidity: this.humidity,
                notes: this.notes,
                documents: this.documents,
                created_at: this.createdAt,
                updated_at: this.updatedAt
            } )
            .select();

        if ( error ) throw error;
        return new Shipment( data[0] );
    }

    static async findById( id ) {
        const { data, error } = await supabase
            .from( 'shipments' )
            .select( '*' )
            .eq( 'id', id )
            .maybeSingle();

        if ( error ) throw error;
        if ( !data ) throw new Error( 'Sevkiyat bulunamadı' );
        return new Shipment( data );
    }

    static async findByShipmentNumber( shipmentNumber ) {
        const { data, error } = await supabase
            .from( 'shipments' )
            .select( '*' )
            .eq( 'shipment_number', shipmentNumber )
            .maybeSingle();

        if ( error ) throw error;
        if ( !data ) throw new Error( 'Sevkiyat bulunamadı' );
        return new Shipment( data );
    }

    static async findAll( filters = {} ) {
        let query = supabase.from( 'shipments' ).select( '*' );

        if ( filters.status ) {
            query = query.eq( 'status', filters.status );
        }
        if ( filters.priority ) {
            query = query.eq( 'priority', filters.priority );
        }
        if ( filters.vehicleType ) {
            query = query.eq( 'vehicle_type', filters.vehicleType );
        }

        const { data, error } = await query;
        if ( error ) throw error;
        return data.map( shipment => new Shipment( shipment ) );
    }

    async updateStatus( newStatus, locationUpdate = null ) {
        if ( !Object.values( Shipment.SHIPMENT_STATUS ).includes( newStatus ) ) {
            throw new Error( 'Geçersiz sevkiyat durumu' );
        }

        this.status = newStatus;

        switch ( newStatus ) {
            case Shipment.SHIPMENT_STATUS.YOLDA:
                this.actualDepartureTime = new Date();
                break;
            case Shipment.SHIPMENT_STATUS.TESLIM_EDILDI:
                this.actualArrivalTime = new Date();
                break;
        }

        if ( locationUpdate ) {
            // Konum güncellemesi için ek alan eklenebilir
            this.currentLocation = locationUpdate;
        }

        return await this.save();
    }

    async updateEnvironmentalData( temperature, humidity ) {
        if ( temperature !== undefined ) {
            if ( temperature < -5 || temperature > 5 ) {
                throw new Error( 'Sıcaklık -5°C ile 5°C arasında olmalıdır' );
            }
            this.temperature = temperature;
        }

        if ( humidity !== undefined ) {
            if ( humidity < 0 || humidity > 100 ) {
                throw new Error( 'Nem değeri 0-100 arasında olmalıdır' );
            }
            this.humidity = humidity;
        }

        return await this.save();
    }

    static async getDailyShipments( date = new Date() ) {
        const startOfDay = new Date( date.setHours( 0, 0, 0, 0 ) );
        const endOfDay = new Date( date.setHours( 23, 59, 59, 999 ) );

        const { data, error } = await supabase
            .from( 'shipments' )
            .select( '*' )
            .gte( 'planned_departure_time', startOfDay.toISOString() )
            .lte( 'planned_departure_time', endOfDay.toISOString() )
            .order( 'planned_departure_time', { ascending: true } );

        if ( error ) throw error;
        return data.map( shipment => new Shipment( shipment ) );
    }

    static async getShipmentsSummary() {
        const { data, error } = await supabase
            .from( 'shipments' )
            .select( `
                status,
                vehicle_type,
                count(*)
            `)
            .group( 'status, vehicle_type' );

        if ( error ) throw error;
        return data;
    }
}

module.exports = Shipment;