/**
 * dbHelper.js - Veritabanı yardımcı fonksiyonları
 */

const { supabase } = require( '../config/supabaseClient' );
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * SQL dosyasını okur ve Supabase'de çalıştırır
 * @param {string} sqlFileName - SQL dosyasının adı (sql/ klasöründeki)
 * @returns {Promise<object>} - İşlem sonucu
 */
const runSqlFile = async ( sqlFileName ) => {
    try {
        // SQL dosyasının tam yolunu belirle
        const sqlFilePath = path.join( __dirname, '../../sql', sqlFileName );

        if ( !fs.existsSync( sqlFilePath ) ) {
            return {
                success: false,
                message: `SQL dosyası bulunamadı: ${sqlFileName}`,
                error: 'FileNotFound'
            };
        }

        console.log( `SQL dosyası çalıştırılıyor: ${sqlFileName}` );

        // Dosyayı oku
        const sqlContent = fs.readFileSync( sqlFilePath, 'utf8' );

        // PostgreSQL'de exec_sql fonksiyonu yoksa, doğrudan SQL çalıştır
        // Not: Bu özellik Supabase'in RPC özelliği olarak tanımlanmalıdır
        try {
            const { data, error } = await supabase.rpc( 'exec_sql', { sql: sqlContent } );

            if ( error ) {
                console.error( 'SQL RPC hatası:', error );
                return {
                    success: false,
                    message: 'SQL dosyası RPC ile çalıştırılamadı. Supabase yönetici panelinden SQL sorgusu olarak çalıştırın.',
                    error
                };
            }

            return { success: true, data };

        } catch ( rpcError ) {
            console.error( 'RPC fonksiyon çağrısı hatası:', rpcError );

            return {
                success: false,
                message: 'SQL RPC fonksiyonu mevcut değil veya çağrılamadı.',
                error: rpcError,
                suggestion: 'SQL dosyasını Supabase yönetici panelinden manuel olarak çalıştırın.'
            };
        }
    } catch ( err ) {
        console.error( 'SQL dosyası işleme hatası:', err );
        return { success: false, error: err };
    }
};

/**
 * Kritik tabloları doğrudan oluşturan fonksiyon
 */
const createSettingsTable = async () => {
    try {
        console.log( 'Settings tablosu oluşturuluyor...' );

        // Settings tablosu varlığını kontrol et ve yoksa oluştur
        const { error: checkError } = await supabase
            .from( 'settings' )
            .select( 'count(*)' )
            .limit( 1 );

        // Tablo yoksa oluştur
        if ( checkError && checkError.code === '42P01' ) {
            console.log( 'Settings tablosu mevcut değil, oluşturuluyor...' );

            // API üzerinden tablo oluşturmak mümkün değil, bu nedenle konsola talimat yazdır
            console.log( 'UYARI: Settings tablosu otomatik oluşturulamıyor.' );
            console.log( 'Lütfen Supabase yönetici panelinden SQL editöründe aşağıdaki sorguyu çalıştırın:' );
            console.log( `
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    group_name TEXT DEFAULT 'general',
    description TEXT,
    type TEXT DEFAULT 'string',
    options JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.settings (key, value, group_name, description, type)
VALUES
    ('site_title', 'Gülvet & AsyaEt Hayvancılık', 'general', 'Site başlığı', 'string'),
    ('contact_email', 'admin@example.com', 'contact', 'İletişim e-posta adresi', 'email'),
    ('items_per_page', '20', 'pagination', 'Sayfa başına varsayılan öğe sayısı', 'number')
ON CONFLICT (key) DO NOTHING;
            `);

            return { success: false, message: 'Settings tablosu otomatik oluşturulamadı' };
        }

        console.log( 'Settings tablosu mevcut, kontrol tamamlandı.' );
        return { success: true };
    } catch ( err ) {
        console.error( 'Settings tablosu oluşturma hatası:', err );
        return { success: false, error: err };
    }
};

/**
 * SQL dosyasını okur ve içindeki bilgileri konsola yazdırır
 * @param {string} sqlFileName - SQL dosyasının adı (sql/ klasöründeki)
 */
const readSqlFile = async ( sqlFileName ) => {
    try {
        // SQL dosyasının tam yolunu belirle
        const sqlFilePath = path.join( __dirname, '../../sql', sqlFileName );

        if ( !fs.existsSync( sqlFilePath ) ) {
            console.log( `SQL dosyası bulunamadı: ${sqlFileName}` );
            return { success: false, message: 'Dosya bulunamadı' };
        }

        // Dosyayı oku
        const sqlContent = fs.readFileSync( sqlFilePath, 'utf8' );

        console.log( `${sqlFileName} dosyası içeriği (manuel çalıştırılmalı):` );
        console.log( '-'.repeat( 50 ) );
        console.log( sqlContent.substring( 0, 500 ) + '...' );
        console.log( '-'.repeat( 50 ) );
        console.log( 'Bu SQL dosyasını Supabase yönetici panelinden manuel olarak çalıştırmalısınız.' );

        return { success: true, message: 'SQL dosyası okundu' };
    } catch ( err ) {
        console.error( `${sqlFileName} dosyası okuma hatası:`, err );
        return { success: false, error: err };
    }
};

/**
 * Veritabanı tablo şemasını kontrol eder ve gerekirse kullanıcıyı yönlendirir
 */
const checkAndCreateTables = async () => {
    try {
        console.log( 'Veritabanı tabloları kontrol ediliyor...' );

        // Settings tablosunu kontrol et ve yoksa oluştur
        await createSettingsTable();

        // SQL dosyalarını oku ve içeriklerini göster
        console.log( 'SQL dosyaları okunuyor...' );
        await readSqlFile( 'check_table_structure.sql' );

        console.log( 'Veritabanı tablo kontrolleri ve SQL dosyası okuma tamamlandı.' ); // Yeni log mesajı
        return { success: true, message: 'Veritabanı kontrolleri tamamlandı' };
    } catch ( err ) {
        console.error( 'Veritabanı tablo kontrolü sırasında hata:', err );
        return { success: true, message: 'Kontroller hatalı tamamlandı' };
    }
};

module.exports = {
    runSqlFile,
    checkAndCreateTables,
    createSettingsTable,
    readSqlFile
};