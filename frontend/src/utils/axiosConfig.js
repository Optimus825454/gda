import axios from 'axios';
import { supabase } from '../supabaseClient';

const axiosInstance = axios.create({
    // Netlify Functions için baseURL güncellendi
    baseURL: process.env.REACT_APP_API_URL || '/.netlify/functions/api',
    timeout: 15000, // Timeout değerini arttırdım
    // Yeniden deneme ayarları
    retry: 3,
    retryDelay: 1000
});

// Token yönetimi için yardımcı fonksiyonlar
const tokenManager = {
    isRefreshing: false,
    failedQueue: [],
    
    onTokenRefreshed: (token) => {
        tokenManager.failedQueue.forEach(prom => prom.resolve(token));
        tokenManager.failedQueue = [];
    },
    
    onRefreshError: (error) => {
        tokenManager.failedQueue.forEach(prom => prom.reject(error));
        tokenManager.failedQueue = [];
    },

    addToQueue: () => {
        return new Promise((resolve, reject) => {
            tokenManager.failedQueue.push({ resolve, reject });
        });
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    setToken: (token) => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    },

    refreshToken: async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) throw sessionError;
            
            if (session?.access_token) {
                tokenManager.setToken(session.access_token);
                return session.access_token;
            }
            
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) throw refreshError;
            
            if (data?.session?.access_token) {
                tokenManager.setToken(data.session.access_token);
                return data.session.access_token;
            }
            
            throw new Error('Token yenilenemedi');
        } catch (error) {
            console.error('Token yenileme hatası:', error);
            tokenManager.setToken(null);
            throw error;
        }
    }
};

// İstek interceptor'u
axiosInstance.interceptors.request.use(
    async (config) => {
        if (!config.headers.Authorization) {
            const token = tokenManager.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Yanıt interceptor'u
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Ağ hatası veya timeout durumunda yeniden dene
        if (!error.response && originalRequest.retry > 0) {
            originalRequest.retry--;
            await new Promise(resolve => setTimeout(resolve, originalRequest.retryDelay));
            return axiosInstance(originalRequest);
        }

        // 401 hatası ve token yenileme gerekiyorsa
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (tokenManager.isRefreshing) {
                try {
                    const token = await tokenManager.addToQueue();
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            tokenManager.isRefreshing = true;
            originalRequest._retry = true;

            try {
                const token = await tokenManager.refreshToken();
                tokenManager.onTokenRefreshed(token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            } catch (error) {
                tokenManager.onRefreshError(error);
                // Sadece oturumu temizle, yönlendirmeyi AuthContext yönetecek
                await supabase.auth.signOut();
                return Promise.reject(error);
            } finally {
                tokenManager.isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const { getToken, setToken } = tokenManager;
export default axiosInstance;