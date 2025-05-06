/**
 * Logistics.js - Kesimhane lojistik operasyonları veri modeli
 */

const { supabase } = require( '../config/supabase' );

class Logistics {
    static OPERATION_STATUS = {
        BEKLEMEDE: 'BEKLEMEDE',
        ISLEMDE: 'ISLEMDE',
        TAMAMLANDI: 'TAMAMLANDI',
        IPTAL: 'IPTAL'
    };

    static PROCESS_TYPES = {
        KESIM: 'KESIM',
        PARCALAMA: 'PARCALAMA',
        PAKETLEME: 'PAKETLEME'
    };

    static PRIORITY_LEVELS = {
        DUSUK: 1,
        ORTA: 2,
        YUKSEK: 3,
        ACIL: 4
    };

    constructor( data = {} ) {
        this.id = data.id;
        this.batchNumber = data.batch_number;
        this.animalIds = data.animal_ids || [];
        this.processType = data.process_type;
        this.startDate = data.start_date;
        this.estimatedEndDate = data.estimated_end_date;
        this.actualEndDate = data.actual_end_date;
        this.status = data.status || Logistics.OPERATION_STATUS.BEKLEMEDE;
        this.priority = data.priority || Logistics.PRIORITY_LEVELS.ORTA;
        this.assignedTeam = data.assigned_team;
        this.notes = data.notes || '';
        this.qualityScore = data.quality_score;
        this.temperature = data.temperature; // Soğuk zincir takibi için
        this.location = data.location;
        this.createdAt = data.created_at || new Date();
        this.updatedAt = data.updated_at || new Date();
    }

    validate() {
        const errors = [];

        if ( !this.batchNumber ) {
            errors.push( 'Parti numarası zorunludur' );
        }

        if ( !this.animalIds || this.animalIds.length === 0 ) {
            errors.push( 'En az bir hayvan ID\'si gereklidir' );
        }

        if ( !this.processType || !Object.values( Logistics.PROCESS_TYPES ).includes( this.processType ) ) {
            errors.push( 'Geçersiz işlem tipi' );
        }

        if ( !this.startDate ) {
            errors.push( 'Başlangıç tarihi zorunludur' );
        }

        if ( this.temperature !== undefined && ( this.temperature < -5 || this.temperature > 5 ) ) {
            errors.push( 'Sıcaklık -5°C ile 5°C arasında olmalıdır' );
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
            .from( 'logistics' )
            .upsert( {
                id: this.id,
                batch_number: this.batchNumber,
                animal_ids: this.animalIds,
                process_type: this.processType,
                start_date: this.startDate,
                estimated_end_date: this.estimatedEndDate,
                actual_end_date: this.actualEndDate,
                status: this.status,
                priority: this.priority,
                assigned_team: this.assignedTeam,
                notes: this.notes,
                quality_score: this.qualityScore,
                temperature: this.temperature,
                location: this.location,
                created_at: this.createdAt,
                updated_at: this.updatedAt
            } )
            .select();

        if ( error ) throw error;
        return new Logistics( data[0] );
    }

    static async findById( id ) {
        const { data, error } = await supabase
            .from( 'logistics' )
            .select( '*' )
            .eq( 'id', id )
            .maybeSingle();

        if ( error ) throw error;
        if ( !data ) throw new Error( 'Operasyon kaydı bulunamadı' );
        return new Logistics( data );
    }

    static async findByBatchNumber( batchNumber ) {
        const { data, error } = await supabase
            .from( 'logistics' )
            .select( '*' )
            .eq( 'batch_number', batchNumber )
            .maybeSingle();

        if ( error ) throw error;
        if ( !data ) throw new Error( 'Parti bulunamadı' );
        return new Logistics( data );
    }

    static async findAll( filters = {} ) {
        let query = supabase.from( 'logistics' ).select( '*' );

        if ( filters.status ) {
            query = query.eq( 'status', filters.status );
        }
        if ( filters.processType ) {
            query = query.eq( 'process_type', filters.processType );
        }
        if ( filters.priority ) {
            query = query.eq( 'priority', filters.priority );
        }

        const { data, error } = await query;
        if ( error ) throw error;
        return data.map( logistics => new Logistics( logistics ) );
    }

    async updateStatus( newStatus ) {
        if ( !Object.values( Logistics.OPERATION_STATUS ).includes( newStatus ) ) {
            throw new Error( 'Geçersiz durum' );
        }

        this.status = newStatus;
        if ( newStatus === Logistics.OPERATION_STATUS.TAMAMLANDI ) {
            this.actualEndDate = new Date();
        }

        return await this.save();
    }

    async updateTemperature( temperature ) {
        if ( temperature < -5 || temperature > 5 ) {
            throw new Error( 'Sıcaklık -5°C ile 5°C arasında olmalıdır' );
        }

        this.temperature = temperature;
        return await this.save();
    }

    static async getDailyOperations( date = new Date() ) {
        const startOfDay = new Date( date.setHours( 0, 0, 0, 0 ) );
        const endOfDay = new Date( date.setHours( 23, 59, 59, 999 ) );

        const { data, error } = await supabase
            .from( 'logistics' )
            .select( '*' )
            .gte( 'start_date', startOfDay.toISOString() )
            .lte( 'start_date', endOfDay.toISOString() );

        if ( error ) throw error;
        return data.map( logistics => new Logistics( logistics ) );
    }

    static async getOperationsSummary() {
        const { data, error } = await supabase
            .from( 'logistics' )
            .select( `
                process_type,
                status,
                count(*)
            `)
            .group( 'process_type, status' );

        if ( error ) throw error;
        return data;
    }
}

module.exports = Logistics;