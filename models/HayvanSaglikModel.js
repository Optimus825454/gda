/**
 * Hayvan Sağlık model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class HayvanSaglik extends MySQLBaseModel {
    constructor() {
        super('hayvan_saglik');
    }

    // Hayvana göre sağlık kayıtlarını getir
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
            console.error('Hayvan ID ile sağlık arama hatası:', error);
            throw error;
        }
    }

    // Sağlık durumuna göre kayıtları getir
    async findByDurum(durum, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE durum = ?`;
            const values = [durum];

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
            console.error('Durum ile sağlık arama hatası:', error);
            throw error;
        }
    }

    // Tarih aralığına göre sağlık kayıtlarını getir
    async findByDateRange(startDate, endDate, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE created_at BETWEEN ? AND ?`;
            const values = [startDate, endDate];

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
            console.error('Tarih aralığı ile sağlık arama hatası:', error);
            throw error;
        }
    }

    // Sağlık istatistikleri
    async getSaglikIstatistikleri() {
        try {
            const sql = `
                SELECT 
                    durum, 
                    COUNT(*) as toplam_kayit, 
                    MIN(created_at) as ilk_kayit_tarihi, 
                    MAX(created_at) as son_kayit_tarihi
                FROM ${this.tableName}
                GROUP BY durum
                ORDER BY toplam_kayit DESC
            `;
            
            return await this.executeQuery(sql);
        } catch (error) {
            console.error('Sağlık istatistikleri hatası:', error);
            throw error;
        }
    }

    // Belirli bir hayvan için sağlık geçmişi
    async getHayvanSaglikGecmisi(hayvanId) {
        try {
            const sql = `
                SELECT 
                    s.*, 
                    h.kupeno, 
                    h.durum as hayvan_durum, 
                    h.kategori
                FROM ${this.tableName} s
                JOIN hayvanlar h ON s.hayvan_id = h.id
                WHERE s.hayvan_id = ?
                ORDER BY s.created_at DESC
            `;
            
            return await this.executeQuery(sql, [hayvanId]);
        } catch (error) {
            console.error('Hayvan sağlık geçmişi hatası:', error);
            throw error;
        }
    }
}

module.exports = HayvanSaglik; 