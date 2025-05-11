import axios from 'axios';
import { handleApiError } from './api';

const BASE_URL = '/api/tests';

/**
 * Test işlemleri için servis fonksiyonları
 */
const testService = {
  /**
   * Tüm testleri getir
   * @returns {Promise<Array>} - Test listesi
   */
  getTests: async () => {
    try {
      const response = await axios.get(BASE_URL);
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error, 'Testler yüklenirken bir hata oluştu');
    }
  },

  /**
   * Belirli bir testi getir
   * @param {string} id - Test ID
   * @returns {Promise<Object>} - Test detayı
   */
  getTestById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Test detayı yüklenirken bir hata oluştu');
    }
  },

  /**
   * Yeni test kaydı oluştur
   * @param {Object} testData - Test verileri
   * @returns {Promise<Object>} - Oluşturulan test
   */
  createTest: async (testData) => {
    try {
      const response = await axios.post(BASE_URL, testData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Test kaydedilirken bir hata oluştu');
    }
  },

  /**
   * Test sonucu ekle/güncelle
   * @param {string} id - Test ID
   * @param {Object} resultData - Sonuç verileri
   * @returns {Promise<Object>} - Güncellenen test
   */
  updateTestResult: async (id, resultData) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}/result`, resultData);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Test sonucu güncellenirken bir hata oluştu');
    }
  },

  /**
   * Birden fazla test sonucu ekle
   * @param {Array} testResults - Test sonuçları dizisi
   * @returns {Promise<Object>} - Sonuç özeti
   */
  createBulkTestResults: async (testResults) => {
    try {
      const response = await axios.post(`${BASE_URL}/bulk-results`, { results: testResults });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Toplu test sonuçları kaydedilirken bir hata oluştu');
    }
  },

  /**
   * Test verilerini belirli filtrelerle getir
   * @param {Object} filters - Filtreler
   * @returns {Promise<Array>} - Filtrelenmiş test listesi
   */
  getFilteredTests: async (filters) => {
    try {
      const response = await axios.get(BASE_URL, { params: filters });
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error, 'Filtrelenmiş testler yüklenirken bir hata oluştu');
    }
  }
};

export default testService; 