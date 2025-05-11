/**
 * HealthService.js - Sağlık kayıtları için iş mantığı servisi
 */

const HealthProtocol = require( './HealthProtocol' );
const HealthContext = require( './HealthContext' );
const { supabase } = require( '../config/supabaseClient' ); // Supabase client'ı import et

class HealthService extends HealthProtocol {
    constructor() {
        super();
        // Veritabanı bağlamını (context) başlat
        // Gerçek uygulamada dependency injection kullanılabilir
        this.context = new HealthContext( supabase );
    }

    /**
     * Tüm sağlık kayıtlarını getirir.
     * @returns {Promise<Array>} Sağlık kayıtları listesi
     */
    async getAllHealthRecords() {
        try {
            return await this.context.getAllHealthRecords();
        } catch ( error ) {
            console.error( "Error fetching all health records:", error );
            throw new Error( 'Sağlık kayıtları getirilirken hata oluştu.' );
        }
    }

    /**
     * Belirli bir ID'ye sahip sağlık kaydını getirir.
     * @param {string} id - Sağlık kaydı ID'si
     * @returns {Promise<Object|null>} Sağlık kaydı veya bulunamazsa null
     */
    async getHealthRecordById( id ) {
        try {
            return await this.context.getHealthRecordById( id );
        } catch ( error ) {
            console.error( `Error fetching health record with ID ${id}:`, error );
            throw new Error( 'Sağlık kaydı getirilirken hata oluştu.' );
        }
    }

    /**
     * Belirli bir hayvana ait sağlık kayıtlarını getirir.
     * @param {string} animalId - Hayvan ID'si
     * @returns {Promise<Array>} Hayvana ait sağlık kayıtları listesi
     */
    async getHealthRecordsByAnimalId( animalId ) {
        try {
            return await this.context.getHealthRecordsByAnimalId( animalId );
        } catch ( error ) {
            console.error( `Error fetching health records for animal ID ${animalId}:`, error );
            throw new Error( 'Hayvana ait sağlık kayıtları getirilirken hata oluştu.' );
        }
    }

    /**
     * Belirli bir türe ait sağlık kayıtlarını getirir.
     * @param {string} type - Kayıt türü (örn. 'Aşılama', 'Tedavi')
     * @returns {Promise<Array>} Belirtilen türe ait sağlık kayıtları listesi
     */
    async getHealthRecordsByType( type ) {
        try {
            return await this.context.getHealthRecordsByType( type );
        } catch ( error ) {
            console.error( `Error fetching health records of type ${type}:`, error );
            throw new Error( 'Türe göre sağlık kayıtları getirilirken hata oluştu.' );
        }
    }

    /**
     * Belirli bir tarih aralığındaki sağlık kayıtlarını getirir.
     * @param {string|Date} startDate - Başlangıç tarihi
     * @param {string|Date} endDate - Bitiş tarihi
     * @returns {Promise<Array>} Tarih aralığındaki sağlık kayıtları listesi
     */
    async getHealthRecordsByDateRange( startDate, endDate ) {
        try {
            return await this.context.getHealthRecordsByDateRange( startDate, endDate );
        } catch ( error ) {
            console.error( `Error fetching health records between ${startDate} and ${endDate}:`, error );
            throw new Error( 'Tarih aralığına göre sağlık kayıtları getirilirken hata oluştu.' );
        }
    }

    /**
     * Yeni bir sağlık kaydı oluşturur.
     * @param {Object} healthData - Oluşturulacak sağlık kaydı verileri
     * @returns {Promise<Object>} Oluşturulan sağlık kaydı
     */
    async createHealthRecord( healthData ) {
        this.validateHealthRecord( healthData ); // Protokolden gelen doğrulama
        try {
            return await this.context.createHealthRecord( healthData );
        } catch ( error ) {
            console.error( "Error creating health record:", error );
            throw new Error( 'Sağlık kaydı oluşturulurken hata oluştu.' );
        }
    }

    /**
     * Mevcut bir sağlık kaydını günceller.
     * @param {string} id - Güncellenecek sağlık kaydı ID'si
     * @param {Object} healthData - Yeni sağlık kaydı verileri
     * @returns {Promise<Object>} Güncellenen sağlık kaydı
     */
    async updateHealthRecord( id, healthData ) {
        this.validateHealthRecord( healthData, false ); // Protokolden gelen doğrulama (isNew=false)
        try {
            return await this.context.updateHealthRecord( id, healthData );
        } catch ( error ) {
            console.error( `Error updating health record with ID ${id}:`, error );
            throw new Error( 'Sağlık kaydı güncellenirken hata oluştu.' );
        }
    }

    /**
     * Belirli bir ID'ye sahip sağlık kaydını siler.
     * @param {string} id - Silinecek sağlık kaydı ID'si
     * @returns {Promise<Object>} Silme işleminin sonucu
     */
    async deleteHealthRecord( id ) {
        try {
            return await this.context.deleteHealthRecord( id );
        } catch ( error ) {
            console.error( `Error deleting health record with ID ${id}:`, error );
            throw new Error( 'Sağlık kaydı silinirken hata oluştu.' );
        }
    }

    /**
     * Yaklaşan sağlık kayıtlarını (örn. aşı zamanı) getirir.
     * @param {number} daysAhead - Kaç gün ilerisine bakılacağı
     * @returns {Promise<Array>} Yaklaşan sağlık kayıtları listesi
     */
    async getUpcomingHealthRecords( daysAhead = 7 ) {
        // Bu metodun context'te karşılığı yoksa, burada implemente edilebilir
        // Örneğin, belirli bir tarih aralığını kullanarak filtreleme yapılabilir.
        try {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate( today.getDate() + daysAhead );

            // Varsayım: Context'te bu işlevsellik yoksa, mevcut metodları kullan
            // Gerçek implementasyon veritabanı şemasına bağlı olacaktır.
            // Örneğin, 'next_appointment_date' gibi bir alan varsa:
            // return await this.context.find({ next_appointment_date: { $gte: today, $lte: futureDate } });

            // Şimdilik basit bir filtreleme varsayalım (context'te yoksa)
            const allRecords = await this.context.getAllHealthRecords();
            return allRecords.filter( record => {
                // Kayıt türüne veya tarihine göre filtreleme mantığı buraya eklenebilir
                // Örnek: Sadece 'Aşılama' türündeki ve belirli bir tarih aralığındaki kayıtlar
                return record.type === 'Aşılama' // Örnek filtre
                    && record.date // Tarih alanı varsa
                    && new Date( record.date ) >= today
                    && new Date( record.date ) <= futureDate;
            } );

        } catch ( error ) {
            console.error( "Error fetching upcoming health records:", error );
            throw new Error( 'Yaklaşan sağlık kayıtları getirilirken hata oluştu.' );
        }
    }

    /**
     * Bir sağlık kaydına test sonucu ekler.
     * Bu metodun HealthContext'te doğrudan karşılığı yok gibi görünüyor.
     * Genellikle updateHealthRecord üzerinden veya ayrı bir TestResult modeli/servisi ile yapılır.
     * @param {string} healthRecordId - Sağlık kaydı ID'si
     * @param {Object} testResultData - Test sonucu verileri
     */
    async addTestResult( healthRecordId, testResultData ) {
        try {
            // 1. Sağlık kaydını bul
            const record = await this.context.getHealthRecordById( healthRecordId );
            if ( !record ) {
                throw new Error( 'Sağlık kaydı bulunamadı.' );
            }

            // 2. Test sonucunu kayda ekle (varsayımsal alan: 'test_results')
            const updatedResults = [...( record.test_results || [] ), testResultData];

            // 3. Sağlık kaydını güncelle
            return await this.context.updateHealthRecord( healthRecordId, { test_results: updatedResults } );

        } catch ( error ) {
            console.error( `Error adding test result to health record ${healthRecordId}:`, error );
            throw new Error( 'Test sonucu eklenirken hata oluştu.' );
        }
    }

    /**
     * Bir hayvanın tüm sağlık geçmişini getirir.
     * Bu genellikle getHealthRecordsByAnimalId ile aynıdır, ancak daha fazla detay içerebilir.
     * @param {string} animalId - Hayvan ID'si
     * @returns {Promise<Array>} Hayvanın sağlık geçmişi
     */
    async getAnimalHealthHistory( animalId ) {
        try {
            // Genellikle getHealthRecordsByAnimalId yeterlidir.
            // Farklı bir veri yapısı veya ek bilgi gerekiyorsa, burada özelleştirilebilir.
            return await this.getHealthRecordsByAnimalId( animalId );
        } catch ( error ) {
            console.error( `Error fetching health history for animal ID ${animalId}:`, error );
            throw new Error( 'Hayvan sağlık geçmişi getirilirken hata oluştu.' );
        }
    }

    /**
     * Sağlık sistemi durumunu kontrol eder (örn. bağlı servisler).
     * Bu genellikle ayrı bir sistem durumu kontrolcüsünde olur.
     */
    async checkSystemStatus() {
        // Bu metodun işlevi bağlama göre değişir.
        // Örneğin, dış servislerin (varsa) durumunu kontrol edebilir.
        // Şimdilik basit bir başarı durumu döndürelim.
        return { status: 'OK', message: 'Sağlık sistemi normal çalışıyor.' };
    }
}

module.exports = HealthService;
