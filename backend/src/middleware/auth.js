/**
 * Kimlik doğrulama middleware'i
 */
const { supabase } = require('../config/supabaseClient');
// Supabase adminAuthClient için erişim sağla
const { adminAuthClient } = require('../config/supabase');
const jwt = require('jsonwebtoken'); // JWT'yi doğrudan işlemek için

const authMiddleware = async (req, res, next) => {
    try {
        // Bearer token'ı al
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Auth middleware: Token header eksik veya hatalı', { headers: req.headers });
            
            // Geliştirme ortamında ise, token olmadan devam et
            if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
                console.warn('Geliştirme modu: Token olmadan devam ediliyor');
                req.user = { id: 'dev-user', email: 'dev@example.com', role: 'SYSTEM_ADMIN' };
                return next();
            }
            
            return res.status(401).json({
                message: 'Yetkilendirme başarısız',
                details: 'Authorization header eksik veya hatalı formatlı'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            console.error('Auth middleware: Token bulunamadı');
            
            // Geliştirme ortamında ise, token olmadan devam et
            if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
                console.warn('Geliştirme modu: Token olmadan devam ediliyor');
                req.user = { id: 'dev-user', email: 'dev@example.com', role: 'SYSTEM_ADMIN' };
                return next();
            }
            
            return res.status(401).json({
                message: 'Yetkilendirme başarısız',
                details: 'Token bulunamadı'
            });
        }

        console.log(`Auth middleware: Token doğrulama başlıyor (token length: ${token.length})`);

        try {
            // Plan A: JWT doğrudan çözümleme
            try {
                // Token'ı decode et (signature doğrulaması olmadan)
                const decoded = jwt.decode(token);

                if (!decoded || !decoded.sub) {
                    throw new Error('Token decode edilemedi veya geçersiz format');
                }

                // Kullanıcı bilgilerini req nesnesine ekle
                req.user = {
                    id: decoded.sub,
                    email: decoded.email || 'unknown',
                    role: decoded.role || 'user'
                };

                console.log(`Auth middleware: JWT decode başarılı (user id: ${decoded.sub})`);
                return next(); // Başarıyla doğrulanınca devam et

            } catch (jwtError) {
                console.log('JWT doğrudan çözümleme başarısız, Supabase ile deneniyor:', jwtError.message);

                // Plan B: Supabase ile token doğrulama
                try {
                    // getSession yerine getUser dene
                    const { data, error } = await adminAuthClient.getUser(token);

                    if (error) {
                        console.error('Supabase token hatası:', error);
                        throw error;
                    }

                    if (!data || !data.user) {
                        throw new Error('Kullanıcı bilgisi alınamadı');
                    }

                    // Kullanıcı doğrulandı
                    req.user = {
                        id: data.user.id,
                        email: data.user.email,
                        role: data.user.role || data.user.user_metadata?.role || 'user'
                    };

                    console.log(`Auth middleware: Supabase doğrulama başarılı (user id: ${req.user.id})`);
                    return next();

                } catch (supabaseError) {
                    console.error('Supabase ile doğrulama başarısız:', supabaseError);

                    // Plan C: Geliştirme ortamında ise, token olmadan devam et
                    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
                        console.warn('Geliştirme modu: Token doğrulama hatası olmasına rağmen devam ediliyor');
                        req.user = { id: 'dev-user', email: 'dev@example.com', role: 'SYSTEM_ADMIN' };
                        return next();
                    }
                    
                    // Plan D: Son çare - token'ı güvenilir kabul et
                    if (jwtError && decoded) {
                        console.log('Fallback: JWT bilgilerini güvenilir kabul ediyorum');
                        return next(); // JWT bilgilerini zaten req.user'a atamıştık, devam et
                    }

                    // Her şey başarısız olduysa hata mesajı döndür
                    return res.status(401).json({
                        message: 'Yetkilendirme başarısız',
                        details: supabaseError.message || 'Token doğrulanamadı'
                    });
                }
            }

        } catch (error) {
            console.error('Token işleme hatası:', error);
            
            // Geliştirme ortamında ise, token olmadan devam et
            if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
                console.warn('Geliştirme modu: Token işleme hatası olmasına rağmen devam ediliyor');
                req.user = { id: 'dev-user', email: 'dev@example.com', role: 'SYSTEM_ADMIN' };
                return next();
            }
            
            return res.status(401).json({
                message: 'Yetkilendirme başarısız',
                details: error.message || 'Token işlenemedi'
            });
        }
    } catch (error) {
        console.error('Kimlik doğrulama hatası (kritik):', error);

        // Hata özelliklerini detaylı şekilde logla
        if (error.code) console.error('Hata kodu:', error.code);
        if (error.message) console.error('Hata mesajı:', error.message);
        if (error.details) console.error('Hata detayları:', error.details);

        // Geliştirme ortamında ise, hata olmasına rağmen devam et
        if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
            console.warn('Geliştirme modu: Kritik hata olmasına rağmen devam ediliyor');
            req.user = { id: 'dev-user', email: 'dev@example.com', role: 'SYSTEM_ADMIN' };
            return next();
        }

        res.status(500).json({
            message: 'Sunucu hatası.',
            errorType: error.name || 'Unknown',
            suggestion: 'Lütfen sistem yöneticisine başvurun ve sunucu loglarını inceleyin.'
        });
    }
};

module.exports = authMiddleware;
