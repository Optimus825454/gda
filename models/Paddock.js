/**
 * Paddock.js - Padok (iç barınak/bölme) modeli
 */

const supabase = require( '../config/supabaseClient' );
const AuditLog = require( './AuditLog' );

class Paddock {
    /**
     * Tüm padokları getir
     * @returns {Promise<Array>} Padoklar listesi
     */
    static async getAll() {
        const { data, error } = await supabase
            .from( 'paddocks' )
            .select( '*' )
            .order( 'created_at', { ascending: false } );

        if ( error ) throw new Error( error.message );
        return data;
    }

    /**
     * Belirli bir padoğu getir
     * @param {string} id Padok ID
     * @returns {Promise<Object>} Padok detayları
     */
    static async getById( id ) {
        const { data, error } = await supabase
            .from( 'paddocks' )
            .select( `
                *,
                shelter:shelter_id(*),
                animals:animal_paddock_assignments(
                    animal:animal_id(*)
                )
            `)
            .eq( 'id', id )
            .single();

        if ( error ) throw new Error( error.message );

        // Data formatlama
        if ( data && data.animals ) {
            // Animal_paddock_assignments'ten hayvan nesnelerini çıkar
            data.animals = data.animals.map( assignment => assignment.animal );
        }

        return data;
    }

    /**
     * Barınağa ait padokları getir
     * @param {string} shelterId Barınak ID
     * @returns {Promise<Array>} Padoklar listesi
     */
    static async getByShelter( shelterId ) {
        const { data, error } = await supabase
            .from( 'paddocks' )
            .select( `
                *,
                animals:animal_paddock_assignments!inner(animal_id)
            `)
            .eq( 'shelter_id', shelterId )
            .order( 'name' );

        if ( error ) throw new Error( error.message );

        // Her bir padok için hayvan sayısını hesapla
        if ( data ) {
            for ( const paddock of data ) {
                paddock.current_count = paddock.animals.length;
                delete paddock.animals; // Detaylara gerek yok, sadece sayısını istiyoruz
            }
        }

        return data;
    }

    /**
     * Yeni padok oluştur
     * @param {Object} paddockData Padok verileri
     * @returns {Promise<Object>} Oluşturulan padok
     */
    static async create( paddockData ) {
        const { data, error } = await supabase
            .from( 'paddocks' )
            .insert( paddockData )
            .select()
            .single();

        if ( error ) throw new Error( error.message );

        // İşlemi denetle
        await AuditLog.log( {
            action: 'CREATE',
            entity_type: 'paddock',
            entity_id: data.id,
            details: `Yeni padok oluşturuldu: ${data.name}`
        } );

        return data;
    }

    /**
     * Padok güncelle
     * @param {string} id Padok ID
     * @param {Object} paddockData Güncellenecek veriler
     * @returns {Promise<Object>} Güncellenen padok
     */
    static async update( id, paddockData ) {
        const { data, error } = await supabase
            .from( 'paddocks' )
            .update( paddockData )
            .eq( 'id', id )
            .select()
            .single();

        if ( error ) throw new Error( error.message );

        // İşlemi denetle
        await AuditLog.log( {
            action: 'UPDATE',
            entity_type: 'paddock',
            entity_id: id,
            details: `Padok güncellendi: ${data.name}`
        } );

        return data;
    }

    /**
     * Padok sil
     * @param {string} id Padok ID
     * @returns {Promise<void>}
     */
    static async delete( id ) {
        // Önce padoğun adını al (denetleme için)
        const { data: paddock } = await supabase
            .from( 'paddocks' )
            .select( 'name' )
            .eq( 'id', id )
            .single();

        // Padokta hayvan var mı kontrol et
        const { count, error: countError } = await supabase
            .from( 'animal_paddock_assignments' )
            .select( '*', { count: 'exact', head: true } )
            .eq( 'paddock_id', id );

        if ( countError ) throw new Error( countError.message );

        if ( count > 0 ) {
            throw new Error( `Bu padokta ${count} hayvan bulunmaktadır. Silmeden önce hayvanları çıkarmalısınız.` );
        }

        // Padoğu sil
        const { error } = await supabase
            .from( 'paddocks' )
            .delete()
            .eq( 'id', id );

        if ( error ) throw new Error( error.message );

        // İşlemi denetle
        await AuditLog.log( {
            action: 'DELETE',
            entity_type: 'paddock',
            entity_id: id,
            details: `Padok silindi: ${paddock.name}`
        } );
    }

    /**
     * Padoktan hayvanları çıkar
     * @param {string} paddockId Padok ID
     * @param {Array<string>} animalIds Hayvan ID'leri
     * @returns {Promise<void>}
     */
    static async removeAnimals( paddockId, animalIds ) {
        // Hayvanları padoktan çıkar
        const { error } = await supabase
            .from( 'animal_paddock_assignments' )
            .delete()
            .eq( 'paddock_id', paddockId )
            .in( 'animal_id', animalIds );

        if ( error ) throw new Error( error.message );

        // İşlemi denetle
        await AuditLog.log( {
            action: 'UPDATE',
            entity_type: 'paddock',
            entity_id: paddockId,
            details: `${animalIds.length} hayvan padoktan çıkarıldı`
        } );
    }

    /**
     * Hayvanları bir padoktan diğerine transfer et
     * @param {string} sourcePaddockId Kaynak padok ID
     * @param {string} targetPaddockId Hedef padok ID
     * @param {Array<string>} animalIds Hayvan ID'leri
     * @returns {Promise<void>}
     */
    static async transferAnimals( sourcePaddockId, targetPaddockId, animalIds ) {
        // Hedef padoğun kapasitesini kontrol et
        const { data: targetPaddock, error: paddockError } = await supabase
            .from( 'paddocks' )
            .select( 'capacity' )
            .eq( 'id', targetPaddockId )
            .single();

        if ( paddockError ) throw new Error( paddockError.message );

        // Hedef padokta zaten kaç hayvan var?
        const { count: currentCount, error: countError } = await supabase
            .from( 'animal_paddock_assignments' )
            .select( '*', { count: 'exact', head: true } )
            .eq( 'paddock_id', targetPaddockId );

        if ( countError ) throw new Error( countError.message );

        // Kapasite kontrolü
        if ( targetPaddock.capacity && currentCount + animalIds.length > targetPaddock.capacity ) {
            throw new Error( `Hedef padoğun kapasitesi (${targetPaddock.capacity}) yetersiz. Şu anda ${currentCount} hayvan bulunuyor ve ${animalIds.length} hayvan daha transfer etmeye çalışıyorsunuz.` );
        }

        // Supabase transaction desteği kısıtlı olduğundan, işlemleri sırayla yapacağız

        // 1. Önce mevcut atamaları kaldır
        const { error: deleteError } = await supabase
            .from( 'animal_paddock_assignments' )
            .delete()
            .eq( 'paddock_id', sourcePaddockId )
            .in( 'animal_id', animalIds );

        if ( deleteError ) throw new Error( `Hayvanlar kaynak padoktan çıkarılırken hata: ${deleteError.message}` );

        // 2. Sonra yeni atamaları ekle
        const assignments = animalIds.map( animalId => ( {
            animal_id: animalId,
            paddock_id: targetPaddockId,
        } ) );

        const { error: insertError } = await supabase
            .from( 'animal_paddock_assignments' )
            .insert( assignments );

        if ( insertError ) throw new Error( `Hayvanlar hedef padoğa eklenirken hata: ${insertError.message}` );

        // İşlemi denetle
        await AuditLog.log( {
            action: 'UPDATE',
            entity_type: 'paddock',
            entity_id: sourcePaddockId,
            details: `${animalIds.length} hayvan başka bir padoğa (${targetPaddockId}) transfer edildi`
        } );
    }

    /**
     * Padoğa hayvanlar ata
     * @param {string} paddockId Padok ID
     * @param {Array<string>} animalIds Hayvan ID'leri
     * @returns {Promise<void>}
     */
    static async assignAnimals( paddockId, animalIds ) {
        // Padoğun kapasitesini kontrol et
        const { data: paddock, error: paddockError } = await supabase
            .from( 'paddocks' )
            .select( 'capacity' )
            .eq( 'id', paddockId )
            .single();

        if ( paddockError ) throw new Error( paddockError.message );

        // Padokta zaten kaç hayvan var?
        const { count: currentCount, error: countError } = await supabase
            .from( 'animal_paddock_assignments' )
            .select( '*', { count: 'exact', head: true } )
            .eq( 'paddock_id', paddockId );

        if ( countError ) throw new Error( countError.message );

        // Kapasite kontrolü
        if ( paddock.capacity && currentCount + animalIds.length > paddock.capacity ) {
            throw new Error( `Padoğun kapasitesi (${paddock.capacity}) yetersiz. Şu anda ${currentCount} hayvan bulunuyor ve ${animalIds.length} hayvan daha eklemeye çalışıyorsunuz.` );
        }

        // Hayvanların başka bir padokta olup olmadığını kontrol et
        const { data: existingAssignments, error: assignmentError } = await supabase
            .from( 'animal_paddock_assignments' )
            .select( 'animal_id, paddock_id' )
            .in( 'animal_id', animalIds );

        if ( assignmentError ) throw new Error( assignmentError.message );

        // Eğer hayvanlar zaten başka bir padoktaysa hata ver
        if ( existingAssignments && existingAssignments.length > 0 ) {
            const alreadyAssignedIds = existingAssignments.map( a => a.animal_id );
            throw new Error( `Bazı hayvanlar (${alreadyAssignedIds.join( ', ' )}) zaten bir padoğa atanmış durumda.` );
        }

        // Hayvanları padoğa ekle
        const assignments = animalIds.map( animalId => ( {
            animal_id: animalId,
            paddock_id: paddockId,
        } ) );

        const { error: insertError } = await supabase
            .from( 'animal_paddock_assignments' )
            .insert( assignments );

        if ( insertError ) throw new Error( insertError.message );

        // İşlemi denetle
        await AuditLog.log( {
            action: 'UPDATE',
            entity_type: 'paddock',
            entity_id: paddockId,
            details: `${animalIds.length} hayvan padoğa atandı`
        } );
    }
}

module.exports = Paddock;