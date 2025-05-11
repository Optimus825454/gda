/**
 * Logistics.js - Kesimhane lojistik operasyonları veri modeli
 */

const { pool } = require('../config/mysql');

class Logistics {
    static OPERATION_STATUS = {
        BEKLEMEDE: 'BEKLEMEDE',
        ISLEMDE: 'ISLEMDE',
        TAMAMLANDI: 'TAMAMLANDI',
        IPTAL: 'IPTAL'
    };

    static PROCESS_TYPES = {
        KESIM: 'KESIM',
        PARCALAMA: 'PARCALAMA',
        PAKETLEME: 'PAKETLEME'
    };

    static PRIORITY_LEVELS = {
        DUSUK: 1,
        ORTA: 2,
        YUKSEK: 3,
        ACIL: 4
    };

    constructor( data = {} ) {
        this.id = data.id;
        this.batchNumber = data.batch_number;
        this.animalIds = data.animal_ids || [];
        this.processType = data.process_type;
        this.startDate = data.start_date;
        this.estimatedEndDate = data.estimated_end_date;
        this.actualEndDate = data.actual_end_date;
        this.status = data.status || Logistics.OPERATION_STATUS.BEKLEMEDE;
        this.priority = data.priority || Logistics.PRIORITY_LEVELS.ORTA;
        this.assignedTeam = data.assigned_team;
        this.notes = data.notes || '';
        this.qualityScore = data.quality_score;
        this.temperature = data.temperature; // Soğuk zincir takibi için
        this.location = data.location;
        this.createdAt = data.created_at || new Date();
        this.updatedAt = data.updated_at || new Date();
    }

    validate() {
        const errors = [];

        if ( !this.batchNumber ) {
            errors.push( 'Parti numarası zorunludur' );
        }

        if ( !this.animalIds || this.animalIds.length === 0 ) {
            errors.push( 'En az bir hayvan ID\'si gereklidir' );
        }

        if ( !this.processType || !Object.values( Logistics.PROCESS_TYPES ).includes( this.processType ) ) {
            errors.push( 'Geçersiz işlem tipi' );
        }

        if ( !this.startDate ) {
            errors.push( 'Başlangıç tarihi zorunludur' );
        }

        if ( this.temperature !== undefined && ( this.temperature < -5 || this.temperature > 5 ) ) {
            errors.push( 'Sıcaklık -5°C ile 5°C arasında olmalıdır' );
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async save() {
        const validation = this.validate();
        if (!validation.valid) {
            throw new Error(`Validasyon hatası: ${validation.errors.join(', ')}`);
        }

        this.updatedAt = new Date();

        try {
            const [result] = await pool.query(
                `INSERT INTO logistics (
                    batch_number, animal_ids, process_type, start_date,
                    estimated_end_date, actual_end_date, status, priority,
                    assigned_team, notes, quality_score, temperature,
                    location, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    animal_ids = VALUES(animal_ids),
                    process_type = VALUES(process_type),
                    start_date = VALUES(start_date),
                    estimated_end_date = VALUES(estimated_end_date),
                    actual_end_date = VALUES(actual_end_date),
                    status = VALUES(status),
                    priority = VALUES(priority),
                    assigned_team = VALUES(assigned_team),
                    notes = VALUES(notes),
                    quality_score = VALUES(quality_score),
                    temperature = VALUES(temperature),
                    location = VALUES(location),
                    updated_at = VALUES(updated_at)`,
                [
                    this.batchNumber,
                    JSON.stringify(this.animalIds),
                    this.processType,
                    this.startDate,
                    this.estimatedEndDate,
                    this.actualEndDate,
                    this.status,
                    this.priority,
                    this.assignedTeam,
                    this.notes,
                    this.qualityScore,
                    this.temperature,
                    this.location,
                    this.createdAt,
                    this.updatedAt
                ]
            );

            if (result.insertId) {
                this.id = result.insertId;
            }

            return this;
        } catch (error) {
            console.error('[Logistics] Kaydetme hatası:', error);
            throw new Error('Lojistik operasyonu kaydedilirken bir hata oluştu');
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM logistics WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                throw new Error('Operasyon kaydı bulunamadı');
            }

            const data = rows[0];
            data.animal_ids = JSON.parse(data.animal_ids);
            return new Logistics(data);
        } catch (error) {
            console.error('[Logistics] ID ile bulma hatası:', error);
            throw error;
        }
    }

    static async findByBatchNumber(batchNumber) {
        try {
            const [rows] = await pool.query('SELECT * FROM logistics WHERE batch_number = ?', [batchNumber]);
            
            if (rows.length === 0) {
                throw new Error('Parti bulunamadı');
            }

            const data = rows[0];
            data.animal_ids = JSON.parse(data.animal_ids);
            return new Logistics(data);
        } catch (error) {
            console.error('[Logistics] Parti numarası ile bulma hatası:', error);
            throw error;
        }
    }

    static async findAll(filters = {}) {
        try {
            let query = 'SELECT * FROM logistics WHERE 1=1';
            const params = [];

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }
            if (filters.processType) {
                query += ' AND process_type = ?';
                params.push(filters.processType);
            }
            if (filters.priority) {
                query += ' AND priority = ?';
                params.push(filters.priority);
            }

            query += ' ORDER BY created_at DESC';

            const [rows] = await pool.query(query, params);
            return rows.map(row => {
                row.animal_ids = JSON.parse(row.animal_ids);
                return new Logistics(row);
            });
        } catch (error) {
            console.error('[Logistics] Tüm kayıtları getirme hatası:', error);
            throw error;
        }
    }

    async updateStatus( newStatus ) {
        if ( !Object.values( Logistics.OPERATION_STATUS ).includes( newStatus ) ) {
            throw new Error( 'Geçersiz durum' );
        }

        this.status = newStatus;
        if ( newStatus === Logistics.OPERATION_STATUS.TAMAMLANDI ) {
            this.actualEndDate = new Date();
        }

        return await this.save();
    }

    async updateTemperature( temperature ) {
        if ( temperature < -5 || temperature > 5 ) {
            throw new Error( 'Sıcaklık -5°C ile 5°C arasında olmalıdır' );
        }

        this.temperature = temperature;
        return await this.save();
    }

    static async getDailyOperations(date = new Date()) {
        try {
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const [rows] = await pool.query(
                'SELECT * FROM logistics WHERE start_date BETWEEN ? AND ?',
                [startOfDay, endOfDay]
            );

            return rows.map(row => {
                row.animal_ids = JSON.parse(row.animal_ids);
                return new Logistics(row);
            });
        } catch (error) {
            console.error('[Logistics] Günlük operasyonları getirme hatası:', error);
            throw error;
        }
    }

    static async getOperationsSummary() {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    process_type,
                    status,
                    COUNT(*) as count,
                    AVG(CASE WHEN quality_score IS NOT NULL THEN quality_score END) as avg_quality_score,
                    MIN(start_date) as earliest_operation,
                    MAX(start_date) as latest_operation
                FROM logistics 
                GROUP BY process_type, status
                ORDER BY process_type, status
            `);
            return rows;
        } catch (error) {
            console.error('[Logistics] Operasyon özeti alınırken hata:', error);
            throw error;
        }
    }
}

module.exports = Logistics;