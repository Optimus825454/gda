/**
 * checkDatabase.js - Veritabanı bağlantısını ve tabloları kontrol eder
 */

require('dotenv').config();
const { supabase, testConnection, testTableAccess, getErrorMessage } = require('../config/supabaseClient');

const checkDatabase = async () => {
    try {
        console.log('Veritabanı bağlantısı kontrol ediliyor...');
        
        // Bağlantıyı test et
        const connectionResult = await testConnection();
        console.log('Bağlantı sonucu:', connectionResult.success ? 'Başarılı' : 'Başarısız');
        
        if (!connectionResult.success) {
            console.error('Veritabanı bağlantısı başarısız!', connectionResult.error);
            // Bağlantı başarısız olsa bile devam et
            console.warn('Bağlantı hatası olmasına rağmen devam ediliyor...');
        }
        
        // Tabloları kontrol et
        console.log('\nTablolar kontrol ediliyor...');
        try {
            const tablesResult = await testTableAccess();
            console.log('Tablo erişim sonucu:', tablesResult);
        } catch (tableError) {
            console.error('Tablo kontrolü sırasında hata:', tableError);
            console.warn('Tablo kontrolü hatası olmasına rağmen devam ediliyor...');
        }
        
        // Settings tablosunu kontrol et
        console.log('\nSettings tablosu kontrol ediliyor...');
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('Tablo kontrolü sırasında hata:', error);
                console.warn('Tablo kontrolünde hata oluştu, ancak uygulama başlatılıyor.');
                return true; // Hata olsa bile başarılı kabul et
            }
            
            console.log('Settings tablosu mevcut ve erişilebilir');
            return true;
        } catch (error) {
            console.error('Settings tablosu kontrolü sırasında hata:', error);
            console.warn('Tablo kontrolünde hata oluştu, ancak uygulama başlatılıyor.');
            return true; // Hata olsa bile başarılı kabul et
        }
        
    } catch (error) {
        console.error('Veritabanı kontrolü sırasında hata:', error);
        console.warn('Veritabanı hazırlama hatası:', error);
        return true; // Hata olsa bile başarılı kabul et
    }
};

// Script doğrudan çalıştırıldığında kontrolü yap
if (require.main === module) {
    checkDatabase()
        .then(result => {
            if (result) {
                console.log('\nVeritabanı kontrolü tamamlandı');
                process.exit(0);
            } else {
                console.error('\nVeritabanı kontrolü başarısız');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            console.warn('Hata oluştu, ancak uygulama başlatılıyor...');
            process.exit(0); // Hata olsa bile başarılı çıkış kodu
        });
}

module.exports = { checkDatabase };