/**
 * .env dosyasını oluşturmak için yardımcı script
 */
const fs = require('fs');
const path = require('path');

// .env dosyasının içeriği
const envContent = `# MySQL Veritabanı Bağlantı Bilgileri
MYSQL_HOST=213.238.183.232
MYSQL_USER=djerkan96
MYSQL_PASSWORD=518518Erkan
MYSQL_DATABASE=gdaflv
MYSQL_PORT=3306

# JWT Secret Key
JWT_SECRET=glv-hayvancılık-yönetim-sistemi-jwt-secret-key

# Uygulama Ayarları
PORT=3001
NODE_ENV=development

# Upload Ayarları
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
`;

// .env dosyasının yolu
const envPath = path.join(__dirname, '..', '.env');

// .env dosyasını oluştur
try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('.env dosyası başarıyla oluşturuldu:', envPath);
} catch (error) {
    console.error('.env dosyası oluşturulurken hata oluştu:', error);
} 