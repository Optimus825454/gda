/**
 * Shelter.js - Barınak modeli
 */

const { supabase } = require( '../config/supabaseClient' );

class Shelter {
    /**
     * Yeni barınak oluşturur
     * @param {object} shelterData - Barınak bilgileri
     * @returns {Promise<object>} Oluşturulan barınak
     */
    static async create( shelterData ) {
        try {
            const { data, error } = await supabase
                .from( 'shelters' )
                .insert( [
                    {
                        name: shelterData.name,
                        description: shelterData.description,
                        capacity: shelterData.capacity,
                        location: shelterData.location,
                        status: shelterData.status || 'ACTIVE'
                    }
                ] )
                .select();

            if ( error ) throw error;
            return data[0];
        } catch ( error ) {
            console.error( 'Barınak oluşturma hatası:', error );
            throw error;
        }
    }

    /**
     * Tüm barınakları listeler
     * @returns {Promise<Array>} Barınak listesi
     */
    static async findAll() {
        try {
            const { data, error } = await supabase
                .from( 'shelters' )
                .select( `
                    *,
                    paddocks (*)
                `)
                .order( 'created_at', { ascending: false } );

            if ( error ) throw error;
            return data;
        } catch ( error ) {
            console.error( 'Barınak listeleme hatası:', error );
            throw error;
        }
    }

    /**
     * ID'ye göre barınak bulur
     * @param {string} id - Barınak ID'si
     * @returns {Promise<object>} Bulunan barınak
     */
    static async findById( id ) {
        try {
            const { data, error } = await supabase
                .from( 'shelters' )
                .select( `
                    *,
                    paddocks (*)
                `)
                .eq( 'id', id )
                .single();

            if ( error ) throw error;
            return data;
        } catch ( error ) {
            console.error( 'Barınak bulma hatası:', error );
            throw error;
        }
    }

    /**
     * Barınak günceller
     * @param {string} id - Barınak ID'si
     * @param {object} updateData - Güncellenecek alanlar
     * @returns {Promise<object>} Güncellenen barınak
     */
    static async update( id, updateData ) {
        try {
            const { data, error } = await supabase
                .from( 'shelters' )
                .update( updateData )
                .eq( 'id', id )
                .select();

            if ( error ) throw error;
            return data[0];
        } catch ( error ) {
            console.error( 'Barınak güncelleme hatası:', error );
            throw error;
        }
    }

    /**
     * Barınak siler
     * @param {string} id - Barınak ID'si
     * @returns {Promise<boolean>} Silme başarılı mı
     */
    static async delete( id ) {
        try {
            // Önce barınağa atanmış hayvanları kaldır
            await supabase
                .from( 'animals' )
                .update( { shelter_id: null, paddock_id: null } )
                .eq( 'shelter_id', id );

            // Sonra barınağa bağlı tüm padokları sil
            await supabase
                .from( 'paddocks' )
                .delete()
                .eq( 'shelter_id', id );

            // Son olarak barınağı sil
            const { error } = await supabase
                .from( 'shelters' )
                .delete()
                .eq( 'id', id );

            if ( error ) throw error;
            return true;
        } catch ( error ) {
            console.error( 'Barınak silme hatası:', error );
            throw error;
        }
    }

    /**
     * Barınaktaki hayvanları listeler
     * @param {string} shelterId - Barınak ID'si
     * @returns {Promise<Array>} Barınaktaki hayvanlar
     */
    static async getAnimals( shelterId ) {
        try {
            const { data, error } = await supabase
                .from( 'animals' )
                .select( '*' )
                .eq( 'shelter_id', shelterId );

            if ( error ) throw error;
            return data;
        } catch ( error ) {
            console.error( 'Barınak hayvanları listelerken hata:', error );
            throw error;
        }
    }

    /**
     * Barınağa hayvan atar
     * @param {string} shelterId - Barınak ID'si
     * @param {string} paddockId - Padok ID'si (opsiyonel)
     * @param {Array} animalIds - Hayvan ID'leri
     * @returns {Promise<boolean>} İşlem başarılı mı
     */
    static async assignAnimals( shelterId, paddockId, animalIds ) {
        try {
            const updateData = {
                shelter_id: shelterId
            };

            if ( paddockId ) {
                updateData.paddock_id = paddockId;
            }

            const { error } = await supabase
                .from( 'animals' )
                .update( updateData )
                .in( 'id', animalIds );

            if ( error ) throw error;
            return true;
        } catch ( error ) {
            console.error( 'Hayvan atama hatası:', error );
            throw error;
        }
    }
}

module.exports = Shelter;