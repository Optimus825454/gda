// /**
//  * Basit kimlik doğrulama middleware'i
//  * Token tabanlı kimlik doğrulama yerine basit bir oturum kontrolü yapar
//  */

// const authMiddleware = async (req, res, next) => {
//     // Basit kimlik doğrulama: Tüm isteklere varsayılan kullanıcı bilgisi ekle
//     // Bu, frontend'in kullanıcı bilgisine ihtiyaç duyan kısımlarının çalışmasını sağlar
//     req.user = {
//         id: 1,
//         username: 'admin',
//         email: 'admin@example.com',
//         roles: ['SYSTEM_ADMIN', 'admin'],
//         permissions: ['VIEW_DASHBOARD', 'VIEW_ALL', 'MANAGE_ALL']
//     };
    
//     // Kullanıcı bilgilerini request nesnesine ekle
//     req.roles = req.user.roles;
//     req.permissions = req.user.permissions;
    
//     console.log('Basit kimlik doğrulama: Kullanıcı bilgileri eklendi');
//     next();
// };

// module.exports = authMiddleware;

// Şimdilik bu middleware'i etkisiz hale getiriyoruz.
// İleride session veya başka bir mekanizma ile req.user doldurulabilir.
module.exports = (req, res, next) => {
    // console.log('[authMiddleware.js] Middleware çağrıldı ancak işlem yapmıyor.');
    next();
};