/**
 * Supabase API bağlantısı - Geliştirilmiş hata yönetimi ve yeniden deneme mekanizması ile
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    console.error('Supabase bağlantı bilgileri eksik. Lütfen .env dosyasını kontrol edin.');
    process.exit(1);
}

// Debug log
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'Eksik');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'OK' : 'Eksik');

const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY; // veya SUPABASE_ANON_KEY kullanabilirsiniz

// Debug log
console.log('Supabase bağlantısı başlatılıyor...');
console.log(`URL: ${supabaseUrl.substring(0, 8)}...`); // URL'nin tamamını göstermeyin
console.log(`Anahtar uzunluğu: ${supabaseKey.length}`); // Anahtarın kendisini göstermeyin, sadece uzunluğunu

// Supabase istemcisini oluştur - Geliştirilmiş hata yönetimi ile
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    // Daha uzun timeout süresi ve retry mekanizması ekle
    global: {
        fetch: (...args) => {
            return fetch(...args).catch(err => {
                console.error('Fetch hatası:', err.message);
                // Hata durumunda boş bir yanıt döndür, böylece uygulama çökmez
                return new Response(JSON.stringify({
                    error: {
                        message: 'Network error: ' + err.message,
                        code: 'NETWORK_ERROR'
                    }
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            });
        }
    },
    db: {
        schema: 'public'
    },
    // Daha uzun timeout süresi
    realtime: {
        timeout: 60000 // 60 saniye
    }
});

// Hata kodlarına göre açıklayıcı mesajlar sağlayan yardımcı fonksiyon
const getErrorMessage = (error) => {
    if (!error) return 'Bilinmeyen hata';

    // Hata koduna göre özelleştirilmiş mesajlar
    const errorMessages = {
        '42501': 'Veritabanı tablo erişim izni hatası. Supabase yönetici panelinden RLS ayarlarını kontrol edin.',
        '42P01': 'Veritabanı tablosu bulunamadı. Tabloların oluşturulduğundan emin olun.',
        'PGRST116': 'Sonuç bulunamadı.',
        '23505': 'Benzersizlik kısıtlaması ihlal edildi. Bu kayıt zaten mevcut.',
        '23503': 'Yabancı anahtar kısıtlaması ihlal edildi. İlişkili kayıt bulunamadı.',
        'NETWORK_ERROR': 'Ağ bağlantı hatası. İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.'
    };

    return errorMessages[error.code] || error.message || 'Veritabanı işlemi başarısız oldu.';
};

// Bağlantıyı test et - Yeniden deneme mekanizması ile
const testConnection = async (retryCount = 3, retryDelay = 1000) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            console.log(`Supabase bağlantısı test ediliyor... (Deneme ${attempt}/${retryCount})`);

            // Basit bir sorgu ile test et
            const { data, error } = await supabase
                .from('user_roles') // veya tablolarınızdan biri
                .select('count')
                .limit(1);

            if (error) {
                // Ağ hatası durumunda yeniden dene
                if (error.code === 'NETWORK_ERROR') {
                    console.warn(`Ağ hatası, yeniden deneniyor (${attempt}/${retryCount})...`);
                    lastError = error;
                    
                    if (attempt < retryCount) {
                        // Bekle ve yeniden dene
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    }
                }
                
                console.error('Supabase bağlantı hatası:', error);

                // İzin hatası kontrolü
                if (error.code === '42501') {
                    console.error('İzin hatası tespit edildi! RLS politikalarını güncellemeniz gerekiyor.');
                    console.error('SQL: ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;');
                }
                // Şema sorgulamasında hata
                else if (error.message?.includes('schema') || error.code === '42P01') {
                    console.error('Şema sorgulamasında hata oluştu. Bu API anahtarının yeterli yetkisi olmayabilir.');
                    console.error('Servis rolü anahtarının (service_role) kullanıldığından emin olun.');
                }

                return {
                    success: false,
                    error: getErrorMessage(error),
                    details: error
                };
            }

            console.log('Supabase bağlantısı başarılı!');
            return {
                success: true,
                message: 'Bağlantı başarılı'
            };
        } catch (err) {
            console.error(`Supabase bağlantısı test edilirken hata (Deneme ${attempt}/${retryCount}):`, err);
            lastError = err;
            
            if (attempt < retryCount) {
                // Bekle ve yeniden dene
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    
    // Tüm denemeler başarısız oldu
    return {
        success: false,
        error: lastError?.message || 'Bağlantı kurulamadı',
        details: lastError
    };
};

// Her bir tabloya erişimi ayrı ayrı test eden fonksiyon - Yeniden deneme mekanizması ile
const testTableAccess = async (retryCount = 2) => {
    const tables = ['user_roles', 'user_profiles'];
    const results = {};

    for (const table of tables) {
        let success = false;
        let lastError = null;
        
        for (let attempt = 1; attempt <= retryCount && !success; attempt++) {
            try {
                console.log(`${table} tablosuna erişim test ediliyor... (Deneme ${attempt}/${retryCount})`);

                // SELECT işlemi test et
                const { data: selectData, error: selectError } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);

                // Ağ hatası durumunda yeniden dene
                if (selectError && selectError.code === 'NETWORK_ERROR') {
                    console.warn(`Ağ hatası, yeniden deneniyor (${attempt}/${retryCount})...`);
                    lastError = selectError;
                    
                    if (attempt < retryCount) {
                        // Bekle ve yeniden dene
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    }
                }

                // Her tabloya INSERT yapma yetkisi var mı kontrol et (gerçekten ekleme yapmaz)
                const insertResult = await supabase
                    .rpc('has_table_privilege', {
                        table_name: `public.${table}`,
                        privilege: 'INSERT'
                    });

                results[table] = {
                    exists: !selectError || !selectError.message?.includes('does not exist'),
                    readable: !selectError,
                    writable: !insertResult.error && insertResult.data,
                    error: selectError?.message || null
                };

                if (selectError) {
                    console.error(`❌ ${table} tablosu erişilemez:`, selectError.message);
                } else {
                    console.log(`✅ ${table} tablosuna erişim başarılı`);
                    success = true;
                }
            } catch (err) {
                console.error(`${table} tablosu test edilirken hata:`, err);
                lastError = err;
                
                if (attempt < retryCount) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        if (!success) {
            results[table] = {
                exists: false,
                readable: false,
                writable: false,
                error: lastError?.message || 'Bilinmeyen hata'
            };
        }
    }
    
    return results;
};

// Admin Auth Client oluştur
const adminAuthClient = supabase.auth.admin;

module.exports = { supabase, testConnection, testTableAccess, getErrorMessage, adminAuthClient };