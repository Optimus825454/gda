/**
 * SaleResult.js - Satış işlemleri veri modeli
 */

const { pool } = require('../config/mysql');
const Animal = require('./Animal');

class SaleResult {
    static SALE_TYPES = {
        DAMIZLIK: 'DAMIZLIK', // Gülvet satışı
        KESIM: 'KESIM'        // AsyaEt satışı
    };

    static SALE_STATUSES = {
        BEKLEMEDE: 'BEKLEMEDE',
        TAMAMLANDI: 'TAMAMLANDI',
        IPTAL: 'IPTAL'
    };

    constructor( {
        id,
        animalId,
        saleType,
        saleDate,
        salePrice,
        companyName,
        buyerInfo,
        transportInfo,
        status,
        notes,
        // Onaylama ve fatura bilgileri
        approvedBy,
        approvalDate,
        approvalNotes,
        cancellationReason,
        cancellationDate,
        invoiceNumber,
        invoiceDate,
        paymentStatus,
        paymentDate,
        paymentMethod
    } ) {
        this.id = id;
        this.animalId = animalId;
        this.saleType = saleType; // DAMIZLIK veya KESIM
        this.saleDate = saleDate;
        this.salePrice = salePrice;
        this.companyName = companyName;
        this.buyerInfo = buyerInfo;
        this.transportInfo = transportInfo;
        this.status = status; // BEKLEMEDE, TAMAMLANDI, IPTAL
        this.notes = notes;
        // Onaylama ve fatura bilgileri
        this.approvedBy = approvedBy;
        this.approvalDate = approvalDate;
        this.approvalNotes = approvalNotes;
        this.cancellationReason = cancellationReason;
        this.cancellationDate = cancellationDate;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.paymentStatus = paymentStatus;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
    }

    static fromDatabase( dbRow ) {
        return new SaleResult( {
            id: dbRow.id,
            animalId: dbRow.animal_id,
            saleType: dbRow.sale_type,
            saleDate: dbRow.sale_date,
            salePrice: dbRow.sale_price,
            companyName: dbRow.company_name,
            buyerInfo: dbRow.buyer_info,
            transportInfo: dbRow.transport_info,
            status: dbRow.status,
            notes: dbRow.notes,
            // Onaylama ve fatura bilgileri
            approvedBy: dbRow.approved_by,
            approvalDate: dbRow.approval_date,
            approvalNotes: dbRow.approval_notes,
            cancellationReason: dbRow.cancellation_reason,
            cancellationDate: dbRow.cancellation_date,
            invoiceNumber: dbRow.invoice_number,
            invoiceDate: dbRow.invoice_date,
            paymentStatus: dbRow.payment_status,
            paymentDate: dbRow.payment_date,
            paymentMethod: dbRow.payment_method
        } );
    }

    toDatabase() {
        return {
            animal_id: this.animalId,
            sale_type: this.saleType,
            sale_date: this.saleDate,
            sale_price: this.salePrice,
            company_name: this.companyName,
            buyer_info: this.buyerInfo,
            transport_info: this.transportInfo,
            status: this.status,
            notes: this.notes,
            // Onaylama ve fatura bilgileri
            approved_by: this.approvedBy,
            approval_date: this.approvalDate,
            approval_notes: this.approvalNotes,
            cancellation_reason: this.cancellationReason,
            cancellation_date: this.cancellationDate,
            invoice_number: this.invoiceNumber,
            invoice_date: this.invoiceDate,
            payment_status: this.paymentStatus,
            payment_date: this.paymentDate,
            payment_method: this.paymentMethod
        };
    }

    validate() {
        const errors = [];

        if ( !this.animalId ) {
            errors.push( 'Hayvan ID zorunludur' );
        }

        if ( !this.saleType || !Object.values( SaleResult.SALE_TYPES ).includes( this.saleType ) ) {
            errors.push( 'Geçersiz satış türü' );
        }

        if ( !this.salePrice || this.salePrice <= 0 ) {
            errors.push( 'Geçerli bir satış fiyatı girilmelidir' );
        }

        if ( !Object.values( SaleResult.SALE_STATUSES ).includes( this.status ) ) {
            errors.push( 'Geçersiz satış durumu' );
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

        try {
            const [result] = await pool.query(
                `INSERT INTO sale_results (
                    animal_id, sale_type, sale_date, sale_price,
                    company_name, buyer_info, transport_info, status,
                    notes, approved_by, approval_date, approval_notes,
                    cancellation_reason, cancellation_date, invoice_number,
                    invoice_date, payment_status, payment_date, payment_method
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    sale_type = VALUES(sale_type),
                    sale_date = VALUES(sale_date),
                    sale_price = VALUES(sale_price),
                    company_name = VALUES(company_name),
                    buyer_info = VALUES(buyer_info),
                    transport_info = VALUES(transport_info),
                    status = VALUES(status),
                    notes = VALUES(notes),
                    approved_by = VALUES(approved_by),
                    approval_date = VALUES(approval_date),
                    approval_notes = VALUES(approval_notes),
                    cancellation_reason = VALUES(cancellation_reason),
                    cancellation_date = VALUES(cancellation_date),
                    invoice_number = VALUES(invoice_number),
                    invoice_date = VALUES(invoice_date),
                    payment_status = VALUES(payment_status),
                    payment_date = VALUES(payment_date),
                    payment_method = VALUES(payment_method)`,
                [
                    this.animalId,
                    this.saleType,
                    this.saleDate,
                    this.salePrice,
                    this.companyName,
                    JSON.stringify(this.buyerInfo),
                    JSON.stringify(this.transportInfo),
                    this.status,
                    this.notes,
                    this.approvedBy,
                    this.approvalDate,
                    this.approvalNotes,
                    this.cancellationReason,
                    this.cancellationDate,
                    this.invoiceNumber,
                    this.invoiceDate,
                    this.paymentStatus,
                    this.paymentDate,
                    this.paymentMethod
                ]
            );

            if (result.insertId) {
                this.id = result.insertId;
            }

            // Hayvan modelini güncelle
            if (this.status === SaleResult.SALE_STATUSES.TAMAMLANDI) {
                const animal = await Animal.findById(this.animalId);
                animal.saleStatus = 'SATILDI';
                animal.saleDate = this.saleDate;
                animal.salePrice = this.salePrice;
                await animal.save();
            }

            return this;
        } catch (error) {
            console.error('[SaleResult] Kaydetme hatası:', error);
            throw new Error('Satış kaydı oluşturulurken bir hata oluştu');
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM sale_results WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                throw new Error('Satış kaydı bulunamadı');
            }

            const data = rows[0];
            data.buyer_info = JSON.parse(data.buyer_info);
            data.transport_info = JSON.parse(data.transport_info);
            return SaleResult.fromDatabase(data);
        } catch (error) {
            console.error('[SaleResult] ID ile bulma hatası:', error);
            throw error;
        }
    }

    static async findByAnimalId(animalId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM sale_results WHERE animal_id = ? ORDER BY sale_date DESC',
                [animalId]
            );

            return rows.map(row => {
                row.buyer_info = JSON.parse(row.buyer_info);
                row.transport_info = JSON.parse(row.transport_info);
                return SaleResult.fromDatabase(row);
            });
        } catch (error) {
            console.error('[SaleResult] Hayvan ID ile bulma hatası:', error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await pool.query('SELECT * FROM sale_results ORDER BY sale_date DESC');
            return rows.map(row => {
                row.buyer_info = JSON.parse(row.buyer_info);
                row.transport_info = JSON.parse(row.transport_info);
                return SaleResult.fromDatabase(row);
            });
        } catch (error) {
            console.error('[SaleResult] Tüm kayıtları getirme hatası:', error);
            throw error;
        }
    }

    static async findByStatus(status) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM sale_results WHERE status = ? ORDER BY sale_date DESC',
                [status]
            );

            return rows.map(row => {
                row.buyer_info = JSON.parse(row.buyer_info);
                row.transport_info = JSON.parse(row.transport_info);
                return SaleResult.fromDatabase(row);
            });
        } catch (error) {
            console.error('[SaleResult] Durum ile bulma hatası:', error);
            throw error;
        }
    }

    static async findPendingSales() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM sale_results WHERE status = ? ORDER BY sale_date ASC',
                [SaleResult.SALE_STATUSES.BEKLEMEDE]
            );

            return rows.map(row => {
                row.buyer_info = JSON.parse(row.buyer_info);
                row.transport_info = JSON.parse(row.transport_info);
                return SaleResult.fromDatabase(row);
            });
        } catch (error) {
            console.error('[SaleResult] Bekleyen satışları getirme hatası:', error);
            throw error;
        }
    }

    static async getSaleStatistics() {
        try {
            console.log("[DEBUG] Executing getSaleStatistics in SaleResult model");

            // Önce tabloda kayıt olup olmadığını kontrol et
            const [countResult] = await pool.query('SELECT COUNT(*) as count FROM sale_results');
            
            console.log("[DEBUG] Count check result:", countResult);

            // Eğer hiç kayıt yoksa boş istatistikler döndür
            if (countResult[0].count === 0) {
                console.log("[DEBUG] No records found, returning empty stats");
                return [
                    {
                        sale_type: 'DAMIZLIK',
                        status: 'BEKLEMEDE',
                        count: 0,
                        sum: 0,
                        avg_price: 0
                    },
                    {
                        sale_type: 'KESIM',
                        status: 'BEKLEMEDE',
                        count: 0,
                        sum: 0,
                        avg_price: 0
                    }
                ];
            }

            // Kayıt varsa detaylı istatistik sorgusunu çalıştır
            const [rows] = await pool.query(`
                SELECT 
                    sale_type,
                    status,
                    COUNT(*) as count,
                    COALESCE(SUM(sale_price), 0) as sum,
                    COALESCE(AVG(sale_price), 0) as avg_price,
                    MIN(sale_date) as first_sale,
                    MAX(sale_date) as last_sale
                FROM sale_results
                GROUP BY sale_type, status
                ORDER BY sale_type, status
            `);

            console.log("[DEBUG] Statistics query result:", rows);
            return rows;
        } catch (error) {
            console.error("[DEBUG] Statistics query error:", error);
            throw error;
        }
    }

    // Toplu satış kaydetme
    static async bulkCreate(sales) {
        const results = {
            success: [],
            errors: []
        };

        // Transaction başlat
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const saleData of sales) {
                try {
                    const sale = new SaleResult(saleData);
                    const savedSale = await sale.save();
                    results.success.push(savedSale);
                } catch (error) {
                    results.errors.push({
                        data: saleData,
                        error: error.message
                    });
                }
            }

            // Başarılı işlemler varsa commit yap
            if (results.success.length > 0) {
                await connection.commit();
            } else {
                await connection.rollback();
            }

            return results;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = SaleResult;