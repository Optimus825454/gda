process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://your-test-project.supabase.co';
process.env.SUPABASE_KEY = 'your-test-anon-key';

// Supabase mock'unu kullan
jest.mock( '../config/supabase', () => require( './mocks/supabase' ) );

// Her testten sonra mock'ları temizle
jest.mock( '@jest/globals', () => ( {
    afterEach: ( fn ) => {
        global.afterEach( fn );
    }
} ) );

// Test veritabanı temizleme işlemleri için yardımcı fonksiyon
global.cleanupDatabase = async () => {
    const { supabase } = require( '../config/supabase' );

    try {
        await supabase.from( 'animals' ).delete().neq( 'id', 0 );
        await supabase.from( 'health_records' ).delete().neq( 'id', 0 );
    } catch ( error ) {
        console.error( 'Test veritabanı temizlenirken hata:', error );
    }
};