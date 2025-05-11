/**
 * MySQL kurulumu ve admin kullanıcısı oluşturma
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
PORT=3005
NODE_ENV=development

# Upload Ayarları
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
`;

// .env dosyasının yolu
const envPath = path.join(__dirname, '..', '.env');

// .env dosyasını oluştur
function createEnvFile() {
    console.log('1. .env dosyası oluşturuluyor...');
    try {
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✓ .env dosyası başarıyla oluşturuldu.');
        return true;
    } catch (error) {
        console.error('✗ .env dosyası oluşturulurken hata:', error.message);
        return false;
    }
}

// Auth tablolarını oluştur
function createAuthTables() {
    return new Promise((resolve, reject) => {
        console.log('2. Kimlik doğrulama tabloları oluşturuluyor...');
        
        const mysql = require('mysql2');
        const connection = mysql.createConnection({
            host: '213.238.183.232',
            user: 'djerkan96',
            password: '518518Erkan',
            database: 'gdaflv',
            multipleStatements: true // Çoklu sorgu çalıştırmak için
        });
        
        // SQL dosyasını oku
        const sqlPath = path.join(__dirname, '..', 'sql', 'auth_tables.sql');
        
        // SQL dosyasının varlığını kontrol et
        if (!fs.existsSync(sqlPath)) {
            console.error('✗ SQL dosyası bulunamadı:', sqlPath);
            reject(new Error(`SQL dosyası bulunamadı: ${sqlPath}`));
            return;
        }
        
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // SQL sorgularını çalıştır
        connection.query(sql, function(err, results) {
            connection.end();
            
            if (err) {
                console.error('✗ Tablolar oluşturulurken hata:', err.message);
                reject(err);
                return;
            }
            
            console.log('✓ Kimlik doğrulama tabloları başarıyla oluşturuldu.');
            resolve(true);
        });
    });
}

// Admin kullanıcısı oluştur
function createAdminUser() {
    return new Promise((resolve, reject) => {
        console.log('3. Admin kullanıcısı oluşturuluyor...');
        
        const User = require('../src/models/UserModel');
        const Role = require('../src/models/RoleModel');
        
        // Kullanıcı bilgileri
        const newUser = {
            username: 'erkan',
            email: 'erkan@example.com',
            password: '518518',
            full_name: 'Erkan',
            is_active: true
        };
        
        (async () => {
            try {
                // Model örneklerini oluştur
                const userModel = new User();
                const roleModel = new Role();
                
                // Önce kullanıcı var mı kontrol et
                const existingUser = await userModel.findByUsername(newUser.username);
                if (existingUser) {
                    console.log(`✓ "${newUser.username}" kullanıcısı zaten var.`);
                    resolve(true);
                    return;
                }
                
                // SYSTEM_ADMIN rolünü bul
                const adminRole = await roleModel.findByName('SYSTEM_ADMIN');
                if (!adminRole) {
                    console.error('✗ SYSTEM_ADMIN rolü bulunamadı!');
                    reject(new Error('SYSTEM_ADMIN rolü bulunamadı'));
                    return;
                }
                
                // Kullanıcıyı oluştur
                const userId = await userModel.createUser(newUser);
                
                // Kullanıcıya SYSTEM_ADMIN rolü ata
                await userModel.assignRole(userId, adminRole.id);
                
                console.log(`✓ "${newUser.username}" kullanıcısı SYSTEM_ADMIN rolü ile başarıyla oluşturuldu!`);
                resolve(true);
            } catch (error) {
                console.error('✗ Admin kullanıcısı oluşturulurken hata:', error.message);
                reject(error);
            }
        })();
    });
}

// Ana fonksiyon
async function setup() {
    console.log('MySQL Kurulum ve Yapılandırma Başlatılıyor...');
    console.log('-------------------------------------------');
    
    try {
        // .env dosyasını oluştur
        createEnvFile();
        
        // Auth tablolarını oluştur
        await createAuthTables();
        
        // Admin kullanıcısını oluştur
        await createAdminUser();
        
        console.log('-------------------------------------------');
        console.log('✅ MySQL kurulumu ve yapılandırması tamamlandı!');
        console.log('Kullanıcı: erkan');
        console.log('Şifre: 518518');
        console.log('Rol: SYSTEM_ADMIN');
    } catch (error) {
        console.error('Kurulum sırasında bir hata oluştu:', error);
        process.exit(1);
    }
}

// Scripti çalıştır
setup(); 