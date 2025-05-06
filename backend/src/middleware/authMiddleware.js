const { supabaseAdmin } = require('../config/supabase');

// DEV_MODE değişkeni kontrol edilir, env'den alınır veya false olarak varsayılır
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true'; 

const authMiddleware = async (req, res, next) => {
    // Geliştirme modunda ve kimlik doğrulama devre dışı bırakılmışsa, sahte bir kullanıcı oluştur
    if (DEV_MODE) {
        console.log('Auth middleware: Geliştirici modu aktif, kimlik doğrulama atlanıyor');
        req.user = {
            id: 'dev-user-id',
            email: 'developer@example.com',
            roles: [
                {
                    name: 'admin',
                    permissions: ['*'] // Tüm izinlere sahip
                }
            ]
        };
        return next();
    }

    try {
        // Token'ı header'dan al
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Yetkilendirme başarısız: Token bulunamadı',
                code: 'TOKEN_MISSING'
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('Auth middleware: Token doğrulama başlıyor (token length:', token.length, ')');

        // Token'ı doğrula
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (error) {
                // Token süresi dolmuşsa özel hata mesajı döndür
                if (error.message?.includes('token is expired')) {
                    console.warn('Auth middleware: Token süresi dolmuş');
                    return res.status(401).json({
                        success: false,
                        error: 'Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.',
                        code: 'TOKEN_EXPIRED'
                    });
                }

                // Diğer token hataları için
                console.error('Auth middleware: Token doğrulama hatası:', error);
                return res.status(401).json({
                    success: false,
                    error: 'Yetkilendirme başarısız: Geçersiz token',
                    code: 'TOKEN_INVALID'
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Yetkilendirme başarısız: Kullanıcı bulunamadı',
                    code: 'USER_NOT_FOUND'
                });
            }

            console.log('Auth middleware: JWT decode başarılı (user id:', user.id, ')');

            // Kullanıcı rollerini al
            const { data: userRoles, error: rolesError } = await supabaseAdmin
                .from('user_roles')
                .select(`
                    role_id,
                    roles (
                        name,
                        role_permissions (
                            permissions (
                                code
                            )
                        )
                    )
                `)
                .eq('user_id', user.id);

            if (rolesError) {
                console.error('Auth middleware: Rol bilgileri alınamadı:', rolesError);
                return res.status(500).json({
                    success: false,
                    error: 'Kullanıcı yetkileri alınamadı',
                    code: 'ROLES_ERROR'
                });
            }

            // Kullanıcı bilgilerini ve rollerini request nesnesine ekle
            req.user = user;
            req.user.roles = userRoles?.map(ur => ({
                name: ur.roles.name,
                permissions: ur.roles.role_permissions?.map(rp => rp.permissions.code) || []
            })) || [];

            console.log('Auth middleware: Kullanıcı rolleri yüklendi:', req.user.roles);

            next();
        } catch (tokenError) {
            // Bağlantı hatalarını tespit et
            const isConnectionError = 
                tokenError.name === 'TypeError' && 
                (tokenError.message?.includes('fetch failed') || 
                 tokenError.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                 tokenError.code === 'ECONNREFUSED' ||
                 tokenError.code === 'ETIMEDOUT');
                
            if (isConnectionError) {
                console.error('Auth middleware: Supabase bağlantı hatası:', tokenError);
                
                // Geliştirme modunda daha az kısıtlayıcı davranabiliriz
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Geliştirme modunda - Auth servisi kullanılamıyor, geçici yetkilendirme sağlıyoruz');
                    // Geliştirme modunda geçici yetkilendirme sağla
                    req.user = {
                        id: 'dev-fallback-user-id',
                        email: 'developer-fallback@example.com',
                        roles: [
                            {
                                name: 'admin',
                                permissions: ['*'] // Geliştirme amacıyla tüm izinlere sahip
                            }
                        ]
                    };
                    return next();
                }
                
                return res.status(503).json({
                    success: false,
                    error: 'Kimlik doğrulama servisi şu anda erişilemiyor, lütfen daha sonra tekrar deneyin',
                    code: 'AUTH_SERVICE_UNAVAILABLE'
                });
            }

            console.error('Auth middleware: Token işleme hatası:', tokenError);
            return res.status(500).json({
                success: false,
                error: 'Token işlenirken bir hata oluştu',
                code: 'TOKEN_PROCESSING_ERROR'
            });
        }
    } catch (error) {
        console.error('Auth Middleware Hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası',
            code: 'SERVER_ERROR'
        });
    }
};

module.exports = authMiddleware; 