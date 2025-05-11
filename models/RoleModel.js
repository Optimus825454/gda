/**
 * Rol model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class Role extends MySQLBaseModel {
    constructor() {
        super('roles');
    }

    // Rol adına göre rol bulma
    async findByName(name) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
            const results = await this.executeQuery(sql, [name]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Rol adına göre arama hatası:', error);
            throw error;
        }
    }

    // Rolün izinlerini getir
    async getRolePermissions(roleId) {
        try {
            const sql = `
                SELECT p.* 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ?
            `;
            
            return await this.executeQuery(sql, [roleId]);
        } catch (error) {
            console.error('Rol izinleri getirme hatası:', error);
            throw error;
        }
    }

    // Rolün kullanıcılarını getir
    async getRoleUsers(roleId) {
        try {
            const sql = `
                SELECT u.* 
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                WHERE ur.role_id = ?
            `;
            
            return await this.executeQuery(sql, [roleId]);
        } catch (error) {
            console.error('Rol kullanıcıları getirme hatası:', error);
            throw error;
        }
    }

    // Role izin atama
    async assignPermission(roleId, permissionId) {
        try {
            const sql = `INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`;
            await this.executeQuery(sql, [roleId, permissionId]);
            return true;
        } catch (error) {
            console.error('İzin atama hatası:', error);
            throw error;
        }
    }

    // Rolden izin kaldırma
    async removePermission(roleId, permissionId) {
        try {
            const sql = `DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?`;
            await this.executeQuery(sql, [roleId, permissionId]);
            return true;
        } catch (error) {
            console.error('İzin kaldırma hatası:', error);
            throw error;
        }
    }

    // Rolün menü erişimlerini getir
    async getRoleMenuAccess(roleId) {
        try {
            const sql = `
                SELECT 
                    mi.id, 
                    mi.name, 
                    mi.url, 
                    mi.icon, 
                    mi.parent_id, 
                    mi.order_index,
                    mra.can_view
                FROM menu_items mi
                LEFT JOIN menu_role_access mra ON mi.id = mra.menu_id AND mra.role_id = ?
                ORDER BY mi.parent_id, mi.order_index
            `;
            
            return await this.executeQuery(sql, [roleId]);
        } catch (error) {
            console.error('Rol menü erişimleri getirme hatası:', error);
            throw error;
        }
    }

    // Rol için menü erişimi ayarla
    async setMenuAccess(roleId, menuId, canView) {
        try {
            const sql = `
                INSERT INTO menu_role_access (role_id, menu_id, can_view) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE can_view = ?
            `;
            
            await this.executeQuery(sql, [roleId, menuId, canView, canView]);
            return true;
        } catch (error) {
            console.error('Menü erişimi ayarlama hatası:', error);
            throw error;
        }
    }
}

module.exports = Role; 