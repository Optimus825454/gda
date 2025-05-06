/**
 * updateEnvConfig.js - .env dosyasu0131ndaki ayarlaru0131 gu00fcnceller
 */

const fs = require('fs');
const path = require('path');

const updateEnvConfig = () => {
    try {
        const envPath = path.join(__dirname, '../../.env');
        
        // .env dosyasu0131 var mu0131 kontrol et
        if (!fs.existsSync(envPath)) {
            console.error('.env dosyasu0131 bulunamadu0131:', envPath);
            return false;
        }
        
        // .env dosyasu0131nu0131 oku
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // DISABLE_PERMISSION_CHECK ayaru0131 var mu0131 kontrol et
        if (!envContent.includes('DISABLE_PERMISSION_CHECK')) {
            // Ayar yoksa ekle
            envContent += '\nDISABLE_PERMISSION_CHECK=true\n';
            console.log('DISABLE_PERMISSION_CHECK ayaru0131 eklendi');
        } else {
            // Ayar varsa gu00fcncelle
            envContent = envContent.replace(
                /DISABLE_PERMISSION_CHECK=.*/,
                'DISABLE_PERMISSION_CHECK=true'
            );
            console.log('DISABLE_PERMISSION_CHECK ayaru0131 gu00fcncellendi');
        }
        
        // .env dosyasu0131nu0131 gu00fcncelle
        fs.writeFileSync(envPath, envContent);
        console.log('.env dosyasu0131 bau015faru0131yla gu00fcncellendi');
        
        return true;
    } catch (error) {
        console.error('.env dosyasu0131 gu00fcncellenirken hata:', error);
        return false;
    }
};

// Script dou011frudan u00e7alu0131u015ftu0131ru0131ldu0131u011fu0131nda
if (require.main === module) {
    const result = updateEnvConfig();
    
    if (result) {
        console.log('u0130u015flem bau015faru0131lu0131');
        process.exit(0);
    } else {
        console.error('u0130u015flem bau015faru0131su0131z');
        process.exit(1);
    }
}

module.exports = { updateEnvConfig };