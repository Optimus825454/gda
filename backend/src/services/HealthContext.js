/**
 * HealthContext.js - Sağlık kayıtları için veri erişim katmanı
 */

const HealthRecord = require('../models/HealthRecord');

class HealthContext {
  /**
   * Tüm sağlık kayıtlarını getirir
   * @returns {Promise<Array>} Sağlık kayıtları listesi
   */
  async getAllHealthRecords() {
    try {
      return await HealthRecord.findAll();
    } catch (error) {
      throw error;
    }
  }

  /**
   * ID'ye göre sağlık kaydı getirir
   * @param {string} id - Sağlık kaydı ID'si
   * @returns {Promise<Object|null>} Sağlık kaydı veya null
   */
  async getHealthRecordById(id) {
    try {
      return await HealthRecord.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Hayvan ID'sine göre sağlık kayıtlarını getirir
   * @param {string} animalId - Hayvan ID'si
   * @returns {Promise<Array>} Hayvanın sağlık kayıtları
   */
  async getHealthRecordsByAnimalId(animalId) {
    try {
      return await HealthRecord.findByAnimalId(animalId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sağlık kayıtlarını türüne göre getirir
   * @param {string} type - Kayıt türü (aşı, rutin kontrol vb.)
   * @returns {Promise<Array>} Filtrelenmiş sağlık kayıtları
   */
  async getHealthRecordsByType(type) {
    try {
      return await HealthRecord.findByType(type);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tarih aralığına göre sağlık kayıtlarını getirir
   * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD)
   * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD)
   * @returns {Promise<Array>} Tarih aralığındaki sağlık kayıtları
   */
  async getHealthRecordsByDateRange(startDate, endDate) {
    try {
      return await HealthRecord.findByDateRange(startDate, endDate);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Yeni sağlık kaydı oluşturur
   * @param {Object} healthData - Sağlık kaydı verileri
   * @returns {Promise<Object>} Oluşturulan sağlık kaydı
   */
  async createHealthRecord(healthData) {
    try {
      return await HealthRecord.create(healthData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sağlık kaydını günceller
   * @param {string} id - Güncellenecek sağlık kaydı ID'si
   * @param {Object} healthData - Güncellenecek veriler
   * @returns {Promise<Object>} Güncellenmiş sağlık kaydı
   */
  async updateHealthRecord(id, healthData) {
    try {
      return await HealthRecord.update(id, healthData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sağlık kaydını siler
   * @param {string} id - Silinecek sağlık kaydı ID'si
   * @returns {Promise<boolean>} İşlem başarı durumu
   */
  async deleteHealthRecord(id) {
    try {
      return await HealthRecord.delete(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = HealthContext;