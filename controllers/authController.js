const jwt = require( 'jsonwebtoken' );
const User = require( '../models/UserModel' );
const Role = require( '../models/RoleModel' );

// Model örneklerini oluştur
const userModel = new User();
const roleModel = new Role();

// JWT_SECRET ve TOKEN_EXPIRY artık login için doğrudan kullanılmayacak.
// const JWT_SECRET = process.env.JWT_SECRET || 'glv-hayvancılık-yönetim-sistemi-jwt-secret-key';
// const TOKEN_EXPIRY = '24h';

class AuthController {
    /**
     * Başarılı yanıt oluşturur
     */
    static success( res, data, message = '' ) {
        res.json( {
            success: true,
            message,
            data
        } );
    }

    /**
     * Hata yanıtı oluşturur
     */
    static error( res, error, status = 500 ) {
        console.error( 'Auth Controller Hatası:', error );
        res.status( status ).json( {
            success: false,
            error: error.message || error
        } );
    }

    /**
     * Kullanıcı girişi
     */
    static async login( req, res ) {
        try {
            const { username, password } = req.body;

            if ( !username || !password ) {
                return AuthController.error( res, 'Kullanıcı adı ve şifre gereklidir.', 400 );
            }

            const loginResult = await userModel.validateLogin( username, password );

            if ( !loginResult.success ) {
                return AuthController.error( res, loginResult.message, 401 );
            }

            // Kullanıcı başarıyla doğrulandı.
            // Token üretimi ve gönderimi kaldırıldı.

            const roles = await userModel.getUserRoles( loginResult.user.id );
            const permissions = await userModel.getUserPermissions( loginResult.user.id );
            const menuItems = await userModel.getUserMenuItems( loginResult.user.id );
            
            // Frontend'in beklediği formatta yanıt
            AuthController.success( res, {
                user: loginResult.user, // UserModel'den gelen kullanıcı objesi
                permissions: permissions.map(p => p.name), // Sadece izin adlarını gönder
                roles: roles.map(r => r.name), // Sadece rol adlarını gönder
                menuItems // Menü öğelerini gönder
            }, 'Giriş başarılı' );

        } catch ( error ) {
            console.error( '[AuthController] login hatası:', error );
            AuthController.error( res, error );
        }
    }

    /**
     * Kullanıcı çıkışı
     */
    static async logout( req, res ) {
        // Basit kimlik doğrulamada, sunucu tarafında yapılacak özel bir işlem yok.
        // Frontend state'i sıfırlar.
        // İsteğe bağlı: kullanıcının son çıkış zamanını veritabanında güncelleyebilirsiniz.
        try {
            // Eğer req.user (veya req.session.user) varsa ve geçerliyse:
            // const userId = req.user?.id;
            // if (userId) {
            //     await userModel.executeQuery(
            //         `UPDATE users SET last_logout = CURRENT_TIMESTAMP WHERE id = ?`,
            //         [userId]
            //     );
            // }
            AuthController.success( res, null, 'Çıkış başarılı' );
        } catch (error) {
            AuthController.error( res, error );
        }
    }

    /**
     * Kullanıcı bilgilerini getir
     */
    static async getProfile( req, res ) {
        // Bu fonksiyonun çalışması için req.user objesinin bir şekilde doldurulmuş olması gerekir.
        // Basit kimlik doğrulamada (session yoksa), bu endpoint anlamsızdır çünkü client zaten kullanıcı bilgisini tutar.
        // Eğer session varsa: const userId = req.session.user.id;
        // Eğer bir şekilde user_id frontend'den geliyorsa (güvenli değil): const userId = req.query.userId;
        // Şimdilik, frontend'in bu endpoint'i çağırmadığını varsayalım veya session tabanlı çalışacak.
        
        // Örnek: Eğer req.user yoksa hata verelim (bu, bir yetkilendirme middleware'inin olmadığını gösterir)
        if (!req.user || !req.user.id) {
            return AuthController.error(res, 'Kullanıcı oturumu bulunamadı veya /profile endpointi için yetkilendirme eksik.', 401);
        }
        const userId = req.user.id;
        
        try {
            const user = await userModel.findById( userId );
            if ( !user ) {
                return AuthController.error( res, 'Kullanıcı bulunamadı', 404 );
            }
            const { password, ...userInfo } = user;
            const roles = await userModel.getUserRoles( userId );
            const permissions = await userModel.getUserPermissions( userId );
            const menuItems = await userModel.getUserMenuItems( userId );

            AuthController.success( res, {
                user: userInfo,
                roles: roles.map(r => r.name),
                permissions: permissions.map(p => p.name),
                menuItems
            } );
        } catch ( error ) {
            AuthController.error( res, error );
        }
    }

    /**
     * Şifre değiştir
     */
    static async changePassword( req, res ) {
        // Bu fonksiyonun çalışması için de req.user.id gereklidir.
        if (!req.user || !req.user.id) {
            return AuthController.error(res, 'Kullanıcı oturumu bulunamadı veya şifre değişikliği için yetkilendirme eksik.', 401);
        }
        const userId = req.user.id;
        try {
            const { currentPassword, newPassword } = req.body;
            if ( !currentPassword || !newPassword ) {
                return AuthController.error( res, 'Mevcut şifre ve yeni şifre gereklidir.', 400 );
            }
            const user = await userModel.findById( userId );
            if ( !user ) {
                return AuthController.error( res, 'Kullanıcı bulunamadı', 404 );
            }
            const loginResult = await userModel.validateLogin( user.username, currentPassword );
            if ( !loginResult.success ) {
                return AuthController.error( res, 'Mevcut şifre hatalı', 401 );
            }
            await userModel.updatePassword( userId, newPassword );
            AuthController.success( res, null, 'Şifre başarıyla değiştirildi' );
        } catch ( error ) {
            AuthController.error( res, error );
        }
    }

    // Bu middleware'ler artık JWT ile çalışmayacak.
    // Eğer rol/izin bazlı koruma isteniyorsa, session'dan gelen kullanıcı bilgileriyle (req.session.user.roles vb.)
    // veya API'ların public olduğu senaryoda frontend'in bu kontrolleri yapmasıyla çalışacak şekilde güncellenmeliler.
    // Şimdilik olduğu gibi bırakıyorum, ama route'larda kullanılmamalılar veya güncellenmeliler.
    /*
    static validateToken( req, res, next ) { ... }
    static hasRole( requiredRoles ) { ... }
    static hasPermission( requiredPermissions ) { ... }
    */
}

module.exports = {
    login: AuthController.login,
    logout: AuthController.logout,
    getProfile: AuthController.getProfile,
    changePassword: AuthController.changePassword,
    // validateToken, hasRole, hasPermission export edilmiyor şimdilik.
}; 