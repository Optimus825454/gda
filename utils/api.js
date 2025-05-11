import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek gönderilmeden önce token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt işleme
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token geçersiz/süresi dolmuş
      localStorage.removeItem('token');
      // Auth sayfasına yönlendirme yapılabilir
    }
    return Promise.reject(error);
  }
);

/**
 * API hatalarını işle
 * @param {Error} error - Hata nesnesi
 * @param {string} defaultMessage - Varsayılan hata mesajı
 * @returns {Promise<Object>} - Hata objesi
 */
export const handleApiError = (error, defaultMessage = 'Bir hata oluştu') => {
  console.error('API Hatası:', error);
  
  let errorMessage = defaultMessage;
  
  if (error.response) {
    // Sunucu cevap döndü ama hata kodu var
    const responseData = error.response.data;
    
    if (responseData.error && responseData.error.message) {
      errorMessage = responseData.error.message;
    } else if (responseData.message) {
      errorMessage = responseData.message;
    } else if (typeof responseData === 'string') {
      errorMessage = responseData;
    }
  } else if (error.request) {
    // İstek yapıldı ama cevap dönmedi
    errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
  }
  
  toast.error(errorMessage);
  
  return Promise.reject({
    error: true,
    message: errorMessage,
    originalError: error
  });
};

/**
 * API yanıtlarını formatla
 * @param {Object} response - API yanıtı
 * @returns {Object} - Formatlanmış yanıt
 */
export const formatApiResponse = (response) => {
  return {
    data: response.data.data || response.data,
    metadata: response.data.metadata || {},
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

/**
 * Form verilerini API istekleri için hazırla
 * @param {Object} formData - Form verileri
 * @returns {Object} - API için hazırlanmış veri
 */
export const prepareFormData = (formData) => {
  const preparedData = { ...formData };
  
  // Boş stringleri null olarak ayarla
  Object.keys(preparedData).forEach(key => {
    if (preparedData[key] === '') {
      preparedData[key] = null;
    }
  });
  
  // Tarih nesnelerini API için formatla
  Object.keys(preparedData).forEach(key => {
    if (preparedData[key] instanceof Date) {
      preparedData[key] = preparedData[key].toISOString().split('T')[0];
    }
  });
  
  return preparedData;
};

/**
 * Sayfalama bilgisini oluştur
 * @param {number} page - Sayfa numarası
 * @param {number} pageSize - Sayfa boyutu
 * @returns {Object} - Sayfalama parametreleri
 */
export const getPaginationParams = (page, pageSize) => {
  return {
    page: page || 0,
    size: pageSize || 10
  };
};

/**
 * Arama ve filtreleme parametrelerini oluştur
 * @param {Object} filters - Filtre parametreleri
 * @returns {Object} - API için hazırlanmış filtreler
 */
export const getFilterParams = (filters = {}) => {
  const params = {};
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params[key] = filters[key];
    }
  });
  
  return params;
};

export default api; 