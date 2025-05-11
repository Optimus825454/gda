// MySQL'e geçiş yapıldı, artık Supabase kullanılmıyor
// Sahte bir istemci oluşturarak uyumluluk sağlıyoruz
import axios from 'axios';

// API URL'imiz
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Axios istemcisi oluştur
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Sahte Supabase istemcisi - uyumluluk için
export const supabase = {
    from: (table) => ({
        select: (columns) => {
            return {
                order: (column, { ascending } = {}) => {
                    return {
                        then: async (callback) => {
                            try {
                                const response = await api.get(`/${table}`);
                                return callback({ data: response.data.data || [], error: null });
                            } catch (error) {
                                console.error(`Veri çekme hatası (${table}):`, error);
                                return callback({ data: [], error: error });
                            }
                        }
                    };
                },
                eq: (column, value) => {
                    return {
                        then: async (callback) => {
                            try {
                                const response = await api.get(`/${table}?${column}=${value}`);
                                return callback({ data: response.data.data || [], error: null });
                            } catch (error) {
                                console.error(`Veri çekme hatası (${table}):`, error);
                                return callback({ data: [], error: error });
                            }
                        }
                    };
                },
                then: async (callback) => {
                    try {
                        const response = await api.get(`/${table}`);
                        return callback({ data: response.data.data || [], error: null });
                    } catch (error) {
                        console.error(`Veri çekme hatası (${table}):`, error);
                        return callback({ data: [], error: error });
                    }
                }
            };
        },
        insert: (data) => {
            return {
                then: async (callback) => {
                    try {
                        const response = await api.post(`/${table}`, data);
                        return callback({ data: response.data.data, error: null });
                    } catch (error) {
                        console.error(`Veri ekleme hatası (${table}):`, error);
                        return callback({ data: null, error: error });
                    }
                }
            };
        },
        update: (data) => {
            return {
                eq: (column, value) => {
                    return {
                        then: async (callback) => {
                            try {
                                const response = await api.put(`/${table}/${value}`, data);
                                return callback({ data: response.data.data, error: null });
                            } catch (error) {
                                console.error(`Veri güncelleme hatası (${table}):`, error);
                                return callback({ data: null, error: error });
                            }
                        }
                    };
                }
            };
        },
        delete: () => {
            return {
                eq: (column, value) => {
                    return {
                        then: async (callback) => {
                            try {
                                const response = await api.delete(`/${table}/${value}`);
                                return callback({ data: response.data.data, error: null });
                            } catch (error) {
                                console.error(`Veri silme hatası (${table}):`, error);
                                return callback({ data: null, error: error });
                            }
                        }
                    };
                }
            };
        }
    }),
    auth: {
        signIn: async ({ email, password }) => {
            try {
                const response = await api.post('/auth/login', { email, password });
                return { data: response.data, error: null };
            } catch (error) {
                console.error('Giriş hatası:', error);
                return { data: null, error: error };
            }
        },
        signUp: async ({ email, password }) => {
            try {
                const response = await api.post('/auth/register', { email, password });
                return { data: response.data, error: null };
            } catch (error) {
                console.error('Kayıt hatası:', error);
                return { data: null, error: error };
            }
        },
        signOut: async () => {
            try {
                const response = await api.post('/auth/logout');
                return { error: null };
            } catch (error) {
                console.error('Çıkış hatası:', error);
                return { error: error };
            }
        },
        session: () => {
            return { 
                data: { 
                    session: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null 
                }, 
                error: null 
            };
        },
        onAuthStateChange: (callback) => {
            // Gerçek bir state değişikliği izleme işlevselliği yok
            console.log('Auth state değişiklikleri artık izlenmiyor (MySQL geçişi nedeniyle)');
            return { 
                data: { subscription: { unsubscribe: () => {} } }, 
                error: null 
            };
        }
    }
};

// Hata mesajı yardımcısı
export const handleSupabaseError = (error) => {
    return {
        message: error?.response?.data?.error || error?.message || 'Bir hata oluştu',
        type: 'API_ERROR',
        original: error
    };
};

// API istemcisini de dışa aktar
export { api };

console.log('MySQL bağlantısı kullanılıyor, Supabase Client devre dışı bırakıldı.');
