/**
 * MySQL Veritabanına SYSTEM_ADMIN rolüne sahip yeni kullanıcı eklemek için script
 */
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

// MySQL bağlantı ayarları
const dbConfig = {
    host: '213.238.183.232',
    user: 'djerkan96',
    password: '518518Erkan',
    database: 'gdaflv'
};

async function createAdminUser() {
    console.log('Admin kullanıcı oluşturma işlemi başlatılıyor...');
    
    try {
        // Model örneklerini oluştur
        const userModel = new User();
        const roleModel = new Role();
        
        // Önce kullanıcı var mı kontrol et
        const existingUser = await userModel.findByUsername(newUser.username);
        if (existingUser) {
            console.log(`"${newUser.username}" kullanıcısı zaten var!`);
            process.exit(0);
        }
        
        // SYSTEM_ADMIN rolünü bul
        const adminRole = await roleModel.findByName('SYSTEM_ADMIN');
        if (!adminRole) {
            console.error('SYSTEM_ADMIN rolü bulunamadı!');
            process.exit(1);
        }
        
        // Kullanıcıyı oluştur
        console.log('Yeni kullanıcı oluşturuluyor...');
        const userId = await userModel.createUser(newUser);
        
        // Kullanıcıya SYSTEM_ADMIN rolü ata
        await userModel.assignRole(userId, adminRole.id);
        
        console.log(`"${newUser.username}" kullanıcısı SYSTEM_ADMIN rolü ile başarıyla oluşturuldu!`);
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
}

// Scripti çalıştır
createAdminUser(); 