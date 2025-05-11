/**
 * AnimalContext.js - Hayvan verileri için veri erişim katmanı (context)
 */

const Animal = require( '../models/Animal' );

class AnimalContext {
    /**
     * Tüm hayvanları getirir
     * @returns {Promise<Array>} Hayvan listesi
     */
    async findAll() {
        try {
            return await Animal.findAll();
        } catch ( error ) {
            console.error( 'Hayvanları getirme hatası:', error );
            throw error;
        }
    }

    /**
     * ID'ye göre hayvan getirir
     * @param {string} id - Hayvan ID'si
     * @returns {Promise<Object|null>} Bulunan hayvan veya null
     */
    async findById( id ) {
        try {
            return await Animal.findById( id );
        } catch ( error ) {
            console.error( `ID: ${id} olan hayvanı getirme hatası:`, error );
            throw error;
        }
    }

    /**
     * Türe göre hayvanları filtreler
     * @param {string} type - Hayvan türü
     * @returns {Promise<Array>} Filtrelenmiş hayvan listesi
     */
    async findByType( type ) {
        try {
            return await Animal.findByType( type );
        } catch ( error ) {
            console.error( `Tür: ${type} olan hayvanları getirme hatası:`, error );
            throw error;
        }
    }

    /**
     * Yeni hayvan oluşturur
     * @param {Object} animalData - Oluşturulacak hayvan verileri
     * @returns {Promise<Object>} Oluşturulan hayvan
     */
    async create( animalData ) {
        try {
            return await Animal.create( animalData );
        } catch ( error ) {
            console.error( 'Hayvan oluşturma hatası:', error );
            throw error;
        }
    }

    /**
     * Hayvan bilgilerini günceller
     * @param {string} id - Güncellenecek hayvan ID'si
     * @param {Object} animalData - Güncellenecek veriler
     * @returns {Promise<Object>} Güncellenmiş hayvan
     */
    async update( id, animalData ) {
        try {
            return await Animal.update( id, animalData );
        } catch ( error ) {
            console.error( `ID: ${id} olan hayvanı güncelleme hatası:`, error );
            throw error;
        }
    }

    /**
     * Hayvanı siler
     * @param {string} id - Silinecek hayvan ID'si
     * @returns {Promise<boolean>} Silme işlemi sonucu
     */
    async delete( id ) {
        try {
            return await Animal.delete( id );
        } catch ( error ) {
            console.error( `ID: ${id} olan hayvanı silme hatası:`, error );
            throw error;
        }
    }
}

module.exports = AnimalContext;