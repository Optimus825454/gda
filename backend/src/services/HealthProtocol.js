/**
 * HealthProtocol.js - Sağlık kayıtları için iş mantığı ve doğrulama katmanı
 */

const HealthContext = require('./HealthContext');

class HealthProtocol {
  constructor() {
    this.healthContext = new HealthContext();
  }

  /**
   * Sağlık kaydı verilerini doğrular
   * @param {Object} healthData - Doğrulanacak sağlık kaydı verileri
   * @returns {Object} Hata mesajları (varsa)
   */
  validateHealthRecord(healthData) {
    const errors = {};

    // Hayvan ID kontrolü
    if (!healthData.animal_id) {
      errors.animal_id = 'Hayvan ID gereklidir';
    }

    // Tarih kontrolü
    if (!healthData.date) {
      errors.date = 'Tarih gereklidir';
    } else {
      // Gelecek tarih kontrolü (özel durumlar dışında)
      const currentDate = new Date();
      const healthDate = new Date(healthData.date);
      
      if (healthDate > currentDate && healthData.type !== 'Planlanan') {
        errors.date = 'Gelecek tarih yalnızca "Planlanan" türündeki kayıtlar için geçerlidir';
      }
    }

    // Tür kontrolü
    if (!healthData.type) {
      errors.type = 'İşlem türü belirtilmelidir';
    }

    // Veteriner kontrolü
    if (healthData.type === 'Tedavi' && !healthData.veterinarian) {
      errors.veterinarian = 'Tedavi işlemleri için veteriner bilgisi gereklidir';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Tüm sağlık kayıtlarını getirir
   * @returns {Promise<Array>} Sağlık kayıtları listesi
   */
  async getAllHealthRecords() {
    return await this.healthContext.getAllHealthRecords();
  }

  /**
   * ID'ye göre sağlık kaydı getirir
   * @param {string} id - Sağlık kaydı ID'si
   * @returns {Promise<Object>} Sağlık kaydı
   * @throws {Error} Kayıt bulunamadığında hata fırlatır
   */
  async getHealthRecordById(id) {
    const healthRecord = await this.healthContext.getHealthRecordById(id);
    
    if (!healthRecord) {
      throw new Error(`ID: ${id} olan sağlık kaydı bulunamadı`);
    }
    
    return healthRecord;
  }

  /**
   * Hayvan ID'sine göre sağlık kayıtlarını getirir
   * @param {string} animalId - Hayvan ID'si
   * @returns {Promise<Array>} Hayvanın sağlık kayıtları
   */
  async getHealthRecordsByAnimalId(animalId) {
    return await this.healthContext.getHealthRecordsByAnimalId(animalId);
  }

  /**
   * Sağlık kayıtlarını türüne göre getirir
   * @param {string} type - Kayıt türü
   * @returns {Promise<Array>} Filtrelenmiş sağlık kayıtları
   */
  async getHealthRecordsByType(type) {
    return await this.healthContext.getHealthRecordsByType(type);
  }

  /**
   * Tarih aralığına göre sağlık kayıtlarını getirir
   * @param {string} startDate - Başlangıç tarihi
   * @param {string} endDate - Bitiş tarihi
   * @returns {Promise<Array>} Filtrelenmiş sağlık kayıtları
   */
  async getHealthRecordsByDateRange(startDate, endDate) {
    // Tarih formatı kontrolü
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new Error('Tarih formatı YYYY-MM-DD olmalıdır');
    }
    
    // Tarih sırası kontrolü
    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Başlangıç tarihi bitiş tarihinden sonra olamaz');
    }
    
    return await this.healthContext.getHealthRecordsByDateRange(startDate, endDate);
  }

  /**
   * Yeni sağlık kaydı oluşturur
   * @param {Object} healthData - Sağlık kaydı verileri
   * @returns {Promise<Object>} Oluşturulan sağlık kaydı
   * @throws {Error} Doğrulama hatalarında fırlatılır
   */
  async createHealthRecord(healthData) {
    // Veri doğrulama
    const validationErrors = this.validateHealthRecord(healthData);
    
    if (validationErrors) {
      throw new Error(JSON.stringify(validationErrors));
    }
    
    // Varsa tedavi sonucunu kontrol et ve hayvanın durumunu güncelle
    // Bu işlev gerçek uygulamada hayvanın sağlık durumunu da güncelleyebilir
    
    return await this.healthContext.createHealthRecord(healthData);
  }

  /**
   * Sağlık kaydını günceller
   * @param {string} id - Güncellenecek sağlık kaydı ID'si
   * @param {Object} healthData - Güncellenecek veriler
   * @returns {Promise<Object>} Güncellenmiş sağlık kaydı
   * @throws {Error} Kayıt bulunamadığında veya doğrulama hatalarında
   */
  async updateHealthRecord(id, healthData) {
    // Kaydın varlığını kontrol et
    const existingRecord = await this.healthContext.getHealthRecordById(id);
    
    if (!existingRecord) {
      throw new Error(`ID: ${id} olan sağlık kaydı bulunamadı`);
    }
    
    // Veri doğrulama
    const validationErrors = this.validateHealthRecord({
      ...existingRecord,
      ...healthData
    });
    
    if (validationErrors) {
      throw new Error(JSON.stringify(validationErrors));
    }
    
    return await this.healthContext.updateHealthRecord(id, healthData);
  }

  /**
   * Sağlık kaydını siler
   * @param {string} id - Silinecek sağlık kaydı ID'si
   * @returns {Promise<boolean>} İşlem başarı durumu
   * @throws {Error} Kayıt bulunamadığında
   */
  async deleteHealthRecord(id) {
    // Kaydın varlığını kontrol et
    const existingRecord = await this.healthContext.getHealthRecordById(id);
    
    if (!existingRecord) {
      throw new Error(`ID: ${id} olan sağlık kaydı bulunamadı`);
    }
    
    return await this.healthContext.deleteHealthRecord(id);
  }

  /**
   * Yaklaşan sağlık işlemlerini getirir
   * @param {number} daysAhead - Kaç gün içindeki işlemleri getireceği
   * @returns {Promise<Array>} Yaklaşan sağlık işlemleri
   */
  async getUpcomingHealthRecords(daysAhead = 7) {
    // Bugünün tarihi
    const today = new Date();
    
    // X gün sonraki tarih
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    // Tarih formatını YYYY-MM-DD'ye çevir
    const startDate = today.toISOString().split('T')[0];
    const endDate = futureDate.toISOString().split('T')[0];
    
    // Tarih aralığındaki kayıtları getir
    const records = await this.healthContext.getHealthRecordsByDateRange(startDate, endDate);
    
    // Sadece planlanan kayıtları filtrele
    return records.filter(record => record.type === 'Planlanan');
  }
}

module.exports = HealthProtocol;