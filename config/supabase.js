/**
 * MySQL geçiş süreci tamamlandı, bu dosya artık gereksiz
 * Uyumluluk için sahte bir istemci döndürüyoruz, sistemin çalışmasına engel olmaması için
 */
require('dotenv').config();

// Sahte Supabase admin istemci
const supabaseAdmin = {
    from: () => ({
        select: () => Promise.resolve({ data: [] }),
        insert: () => Promise.resolve({ data: null }),
        update: () => Promise.resolve({ data: null }),
        delete: () => Promise.resolve({ data: null })
    }),
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

// Sahte admin auth client
const adminAuthClient = supabaseAdmin.auth.admin;

console.log('MySQL geçişi tamamlandı, Supabase artık kullanılmıyor.');

module.exports = { supabaseAdmin, adminAuthClient };