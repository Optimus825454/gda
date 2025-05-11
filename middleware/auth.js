/**
 * Basit kimlik doğrulama middleware'i
 */

const authMiddleware = async ( req, res, next ) => {
    // Basit kimlik doğrulama: Tüm isteklere varsayılan kullanıcı bilgisi ekle
    // NOT: Bu sadece geçici bir çözümdür. Gerçek uygulamada JWT veya session tabanlı kimlik doğrulama kullanılmalıdır.
    req.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['SYSTEM_ADMIN', 'admin'],
        permissions: ['VIEW_DASHBOARD', 'VIEW_ALL', 'MANAGE_ALL'] // Tüm izinleri vererek test kolaylığı sağla
    };

    // Kullanıcı bilgilerini request nesnesine ekle
    req.roles = req.user.roles;
    req.permissions = req.user.permissions;

    // console.log('[auth.js] Varsayılan admin kullanıcısı atandı.'); // Debug logu
    next();
};

module.exports = authMiddleware;
