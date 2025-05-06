/**
 * SaleResult.js - Satış işlemleri veri modeli
 */

const { supabase } = require( '../config/supabaseClient' );
const Animal = require( './Animal' );

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
        if ( !validation.valid ) {
            throw new Error( `Validasyon hatası: ${validation.errors.join( ', ' )}` );
        }

        const { data, error } = await supabase
            .from( 'sale_results' )
            .upsert( this.toDatabase() )
            .select();

        if ( error ) throw error;

        // Hayvan modelini güncelle
        if ( this.status === SaleResult.SALE_STATUSES.TAMAMLANDI ) {
            const animal = await Animal.findById( this.animalId );
            animal.saleStatus = 'SATILDI';
            animal.saleDate = this.saleDate;
            animal.salePrice = this.salePrice;
            await animal.save();
        }

        return SaleResult.fromDatabase( data[0] );
    }

    static async findById( id ) {
        const { data, error } = await supabase
            .from( 'sale_results' )
            .select( '*' )
            .eq( 'id', id )
            .single();

        if ( error ) throw error;
        if ( !data ) throw new Error( 'Satış kaydı bulunamadı' );
        return SaleResult.fromDatabase( data );
    }

    static async findByAnimalId( animalId ) {
        const { data, error } = await supabase
            .from( 'sale_results' )
            .select( '*' )
            .eq( 'animal_id', animalId )
            .order( 'sale_date', { ascending: false } );

        if ( error ) throw error;
        return data.map( SaleResult.fromDatabase );
    }

    static async findAll() {
        const { data, error } = await supabase
            .from( 'sale_results' )
            .select( '*' )
            .order( 'sale_date', { ascending: false } );

        if ( error ) throw error;
        return data.map( SaleResult.fromDatabase );
    }

    static async findByStatus( status ) {
        const { data, error } = await supabase
            .from( 'sale_results' )
            .select( '*' )
            .eq( 'status', status )
            .order( 'sale_date', { ascending: false } );

        if ( error ) throw error;
        return data.map( SaleResult.fromDatabase );
    }

    static async findPendingSales() {
        const { data, error } = await supabase
            .from( 'sale_results' )
            .select( '*' )
            .eq( 'status', SaleResult.SALE_STATUSES.BEKLEMEDE )
            .order( 'sale_date', { ascending: true } );

        if ( error ) throw error;
        return data.map( SaleResult.fromDatabase );
    }

    static async getSaleStatistics() {
        try {
            console.log( "[DEBUG] Executing getSaleStatistics in SaleResult model" );

            // Önce tabloda kayıt olup olmadığını kontrol et
            const countCheck = await supabase
                .from( 'sale_results' )
                .select( 'id', { count: 'exact', head: true } );

            console.log( "[DEBUG] Count check result:", countCheck );

            if ( countCheck.error ) {
                console.error( "[DEBUG] Count check error:", countCheck.error );
                throw countCheck.error;
            }

            // Eğer hiç kayıt yoksa boş istatistikler döndür
            if ( countCheck.count === 0 ) {
                console.log( "[DEBUG] No records found, returning empty stats" );
                return [
                    {
                        sale_type: 'DAMIZLIK',
                        status: 'BEKLEMEDE',
                        count: 0,
                        sum: 0
                    },
                    {
                        sale_type: 'KESIM',
                        status: 'BEKLEMEDE',
                        count: 0,
                        sum: 0
                    }
                ];
            }

            // Kayıt varsa normal istatistik sorgusunu çalıştır
            const { data, error } = await supabase
                .from( 'sale_results' )
                .select( `
                    sale_type,
                    status,
                    count(*),
                    sum(sale_price)
                `)
                .group( 'sale_type, status' );

            if ( error ) {
                console.error( "[DEBUG] Statistics query error:", error );
                throw error;
            }

            console.log( "[DEBUG] Statistics query result:", data );
            return data;
        } catch ( error ) {
            console.error( "[DEBUG] Error in getSaleStatistics:", error );
            throw error;
        }
    }

    // Toplu satış kaydetme
    static async bulkCreate( sales ) {
        const results = {
            success: [],
            errors: []
        };

        for ( const saleData of sales ) {
            try {
                const sale = new SaleResult( saleData );
                const savedSale = await sale.save();
                results.success.push( savedSale );
            } catch ( error ) {
                results.errors.push( {
                    data: saleData,
                    error: error.message
                } );
            }
        }

        return results;
    }
}

module.exports = SaleResult;