import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// URL ve anahtarın varlığını kontrol et
if ( !supabaseUrl || !supabaseAnonKey ) {
    console.error( 'Supabase bağlantı bilgileri eksik! Lütfen .env dosyasını kontrol edin.' );
    // Geliştirici için yardımcı bilgiler
    console.info( 'REACT_APP_SUPABASE_URL ve REACT_APP_SUPABASE_ANON_KEY çevresel değişkenleri tanımlanmış olmalı.' );
}

export const supabase = createClient( supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    },
    global: {
        // Hata durumunda otomatik yeniden deneme
        fetch: ( ...args ) => {
            return fetch( ...args ).catch( error => {
                console.error( 'Supabase bağlantı hatası:', error );
                throw error;
            } );
        }
    }
} );

// Hata mesajlarını özelleştiren yardımcı fonksiyon
export const handleSupabaseError = ( error ) => {
    // Şema hatası
    if ( error?.message?.includes( 'schema' ) || error?.code === '42P01' ) {
        console.error( 'Veritabanı şema hatası:', error );
        return {
            message: 'Veritabanı şema hatası. Tabloların varlığını kontrol edin.',
            type: 'SCHEMA_ERROR',
            original: error
        };
    }

    // Kimlik doğrulama hatası
    if ( error?.message?.includes( 'Invalid login credentials' ) ) {
        return {
            message: 'Kullanıcı adı veya şifre hatalı',
            type: 'AUTH_ERROR',
            original: error
        };
    }

    // Diğer hatalar
    return {
        message: error?.message || 'Bir hata oluştu',
        type: 'UNKNOWN_ERROR',
        original: error
    };
};

// Auth durum değişikliklerini izle
supabase.auth.onAuthStateChange( ( event, session ) => {
    console.log( 'Auth state changed:', event, session?.user?.email || 'No user' );
} );
