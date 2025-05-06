/**
 * fixUsersTablePermissions.js - Users tablosu için izin sorunlarını düzeltir
 */

require('dotenv').config();
const { supabase } = require('../config/supabaseClientImproved');

const fixUsersTablePermissions = async () => {
    try {
        console.log('Users tablosu izinleri kontrol ediliyor...');
        
        // Önce bağlantıyı test et
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (error) {
            if (error.code === '42501') {
                console.error('Users tablosuna erişim izni yok:', error.message);
                console.log('\n--- ÇÖZÜM ÖNERİLERİ ---');
                console.log('Bu sorunu çözmek için:');
                console.log('1. Supabase yönetim panelinde SQL editörünü açın');
                console.log('2. Aşağıdaki SQL komutlarını çalıştırın:\n');
                
                console.log('-- Users tablosu için:');
                console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
                console.log('-- VEYA alternatif olarak RLS politikası ekleyin:');
                console.log('CREATE POLICY "users tablosuna tam erişim" ON public.users');
                console.log('    USING (true)');
                console.log('    WITH CHECK (true);\n');
                
                console.log('3. Değişiklikleri yaptıktan sonra uygulamanızı yeniden başlatın.');
                return false;
            } else {
                console.error('Users tablosu kontrolü sırasında hata:', error);
                return false;
            }
        } else {
            console.log('Users tablosuna erişim başarılı!');
            return true;
        }
        
    } catch (error) {
        console.error('Users tablosu izinleri kontrol edilirken beklenmeyen hata:', error);
        return false;
    }
};

// Script doğrudan çalıştırıldığında izinleri kontrol et
if (require.main === module) {
    fixUsersTablePermissions()
        .then(result => {
            if (result) {
                console.log('İşlem başarılı');
                process.exit(0);
            } else {
                console.error('İşlem başarısız');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Beklenmeyen hata:', error);
            process.exit(1);
        });
}

module.exports = { fixUsersTablePermissions };