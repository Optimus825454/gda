/**
 * Kullanıcı model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');
const bcrypt = require('bcryptjs');

class User extends MySQLBaseModel {
    constructor() {
        super('users');
    }

    // Kullanıcı adına göre kullanıcı bulma
    async findByUsername(username) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE username = ?`;
            const results = await this.executeQuery(sql, [username]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Kullanıcı adına göre arama hatası:', error);
            throw error;
        }
    }

    // E-posta adresine göre kullanıcı bulma
    async findByEmail(email) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
            const results = await this.executeQuery(sql, [email]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('E-posta adresine göre arama hatası:', error);
            throw error;
        }
    }

    // Kullanıcı oluşturma (şifre hashlenir)
    async createUser(userData) {
        try {
            // Şifreyi hashle
            const saltRounds = 10;
            userData.password = await bcrypt.hash(userData.password, saltRounds);
            
            return await this.create(userData);
        } catch (error) {
            console.error('Kullanıcı oluşturma hatası:', error);
            throw error;
        }
    }

    // Şifre güncelleme
    async updatePassword(userId, newPassword) {
        try {
            // Şifreyi hashle
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            const sql = `UPDATE ${this.tableName} SET password = ? WHERE id = ?`;
            await this.executeQuery(sql, [hashedPassword, userId]);
            
            return true;
        } catch (error) {
            console.error('Şifre güncelleme hatası:', error);
            throw error;
        }
    }

    // Kullanıcı girişi doğrulama
    async validateLogin(username, password) {
        try {
            // Kullanıcıyı bul
            const user = await this.findByUsername(username);
            if (!user) {
                return { success: false, message: 'Kullanıcı bulunamadı' };
            }
            
            // Şifre kontrolü
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return { success: false, message: 'Hatalı şifre' };
            }
            
            // Son giriş zamanını güncelle
            await this.executeQuery(
                `UPDATE ${this.tableName} SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                [user.id]
            );
            
            // Kullanıcı bilgilerini hazırla (şifre hariç)
            const { password: _, ...userInfo } = user;
            
            return { 
                success: true, 
                user: userInfo,
                message: 'Giriş başarılı'
            };
        } catch (error) {
            console.error('Giriş doğrulama hatası:', error);
            throw error;
        }
    }

    // Kullanıcının rollerini getir
    async getUserRoles(userId) {
        try {
            const sql = `
                SELECT r.* 
                FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ?
            `;
            
            return await this.executeQuery(sql, [userId]);
        } catch (error) {
            console.error('Kullanıcı rolleri getirme hatası:', error);
            throw error;
        }
    }

    // Kullanıcının izinlerini getir
    async getUserPermissions(userId) {
        try {
            const sql = `
                SELECT DISTINCT p.* 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN user_roles ur ON rp.role_id = ur.role_id
                WHERE ur.user_id = ?
            `;
            
            return await this.executeQuery(sql, [userId]);
        } catch (error) {
            console.error('Kullanıcı izinleri getirme hatası:', error);
            throw error;
        }
    }

    // Kullanıcının erişebileceği menü öğelerini getir
    async getUserMenuItems(userId) {
        try {
            const sql = `
                SELECT DISTINCT mi.* 
                FROM menu_items mi
                JOIN menu_role_access mra ON mi.id = mra.menu_id
                JOIN user_roles ur ON mra.role_id = ur.role_id
                WHERE ur.user_id = ? AND mra.can_view = 1
                ORDER BY mi.parent_id, mi.order_index
            `;
            
            return await this.executeQuery(sql, [userId]);
        } catch (error) {
            console.error('Kullanıcı menü öğeleri getirme hatası:', error);
            throw error;
        }
    }

    // Kullanıcıya rol atama
    async assignRole(userId, roleId) {
        try {
            const sql = `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`;
            await this.executeQuery(sql, [userId, roleId]);
            return true;
        } catch (error) {
            console.error('Rol atama hatası:', error);
            throw error;
        }
    }

    // Kullanıcıdan rol kaldırma
    async removeRole(userId, roleId) {
        try {
            const sql = `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`;
            await this.executeQuery(sql, [userId, roleId]);
            return true;
        } catch (error) {
            console.error('Rol kaldırma hatası:', error);
            throw error;
        }
    }
}

module.exports = User; 