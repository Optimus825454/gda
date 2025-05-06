// fix-permissions.js
// Supabase izinlerini düzeltmek için bir SQL script çalıştırıcı
// RLS (Row Level Security) kurallarını düzenlemek için

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL veya Service Role Key bulunamadı!');
    console.error('Lütfen .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY değerlerini kontrol edin.');
    process.exit(1);
}

console.log('Supabase bağlantısı başlatılıyor...');
console.log(`URL: ${supabaseUrl.substring(0, 8)}...`);
console.log(`Anahtar uzunluğu: ${supabaseKey.length}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL sorguları
const permissionFixQueries = [
    // Permissions tablosunda eksik modül sütununu ekle
    `ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS module VARCHAR(50) DEFAULT 'general';`,
    
    // Settings tablosu için RLS kurallarını düzelt
    `ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;`,
    
    // Users tablosu için RLS kurallarını düzelt
    `ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;`,
    
    // Gerekli tabloları servis rolüne erişilebilir yap
    `GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;`,
    `GRANT ALL PRIVILEGES ON TABLE public.settings TO service_role;`,
    `GRANT ALL PRIVILEGES ON TABLE public.permissions TO service_role;`,
    `GRANT ALL PRIVILEGES ON TABLE public.roles TO service_role;`,
    `GRANT ALL PRIVILEGES ON TABLE public.user_permissions TO service_role;`,
    `GRANT ALL PRIVILEGES ON TABLE public.role_permissions TO service_role;`,
    
    // Anon role için de okuma izinleri ver
    `GRANT SELECT ON TABLE public.settings TO anon;`,
    `GRANT SELECT ON TABLE public.users TO anon;`,
    `GRANT SELECT ON TABLE public.permissions TO anon;`,
    `GRANT SELECT ON TABLE public.roles TO anon;`,
    `GRANT SELECT ON TABLE public.user_permissions TO anon;`,
    `GRANT SELECT ON TABLE public.role_permissions TO anon;`
];

// Her SQL sorgusunu sırayla çalıştır
async function executeFixScripts() {
    console.log('İzin düzeltme SQL sorguları çalıştırılıyor...');
    
    for (const query of permissionFixQueries) {
        try {
            console.log(`Çalıştırılıyor: ${query.substring(0, 50)}...`);
            const { error } = await supabase.rpc('exec_sql', { sql_query: query });
            
            if (error) {
                console.error(`Sorgu çalıştırma hatası:`, error);
            } else {
                console.log('✅ Başarılı');
            }
        } catch (err) {
            console.error('SQL çalıştırma hatası:', err.message);
        }
    }
    
    console.log('İzin düzeltme işlemi tamamlandı.');
}

// Scripti çalıştır
executeFixScripts()
    .then(() => {
        console.log('İşlem tamamlandı!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Genel hata:', err);
        process.exit(1);
    }); 