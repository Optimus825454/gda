const { supabaseAdmin } = require('../config/supabase');

/**
 * İzin kontrolü için middleware
 * @param {string[]} requiredPermissions - Gerekli izinler dizisi
 */
const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // ROL BAZLI KONTROL DEVRE DIŞI
            console.log('Role göre izinler istendi (' + requiredPermissions.length + ') - ROL BAZLI KONTROL DEVRE DIŞI');
            return next();

            // Kullanıcı ID'sini al
            const userId = req.user.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Yetkilendirme başarısız'
                });
            }

            // Kullanıcının rollerini ve izinlerini al
            const { data: userRoles, error: rolesError } = await supabaseAdmin
                .from('user_roles')
                .select(`
                    role:roles (
                        name,
                        permissions:role_permissions (
                            permission:permissions (
                                code
                            )
                        )
                    )
                `)
                .eq('user_id', userId);

            if (rolesError) throw rolesError;

            console.log('Kullanıcı rolleri yüklendi:', userRoles);

            // Kullanıcının tüm izinlerini topla
            const userPermissions = userRoles.flatMap(ur => 
                ur.role.permissions.map(p => p.permission.code)
            );

            // Gerekli izinlerin en az birinin olup olmadığını kontrol et
            const hasPermission = requiredPermissions.some(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: 'Bu işlem için yetkiniz yok'
                });
            }

            next();
        } catch (error) {
            console.error('İzin kontrolü hatası:', error);
            res.status(500).json({
                success: false,
                error: 'İzin kontrolü sırasında bir hata oluştu'
            });
        }
    };
};

module.exports = {
    checkPermission
};