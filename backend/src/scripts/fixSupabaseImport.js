/**
 * fixSupabaseImport.js - Supabase import sorunlarını düzeltir
 * Bu script, modellerdeki supabase import hatalarını düzeltir
 */

const fs = require('fs');
const path = require('path');

// Modeller dizini
const MODELS_DIR = path.join(__dirname, '..', 'models');

// Düzeltilecek import ifadesi
const OLD_IMPORT = "const { supabase } = require( '../config/supabase' );";
const NEW_IMPORT = "const { supabaseAdmin: supabase } = require( '../config/supabase' );";

const fixSupabaseImports = async () => {
    try {
        console.log('Modellerdeki Supabase import ifadeleri kontrol ediliyor...');
        
        // Modeller dizinindeki tüm dosyaları oku
        const files = fs.readdirSync(MODELS_DIR);
        
        let fixedCount = 0;
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(MODELS_DIR, file);
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Eski import ifadesini kontrol et
                if (content.includes(OLD_IMPORT)) {
                    console.log(`${file} dosyasında eski import ifadesi bulundu, düzeltiliyor...`);
                    
                    // Import ifadesini değiştir
                    content = content.replace(OLD_IMPORT, NEW_IMPORT);
                    
                    // Dosyayı kaydet
                    fs.writeFileSync(filePath, content, 'utf8');
                    
                    console.log(`✅ ${file} dosyası düzeltildi`);
                    fixedCount++;
                }
            }
        }
        
        console.log(`\nToplam ${fixedCount} dosya düzeltildi.`);
        return true;
        
    } catch (error) {
        console.error('Dosyalar düzeltilirken hata:', error);
        return false;
    }
};

// Script doğrudan çalıştırıldığında
if (require.main === module) {
    fixSupabaseImports()
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

module.exports = { fixSupabaseImports };