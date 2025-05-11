import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create( {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Basit kimlik doğrulamada, backend session veya cookie kullanmıyorsa
  // withCredentials: true ayarına gerek olmayabilir. Backend'inize bağlı.
} );

let _showLoading = () => { };
let _hideLoading = () => { };

export const setLoadingHooks = ( showLoading, hideLoading ) => {
  _showLoading = showLoading;
  _hideLoading = hideLoading;
};

// Her istekte kimlik doğrulama bilgilerini ekle
axiosInstance.interceptors.request.use(
    ( config ) => {
        const token = sessionStorage.getItem( 'token' );
        if ( token ) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        _showLoading( 'İşleniyor...' ); // Yükleme mesajı daha genel hale getirildi
        return config;
    },
    ( error ) => {
        _hideLoading();
        return Promise.reject( error );
    }
);

axiosInstance.interceptors.response.use(
  ( response ) => {
    _hideLoading();
    return response;
  },
  ( error ) => {
    _hideLoading();
    // 401 veya 403 durumunda özel bir işlem (örn: login'e yönlendirme) AuthContext içinde zaten var.
    // Burada sadece hatayı loglayabilir veya olduğu gibi bırakabiliriz.
    if ( error.response ) {
      console.error( 'API Yanıt Hatası:', error.response.data );
    } else if ( error.request ) {
      console.error( 'API İstek Hatası (Yanıt yok):', error.request );
    } else {
      console.error( 'Axios Kurulum Hatası:', error.message );
    }
    return Promise.reject( error );
  }
);

export default axiosInstance;