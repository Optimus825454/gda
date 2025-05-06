const { supabase } = require( '../config/supabaseClient' );

class Location {
    constructor( data = {} ) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.capacity = data.capacity;
        this.status = data.status;
        this.notes = data.notes;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async getAll() {
        const { data, error } = await supabase
            .from( 'locations' )
            .select( '*' )
            .order( 'name' );

        if ( error ) throw error;
        return data.map( loc => new Location( loc ) );
    }

    static async getById( id ) {
        const { data, error } = await supabase
            .from( 'locations' )
            .select( '*' )
            .eq( 'id', id )
            .single();

        if ( error ) throw error;
        return data ? new Location( data ) : null;
    }

    static async getByType( type ) {
        const { data, error } = await supabase
            .from( 'locations' )
            .select( '*' )
            .eq( 'type', type )
            .order( 'name' );

        if ( error ) throw error;
        return data.map( loc => new Location( loc ) );
    }

    static async getAvailableLocations( type = null ) {
        let query = supabase
            .from( 'locations' )
            .select( `
                *,
                animals:animals(count)
            `)
            .eq( 'status', 'AKTIF' );

        if ( type ) {
            query = query.eq( 'type', type );
        }

        const { data, error } = await query;

        if ( error ) throw error;

        return data
            .filter( loc => ( loc.animals?.count || 0 ) < loc.capacity )
            .map( loc => new Location( loc ) );
    }

    async save() {
        const { data, error } = await supabase
            .from( 'locations' )
            .upsert( {
                id: this.id,
                name: this.name,
                type: this.type,
                capacity: this.capacity,
                status: this.status || 'AKTIF',
                notes: this.notes,
                updated_at: new Date()
            } )
            .select()
            .single();

        if ( error ) throw error;
        return new Location( data );
    }

    async delete() {
        // Önce bu lokasyonda aktif hayvan var mı kontrol et
        const { data: animals, error: countError } = await supabase
            .from( 'animals' )
            .select( 'id' )
            .eq( 'current_location_id', this.id )
            .eq( 'status', 'AKTIF' );

        if ( countError ) throw countError;

        if ( animals?.length > 0 ) {
            throw new Error( 'Bu lokasyonda aktif hayvanlar bulunmaktadır. Silme işlemi yapılamaz.' );
        }

        const { error } = await supabase
            .from( 'locations' )
            .delete()
            .eq( 'id', this.id );

        if ( error ) throw error;
        return true;
    }

    // Lokasyon doluluk oranını hesapla
    async getOccupancyRate() {
        const { data, error } = await supabase
            .from( 'animals' )
            .select( 'id' )
            .eq( 'current_location_id', this.id )
            .eq( 'status', 'AKTIF' );

        if ( error ) throw error;

        const currentCount = data?.length || 0;
        return {
            current: currentCount,
            capacity: this.capacity,
            rate: ( currentCount / this.capacity ) * 100
        };
    }

    // Lokasyondaki hayvanları listele
    async getAnimals() {
        const { data, error } = await supabase
            .from( 'animals' )
            .select( `
                *,
                blood_samples (
                    id,
                    tag_number,
                    sample_date
                )
            `)
            .eq( 'current_location_id', this.id )
            .eq( 'status', 'AKTIF' );

        if ( error ) throw error;
        return data;
    }

    // Lokasyon geçmiş kaydını tut
    async logTransfer( animalId, userId, notes = '' ) {
        const { data, error } = await supabase
            .from( 'animal_locations' )
            .insert( {
                animal_id: animalId,
                location_id: this.id,
                start_date: new Date(),
                notes: notes,
                created_by: userId
            } );

        if ( error ) throw error;
        return data;
    }
}

module.exports = Location;