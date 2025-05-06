const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { supabase } = require('../config/supabaseClient');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email ve şifre gereklidir'
            });
        }

        // Supabase ile giriş yap
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                success: false,
                message: 'Giriş başarısız',
                error: error.message
            });
        }

        // Başarılı giriş
        return res.status(200).json({
            success: true,
            message: 'Giriş başarılı',
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: data.user
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Çıkış yapılırken hata oluştu',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Başarıyla çıkış yapıldı'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Profile endpoint
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // authMiddleware zaten kullanıcı bilgilerini req.user'a ekledi
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı veya oturum süresi doldu'
            });
        }

        // Kullanıcı bilgilerini al
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (userError) {
            console.error('User fetch error:', userError);
            // Kullanıcı veritabanında bulunamadı, ama kimlik doğrulama başarılı oldu
            // Temel bilgileri döndür
            return res.status(200).json({
                success: true,
                data: {
                    id: req.user.id,
                    email: req.user.email,
                    roles: [{ name: req.user.role || 'user' }]
                }
            });
        }

        // Kullanıcı rollerini al
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', req.user.id);

        let roles = [];
        if (!roleError && roleData && roleData.length > 0) {
            roles = roleData.map(r => ({ name: r.roles?.name || 'user' }));
        } else {
            // Varsayılan rol
            roles = [{ name: req.user.role || 'user' }];
        }

        // Kullanıcı bilgilerini döndür
        return res.status(200).json({
            success: true,
            data: {
                ...userData,
                email: req.user.email, // Email bilgisini auth'dan al
                roles
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

// Current user endpoint - alternative to profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı veya oturum süresi doldu'
            });
        }

        // Return basic user info
        return res.status(200).json({
            success: true,
            data: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role || 'user'
            }
        });
    } catch (error) {
        console.error('Current user fetch error:', error);
        return res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router;