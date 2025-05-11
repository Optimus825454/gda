/**
 * Hayvan Aşı model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class HayvanAsi extends MySQLBaseModel {
    constructor() {
        super('hayvan_asi');
    }

    // Hayvana göre aşıları getir
    async findByHayvanId(hayvanId, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE hayvan_id = ?`;
            const values = [hayvanId];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY asi_tarihi DESC`;
            }

            if (options.limit) {
                sql += ` LIMIT ?`;
                values.push(options.limit);
            }

            if (options.offset) {
                sql += ` OFFSET ?`;
                values.push(options.offset);
            }

            return await this.executeQuery(sql, values);
        } catch (error) {
            console.error('Hayvan ID ile aşı arama hatası:', error);
            throw error;
        }
    }

    // Aşı türüne göre aşıları getir
    async findByAsiTuru(asiTuru, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE asi_turu = ?`;
            const values = [asiTuru];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY asi_tarihi DESC`;
            }

            if (options.limit) {
                sql += ` LIMIT ?`;
                values.push(options.limit);
            }

            if (options.offset) {
                sql += ` OFFSET ?`;
                values.push(options.offset);
            }

            return await this.executeQuery(sql, values);
        } catch (error) {
            console.error('Aşı türü ile aşı arama hatası:', error);
            throw error;
        }
    }

    // Tarih aralığına göre aşıları getir
    async findByDateRange(startDate, endDate, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE asi_tarihi BETWEEN ? AND ?`;
            const values = [startDate, endDate];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY asi_tarihi DESC`;
            }

            if (options.limit) {
                sql += ` LIMIT ?`;
                values.push(options.limit);
            }

            if (options.offset) {
                sql += ` OFFSET ?`;
                values.push(options.offset);
            }

            return await this.executeQuery(sql, values);
        } catch (error) {
            console.error('Tarih aralığı ile aşı arama hatası:', error);
            throw error;
        }
    }

    // Aşı istatistikleri
    async getAsiIstatistikleri() {
        try {
            const sql = `
                SELECT 
                    asi_turu, 
                    COUNT(*) as toplam_asi, 
                    MIN(asi_tarihi) as ilk_asi_tarihi, 
                    MAX(asi_tarihi) as son_asi_tarihi
                FROM ${this.tableName}
                GROUP BY asi_turu
                ORDER BY toplam_asi DESC
            `;
            
            return await this.executeQuery(sql);
        } catch (error) {
            console.error('Aşı istatistikleri hatası:', error);
            throw error;
        }
    }

    // Belirli bir hayvan için aşı geçmişi
    async getHayvanAsiGecmisi(hayvanId) {
        try {
            const sql = `
                SELECT 
                    a.*, 
                    h.kupeno, 
                    h.durum, 
                    h.kategori
                FROM ${this.tableName} a
                JOIN hayvanlar h ON a.hayvan_id = h.id
                WHERE a.hayvan_id = ?
                ORDER BY a.asi_tarihi DESC
            `;
            
            return await this.executeQuery(sql, [hayvanId]);
        } catch (error) {
            console.error('Hayvan aşı geçmişi hatası:', error);
            throw error;
        }
    }
}

module.exports = HayvanAsi; 