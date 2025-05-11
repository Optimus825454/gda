/**
 * Hayvan Ağırlık model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class HayvanAgirlik extends MySQLBaseModel {
    constructor() {
        super('hayvan_agirlik');
    }

    // Hayvana göre ağırlık kayıtlarını getir
    async findByHayvanId(hayvanId, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE hayvan_id = ?`;
            const values = [hayvanId];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY created_at DESC`;
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
            console.error('Hayvan ID ile ağırlık arama hatası:', error);
            throw error;
        }
    }

    // Tarih aralığına göre ağırlık kayıtlarını getir
    async findByDateRange(startDate, endDate, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE created_at BETWEEN ? AND ?`;
            const values = [startDate, endDate];

            if (options.hayvanId) {
                sql += ` AND hayvan_id = ?`;
                values.push(options.hayvanId);
            }

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY created_at DESC`;
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
            console.error('Tarih aralığı ile ağırlık arama hatası:', error);
            throw error;
        }
    }

    // Ağırlık değer aralığına göre kayıtları getir
    async findByAgirlikRange(minAgirlik, maxAgirlik, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE agirlik BETWEEN ? AND ?`;
            const values = [minAgirlik, maxAgirlik];

            if (options.hayvanId) {
                sql += ` AND hayvan_id = ?`;
                values.push(options.hayvanId);
            }

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY created_at DESC`;
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
            console.error('Ağırlık aralığı ile arama hatası:', error);
            throw error;
        }
    }

    // Bir hayvanın belirli bir tarihte ağırlığını al
    async getAgirlikByDate(hayvanId, tarih) {
        try {
            const formattedDate = new Date(tarih).toISOString().split('T')[0];
            const sql = `
                SELECT * 
                FROM ${this.tableName} 
                WHERE hayvan_id = ? 
                AND DATE(created_at) = ?
                ORDER BY created_at DESC
                LIMIT 1
            `;
            
            const results = await this.executeQuery(sql, [hayvanId, formattedDate]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Belirli tarihteki ağırlık verisi hatası:', error);
            throw error;
        }
    }

    // Bir hayvanın son kaydedilen ağırlığını al
    async getLastAgirlik(hayvanId) {
        try {
            const sql = `
                SELECT * 
                FROM ${this.tableName} 
                WHERE hayvan_id = ? 
                ORDER BY created_at DESC
                LIMIT 1
            `;
            
            const results = await this.executeQuery(sql, [hayvanId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Son ağırlık verisi hatası:', error);
            throw error;
        }
    }

    // Ağırlık gelişim grafiği için veri al
    async getAgirlikGelisimi(hayvanId, limit = 10) {
        try {
            const sql = `
                SELECT 
                    hayvan_id,
                    agirlik,
                    created_at as tarih
                FROM ${this.tableName}
                WHERE hayvan_id = ?
                ORDER BY created_at ASC
                LIMIT ?
            `;
            
            return await this.executeQuery(sql, [hayvanId, limit]);
        } catch (error) {
            console.error('Ağırlık gelişimi verisi hatası:', error);
            throw error;
        }
    }
}

module.exports = HayvanAgirlik; 