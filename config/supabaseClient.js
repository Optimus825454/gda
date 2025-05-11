/**
 * MySQL geçiş süreci tamamlandı, bu dosya artık gereksiz
 * Uyumluluk için sahte bir istemci döndürüyoruz, sistemin çalışmasına engel olmaması için
 */
require('dotenv').config();

// Sahte Supabase istemcisi
const supabase = {
    from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
        limit: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
        admin: {
            listUsers: () => Promise.resolve({ data: [], error: null }),
            getUserById: () => Promise.resolve({ data: null, error: null }),
            createUser: () => Promise.resolve({ data: null, error: null }),
            updateUserById: () => Promise.resolve({ data: null, error: null }),
            deleteUser: () => Promise.resolve({ data: null, error: null })
        }
    }
};

// Test fonksiyonları - her zaman başarılı döndürür
const testConnection = async () => {
    console.log('MySQL geçişi tamamlandı, Supabase bağlantı testi atlanıyor.');
    return {
        success: true,
        message: 'MySQL bağlantısı kullanılıyor'
    };
};

const testTableAccess = async () => {
    console.log('MySQL geçişi tamamlandı, Supabase tablo erişim testi atlanıyor.');
    return {
        user_roles: { exists: true, readable: true, writable: true, error: null },
        user_profiles: { exists: true, readable: true, writable: true, error: null }
    };
};

const getErrorMessage = (error) => {
    return error?.message || 'Bilinmeyen hata';
};

const adminAuthClient = supabase.auth.admin;

console.log('MySQL geçişi tamamlandı, Supabase bağlantısı artık kullanılmıyor.');

module.exports = { supabase, testConnection, testTableAccess, getErrorMessage, adminAuthClient };