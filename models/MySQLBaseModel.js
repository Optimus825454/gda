/**
 * MySQL temel model sınıfı
 * Veritabanı geçişi sırasında tüm modeller bu temel modelden türetilecek
 */
const { pool } = require('../config/mysql');

class MySQLBaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    // Kayıt oluşturma
    async create(data) {
        try {
            const columns = Object.keys(data).join(', ');
            const placeholders = Object.keys(data).map(() => '?').join(', ');
            const values = Object.values(data);

            const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
            const [result] = await pool.execute(sql, values);
            
            return { 
                id: result.insertId,
                ...data
            };
        } catch (error) {
            console.error(`${this.tableName} oluşturma hatası:`, error);
            throw error;
        }
    }

    // Tek kayıt getirme
    async findById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const [results] = await pool.execute(sql, [id]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error(`${this.tableName} getirme hatası:`, error);
            throw error;
        }
    }

    // Tüm kayıtları getirme
    async findAll(options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName}`;
            const values = [];

            // WHERE koşulları varsa
            if (options.where) {
                const conditions = [];
                for (const [key, value] of Object.entries(options.where)) {
                    conditions.push(`${key} = ?`);
                    values.push(value);
                }
                if (conditions.length > 0) {
                    sql += ` WHERE ${conditions.join(' AND ')}`;
                }
            }

            // Sıralama varsa
            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            }

            // Limit varsa
            if (options.limit) {
                sql += ` LIMIT ?`;
                values.push(options.limit);
            }

            // Offset varsa
            if (options.offset) {
                sql += ` OFFSET ?`;
                values.push(options.offset);
            }

            const [results] = await pool.execute(sql, values);
            return results;
        } catch (error) {
            console.error(`${this.tableName} listeleme hatası:`, error);
            throw error;
        }
    }

    // Kayıt güncelleme
    async update(id, data) {
        try {
            const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), id];

            const sql = `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`;
            const [result] = await pool.execute(sql, values);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error(`${this.tableName} güncelleme hatası:`, error);
            throw error;
        }
    }

    // Kayıt silme
    async delete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const [result] = await pool.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error(`${this.tableName} silme hatası:`, error);
            throw error;
        }
    }

    // Özel sorgu çalıştırma
    async executeQuery(sql, params = []) {
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error(`Özel sorgu hatası:`, error);
            throw error;
        }
    }
}

module.exports = MySQLBaseModel; 