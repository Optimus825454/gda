/**
 * HealthRecord.js - Sağlık kayıtları veri modeli
 */

const { supabase } = require( '../config/supabase' );

class HealthRecord {
    constructor( data = {} ) {
        this.id = data.id || null;
        this.animalId = data.animalId || null;
        this.testType = data.testType || '';
        this.testResult = data.testResult || '';
        this.performedBy = data.performedBy || '';
        this.testDate = data.testDate || new Date();
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static async findByAnimalId( animalId ) {
        const { data, error } = await supabase
            .from( 'health_records' )
            .select( '*' )
            .eq( 'animalId', animalId );

        if ( error ) {
            console.error( `AnimalID: ${animalId} için sağlık kayıtları getirilemedi:`, error );
            throw new Error( 'Sağlık kayıtları getirilemedi' );
        }

        return data || [];
    }

    static async findById( id ) {
        const { data, error } = await supabase
            .from( 'health_records' )
            .select( '*' )
            .eq( 'id', id )
            .single();

        if ( error ) {
            if ( error.code === 'PGRST116' ) {
                // Kayıt bulunamadı
                return null;
            }
            console.error( `ID: ${id} olan sağlık kaydını getirirken hata:`, error );
            throw new Error( 'Sağlık kaydı getirirken bir sorun oluştu' );
        }

        return data;
    }

    async saveTestResult() {
        const { data, error } = await supabase
            .from( 'health_records' )
            .insert( [{
                animalId: this.animalId,
                testType: this.testType,
                testResult: this.testResult,
                performedBy: this.performedBy,
                testDate: this.testDate,
                notes: this.notes
            }] )
            .select()
            .single();

        if ( error ) {
            console.error( 'Test sonucu kaydederken hata:', error );
            throw new Error( 'Test sonucu kaydedilemedi' );
        }

        return data;
    }
}

module.exports = HealthRecord;