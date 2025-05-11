const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Yetkilendirme middleware'i
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
};

// Admin için varsayılan izinler
const DEFAULT_ADMIN_PERMISSIONS = [
    'READ_ANIMAL',
    'MANAGE_TESTS',
    'VIEW_FINANCE',
    'MANAGE_FINANCE',
    'MANAGE_SALES',
    'MANAGE_LOGISTICS',
    'VIEW_REPORTS',
    'MANAGE_USERS',
    'VIEW_AUDIT_LOGS'
];

// Normal kullanıcı için varsayılan izinler
const DEFAULT_USER_PERMISSIONS = [
    'READ_ANIMAL',
    'VIEW_FINANCE',
    'VIEW_REPORTS'
];

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Kullanıcı adı ve şifre gereklidir'
            });
        }

        // Kullanıcıyı veritabanından kontrol et
        const [users] = await pool.query(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ? AND is_active = 1',
            [username, username, password]
        );
        const user = users[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kullanıcı adı veya şifre'
            });
        }

        // Son giriş zamanını güncelle
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Token oluştur
        const token = jwt.sign(
            { 
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Kullanıcı rolüne göre izinleri belirle
        const permissions = user.role === 'ADMIN' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;

        // Kullanıcı bilgilerini döndür
        return res.status(200).json({
            success: true,
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            permissions
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

// Logout endpoint (Basit çıkış)
router.post('/logout', async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Çıkış başarılı'
    });
});

// Profile endpoint (Basit kullanıcı bilgisi dönme)
router.get('/profile', async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            full_name: 'Sistem Yöneticisi',
            roles: ['SYSTEM_ADMIN', 'admin']
        }
    });
});

// Mevcut kullanıcı bilgilerini getir
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = 1',
            [req.user.id]
        );
        const user = users[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Kullanıcı rolüne göre izinleri belirle
        const permissions = user.role === 'ADMIN' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            permissions
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: error.message
        });
    }
});

module.exports = router;