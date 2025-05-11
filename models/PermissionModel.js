/**
 * İzin model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class Permission extends MySQLBaseModel {
    constructor() {
        super('permissions');
    }

    // İzin adına göre izin bulma
    async findByName(name) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
            const results = await this.executeQuery(sql, [name]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('İzin adına göre arama hatası:', error);
            throw error;
        }
    }

    // İzne sahip rolleri getir
    async getPermissionRoles(permissionId) {
        try {
            const sql = `
                SELECT r.* 
                FROM roles r
                JOIN role_permissions rp ON r.id = rp.role_id
                WHERE rp.permission_id = ?
            `;
            
            return await this.executeQuery(sql, [permissionId]);
        } catch (error) {
            console.error('İzin rolleri getirme hatası:', error);
            throw error;
        }
    }

    // İzne sahip kullanıcıları getir
    async getPermissionUsers(permissionId) {
        try {
            const sql = `
                SELECT DISTINCT u.* 
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                WHERE rp.permission_id = ?
            `;
            
            return await this.executeQuery(sql, [permissionId]);
        } catch (error) {
            console.error('İzin kullanıcıları getirme hatası:', error);
            throw error;
        }
    }

    // Yeni izin oluştur
    async createPermission(data) {
        try {
            return await this.create(data);
        } catch (error) {
            console.error('İzin oluşturma hatası:', error);
            throw error;
        }
    }

    // İzin güncelle
    async updatePermission(id, data) {
        try {
            return await this.update(id, data);
        } catch (error) {
            console.error('İzin güncelleme hatası:', error);
            throw error;
        }
    }

    // İzin sil
    async deletePermission(id) {
        try {
            return await this.delete(id);
        } catch (error) {
            console.error('İzin silme hatası:', error);
            throw error;
        }
    }
}

module.exports = Permission; 