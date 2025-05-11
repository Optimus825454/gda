/**
 * Animal model - MySQL versiyonu
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class Animal extends MySQLBaseModel {
    constructor() {
        super('animals');
    }

    // Özel metodlar
    async findByTag(tagId) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE tag_id = ?`;
            const results = await this.executeQuery(sql, [tagId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Tag ile hayvan arama hatası:', error);
            throw error;
        }
    }

    async findByCategory(categoryId, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE category_id = ?`;
            const values = [categoryId];

            // Sıralama varsa
            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY created_at DESC`;
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

            return await this.executeQuery(sql, values);
        } catch (error) {
            console.error('Kategori ile hayvan arama hatası:', error);
            throw error;
        }
    }

    async getInventorySummary() {
        try {
            const sql = `
                SELECT 
                    c.name as category,
                    COUNT(a.id) as total_count,
                    SUM(a.weight) as total_weight,
                    AVG(a.weight) as avg_weight,
                    MIN(a.weight) as min_weight,
                    MAX(a.weight) as max_weight,
                    SUM(a.purchase_price) as total_purchase_value
                FROM animals a
                JOIN categories c ON a.category_id = c.id
                WHERE a.status = 'active'
                GROUP BY a.category_id
                ORDER BY c.name
            `;
            
            return await this.executeQuery(sql);
        } catch (error) {
            console.error('Envanter özeti alma hatası:', error);
            throw error;
        }
    }

    async updateHealthStatus(animalId, healthStatus, notes = null) {
        try {
            const sql = `
                UPDATE ${this.tableName} 
                SET 
                    health_status = ?,
                    health_notes = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            
            await this.executeQuery(sql, [healthStatus, notes, animalId]);
            return { id: animalId, health_status: healthStatus, health_notes: notes };
        } catch (error) {
            console.error('Sağlık durumu güncelleme hatası:', error);
            throw error;
        }
    }

    async search(query, options = {}) {
        try {
            const searchTerm = `%${query}%`;
            let sql = `
                SELECT * FROM ${this.tableName}
                WHERE 
                    tag_id LIKE ? OR
                    name LIKE ? OR
                    breed LIKE ? OR
                    description LIKE ?
            `;
            
            const values = [searchTerm, searchTerm, searchTerm, searchTerm];
            
            // Sıralama
            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY created_at DESC`;
            }
            
            // Limit ve offset
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
            console.error('Hayvan arama hatası:', error);
            throw error;
        }
    }

    // Ölüm kaydı oluşturma
    async recordDeath(animalId, date, cause, notes = null) {
        try {
            const updateSql = `
                UPDATE ${this.tableName}
                SET 
                    status = 'deceased',
                    death_date = ?,
                    death_cause = ?,
                    death_notes = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            
            await this.executeQuery(updateSql, [date, cause, notes, animalId]);
            
            // Ölüm kaydını ayrı bir tabloya da ekleyebiliriz
            const logSql = `
                INSERT INTO animal_death_records (
                    animal_id, date, cause, notes, created_at
                ) VALUES (?, ?, ?, ?, NOW())
            `;
            
            await this.executeQuery(logSql, [animalId, date, cause, notes]);
            
            return { id: animalId, status: 'deceased', death_date: date, death_cause: cause };
        } catch (error) {
            console.error('Ölüm kaydı oluşturma hatası:', error);
            throw error;
        }
    }
}

module.exports = new Animal(); 