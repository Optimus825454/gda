/**
 * AnimalProtocol.js - Hayvanlara özel operasyonları tanımlayan protokol
 */

class AnimalProtocol {
    /**
     * Bağlam nesnesi (context) üzerinde hayvan operasyonlarını gerçekleştirir
     * @param {Object} context - Animal Context nesnesi
     */
    constructor( context ) {
        this.context = context;
    }

    /**
     * Tüm hayvanları listeler
     * @returns {Promise<Array>} Hayvan listesi
     */
    async getAllAnimals() {
        try {
            return await this.context.findAll();
        } catch ( error ) {
            console.error( "Hayvanlar listelenirken hata:", error );
            throw new Error( "Hayvanlar listelenirken bir hata oluştu" );
        }
    }

    /**
     * ID'ye göre hayvanı getirir
     * @param {string} id - Hayvan ID'si
     * @returns {Promise<Object>} Hayvan nesnesi
     */
    async getAnimalById( id ) {
        try {
            const animal = await this.context.findById( id );
            if ( !animal ) {
                throw new Error( "Hayvan bulunamadı" );
            }
            return animal;
        } catch ( error ) {
            console.error( `ID: ${id} olan hayvan getirilirken hata:`, error );
            throw error;
        }
    }

    /**
     * Yeni hayvan ekler
     * @param {Object} animalData - Eklenecek hayvan verileri
     * @returns {Promise<Object>} Eklenen hayvan
     */
    async createAnimal( animalData ) {
        try {
            // Veri doğrulama
            this.validateAnimalData( animalData );
            return await this.context.create( animalData );
        } catch ( error ) {
            console.error( "Hayvan eklenirken hata:", error );
            throw error;
        }
    }

    /**
     * Hayvan bilgilerini günceller
     * @param {string} id - Güncellenecek hayvan ID'si
     * @param {Object} animalData - Güncellenecek veriler
     * @returns {Promise<Object>} Güncellenmiş hayvan
     */
    async updateAnimal( id, animalData ) {
        try {
            // Güncellemeden önce hayvanın var olup olmadığını kontrol et
            await this.getAnimalById( id );

            // Veri doğrulama
            this.validateAnimalData( animalData, false );

            // Güncelleme işlemini gerçekleştir
            return await this.context.update( id, animalData );
        } catch ( error ) {
            console.error( `ID: ${id} olan hayvan güncellenirken hata:`, error );
            throw error;
        }
    }

    /**
     * Hayvanı siler
     * @param {string} id - Silinecek hayvan ID'si
     * @returns {Promise<boolean>} Silme işlemi sonucu
     */
    async deleteAnimal( id ) {
        try {
            // Silmeden önce hayvanın var olup olmadığını kontrol et
            await this.getAnimalById( id );

            // Silme işlemini gerçekleştir
            return await this.context.delete( id );
        } catch ( error ) {
            console.error( `ID: ${id} olan hayvan silinirken hata:`, error );
            throw error;
        }
    }

    /**
     * Hayvan türüne göre filtreleme yapar
     * @param {string} type - Hayvan türü
     * @returns {Promise<Array>} Filtrelenmiş hayvan listesi
     */
    async getAnimalsByType( type ) {
        try {
            return await this.context.findByType( type );
        } catch ( error ) {
            console.error( `Tür: ${type} olan hayvanlar listelenirken hata:`, error );
            throw new Error( `${type} türündeki hayvanlar listelenirken bir hata oluştu` );
        }
    }

    /**
     * Hayvan verisinin doğruluğunu kontrol eder
     * @param {Object} data - Kontrol edilecek hayvan verisi
     * @param {boolean} isNew - Yeni kayıt mı, güncelleme mi?
     */
    validateAnimalData( data, isNew = true ) {
        // Zorunlu alanların kontrolü
        const requiredFields = ['name', 'type', 'birthDate'];

        if ( isNew ) {
            for ( const field of requiredFields ) {
                if ( !data[field] ) {
                    throw new Error( `${field} alanı zorunludur` );
                }
            }
        }

        // Alan tipi ve değer doğrulamaları
        if ( data.name && typeof data.name !== 'string' ) {
            throw new Error( 'Hayvan adı metin olmalıdır' );
        }

        if ( data.weight && isNaN( Number( data.weight ) ) ) {
            throw new Error( 'Ağırlık sayısal bir değer olmalıdır' );
        }

        if ( data.birthDate ) {
            const birthDate = new Date( data.birthDate );
            if ( isNaN( birthDate.getTime() ) ) {
                throw new Error( 'Geçersiz doğum tarihi formatı' );
            }

            // Doğum tarihi gelecek tarih olamaz
            if ( birthDate > new Date() ) {
                throw new Error( 'Doğum tarihi gelecek bir tarih olamaz' );
            }
        }
    }
}

module.exports = AnimalProtocol;