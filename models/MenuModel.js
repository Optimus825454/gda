/**
 * Menü model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class Menu extends MySQLBaseModel {
    constructor() {
        super('menu_items');
    }

    // Menü öğelerini getir (hiyerarşik yapıda)
    async getMenuTree() {
        try {
            // Önce tüm menü öğelerini getir
            const sql = `SELECT * FROM ${this.tableName} ORDER BY parent_id, order_index`;
            const menuItems = await this.executeQuery(sql);
            
            // Hiyerarşik yapıya dönüştür
            const menuMap = {};
            const rootItems = [];
            
            // Önce hepsini bir map'e ekle
            menuItems.forEach(item => {
                menuMap[item.id] = { ...item, children: [] };
            });
            
            // Sonra parent-child ilişkilerini kur
            menuItems.forEach(item => {
                if (item.parent_id) {
                    // Eğer parent_id varsa, bu bir alt menü öğesi
                    if (menuMap[item.parent_id]) {
                        menuMap[item.parent_id].children.push(menuMap[item.id]);
                    }
                } else {
                    // Eğer parent_id yoksa, bu bir kök menü öğesi
                    rootItems.push(menuMap[item.id]);
                }
            });
            
            return rootItems;
        } catch (error) {
            console.error('Menü ağacı getirme hatası:', error);
            throw error;
        }
    }

    // Menü öğelerini düz liste olarak getir
    async getMenuList() {
        try {
            const sql = `SELECT * FROM ${this.tableName} ORDER BY parent_id, order_index`;
            return await this.executeQuery(sql);
        } catch (error) {
            console.error('Menü listesi getirme hatası:', error);
            throw error;
        }
    }

    // Menü öğesini adına göre bul
    async findByName(name) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
            const results = await this.executeQuery(sql, [name]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Menü adına göre arama hatası:', error);
            throw error;
        }
    }

    // Alt menü öğelerini getir
    async getChildMenuItems(parentId) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE parent_id = ? ORDER BY order_index`;
            return await this.executeQuery(sql, [parentId]);
        } catch (error) {
            console.error('Alt menü öğeleri getirme hatası:', error);
            throw error;
        }
    }

    // Menü öğesinin erişim yetkilerini getir
    async getMenuAccess(menuId) {
        try {
            const sql = `
                SELECT 
                    r.id,
                    r.name,
                    r.description,
                    mra.can_view
                FROM roles r
                LEFT JOIN menu_role_access mra ON r.id = mra.role_id AND mra.menu_id = ?
                ORDER BY r.name
            `;
            
            return await this.executeQuery(sql, [menuId]);
        } catch (error) {
            console.error('Menü erişimi getirme hatası:', error);
            throw error;
        }
    }

    // Menü öğesinin sırasını güncelle
    async updateMenuOrder(menuId, orderIndex) {
        try {
            const sql = `UPDATE ${this.tableName} SET order_index = ? WHERE id = ?`;
            await this.executeQuery(sql, [orderIndex, menuId]);
            return true;
        } catch (error) {
            console.error('Menü sırası güncelleme hatası:', error);
            throw error;
        }
    }

    // Belirli bir role sahip kullanıcılar için menü öğelerini getir
    async getMenuForRole(roleId) {
        try {
            const sql = `
                SELECT mi.*
                FROM ${this.tableName} mi
                JOIN menu_role_access mra ON mi.id = mra.menu_id
                WHERE mra.role_id = ? AND mra.can_view = 1
                ORDER BY mi.parent_id, mi.order_index
            `;
            
            return await this.executeQuery(sql, [roleId]);
        } catch (error) {
            console.error('Rol için menü getirme hatası:', error);
            throw error;
        }
    }
}

module.exports = Menu; 