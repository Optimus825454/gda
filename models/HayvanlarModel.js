/**
 * Hayvanlar model - MySQL
 */
const MySQLBaseModel = require('./MySQLBaseModel');

class Hayvanlar extends MySQLBaseModel {
    constructor() {
        super('hayvanlar');
    }

    // Temel CRUD metodlarının yanında özel metodlar

    // Küpe numarasına göre hayvan bulma
    async findByKupeNo(kupeNo) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE kupeno = ?`;
            const results = await this.executeQuery(sql, [kupeNo]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Küpe no ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Küpe numarasının son 2 hanesine göre yaşayan hayvanları bulma
    async findLivingAnimalsByEarTagEnd(earTagEnd) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE kupeno LIKE ? AND olum_tarihi IS NULL`;
            const results = await this.executeQuery(sql, [`%${earTagEnd}`]);
            return results;
        } catch (error) {
            console.error('Son 2 hane ile yaşayan hayvan arama hatası:', error);
            throw error;
        }
    }

    // Kategoriye göre hayvanları getir
    async findByKategori(kategori, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE kategori = ?`;
            const values = [kategori];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Kategori ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Durum filtreleme (aktif, satıldı, öldü vs.)
    async findByDurum(durum, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE durum = ?`;
            const values = [durum];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Durum ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Sağmal hayvanları getir
    async findBySagmal(sagmal = 1, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE sagmal = ?`;
            const values = [sagmal];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Sağmal durumu ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Gebe hayvanları getir
    async findByGebelikDurum(gebelikDurum, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE gebelikdurum = ?`;
            const values = [gebelikDurum];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Gebelik durumu ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Anne-baba ilişkisi sorgulama
    async findByParent(parentType, parentNo, options = {}) {
        try {
            const column = parentType === 'anne' ? 'anano' : 'babano';
            
            let sql = `SELECT * FROM ${this.tableName} WHERE ${column} = ?`;
            const values = [parentNo];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Ebeveyn ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Irka göre hayvanları getir
    async findByIrk(irk, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE irk LIKE ?`;
            const values = [`%${irk}%`];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Irk ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Cinsiyete göre hayvanları getir
    async findByCinsiyet(cinsiyet, options = {}) {
        try {
            let sql = `SELECT * FROM ${this.tableName} WHERE cinsiyet = ?`;
            const values = [cinsiyet];

            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Cinsiyet ile hayvan arama hatası:', error);
            throw error;
        }
    }

    // Gelişmiş arama fonksiyonu
    async search(query, options = {}) {
        try {
            const searchTerm = `%${query}%`;
            let sql = `
                SELECT * FROM ${this.tableName}
                WHERE 
                    kupeno LIKE ? OR
                    durum LIKE ? OR
                    anano LIKE ? OR
                    babano LIKE ? OR
                    tespitno LIKE ? OR
                    isim LIKE ? OR
                    irk LIKE ? OR
                    kategori LIKE ?
            `;
            
            const values = [
                searchTerm, searchTerm, searchTerm, searchTerm, 
                searchTerm, searchTerm, searchTerm, searchTerm
            ];
            
            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
            } else {
                sql += ` ORDER BY id DESC`;
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
            console.error('Hayvan arama hatası:', error);
            throw error;
        }
    }

    // İstatistik fonksiyonları
    async getKategoriSayilari() {
        try {
            const sql = `
                SELECT 
                    kategori,
                    COUNT(*) as toplam
                FROM ${this.tableName}
                GROUP BY kategori
            `;
            
            return await this.executeQuery(sql);
        } catch (error) {
            console.error('Kategori istatistikleri hatası:', error);
            throw error;
        }
    }

    // Durum istatistikleri
    async getDurumSayilari() {
        try {
            const sql = `
                SELECT 
                    durum,
                    COUNT(*) as toplam
                FROM ${this.tableName}
                GROUP BY durum
            `;
            
            return await this.executeQuery(sql);
        } catch (error) {
            console.error('Durum istatistikleri hatası:', error);
            throw error;
        }
    }
    
    // Toplam inek sayısı
    async getToplamSayim() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as toplam,
                    SUM(CASE WHEN cinsiyet = 'disi' THEN 1 ELSE 0 END) as disi_toplam,
                    SUM(CASE WHEN cinsiyet = 'erkek' THEN 1 ELSE 0 END) as erkek_toplam,
                    SUM(CASE WHEN sagmal = 1 THEN 1 ELSE 0 END) as sagmal_toplam
                FROM ${this.tableName}
                WHERE durum = 'aktif'
            `;
            
            const results = await this.executeQuery(sql);
            return results[0];
        } catch (error) {
            console.error('Toplam sayım istatistikleri hatası:', error);
            throw error;
        }
    }

    // Ölen hayvanları bulma
    async findDeadAnimals() {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE olum_tarihi IS NOT NULL`;
            const results = await this.executeQuery(sql);
            return results;
        } catch (error) {
            console.error('Ölen hayvanları arama hatası:', error);
            throw error;
        }
    }
}

// Sınıfın kendisi yerine bir örneğini (singleton) export et
module.exports = new Hayvanlar(); 