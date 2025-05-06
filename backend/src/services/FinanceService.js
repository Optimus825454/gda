const Finance = require( '../models/Finance' );
const Invoice = require( '../models/Invoice' );
const Payment = require( '../models/Payment' );
const DimesClient = require( '../utils/dimesClient' );
const { ValidationError, NotFoundError } = require( '../utils/errors' );

class FinanceService {
    constructor() {
        this.dimesClient = new DimesClient();
    }

    // Genel finans işlemleri
    async createTransaction( data ) {
        try {
            const transaction = new Finance( data );
            await transaction.validate();
            return await transaction.save();
        } catch ( error ) {
            throw new ValidationError( 'İşlem oluşturma hatası: ' + error.message );
        }
    }

    async getTransactions( filters ) {
        const { page, limit, type, startDate, endDate, status } = filters;
        const query = {};

        if ( type ) query.type = type;
        if ( status ) query.status = status;
        if ( startDate || endDate ) {
            query.date = {};
            if ( startDate ) query.date.$gte = new Date( startDate );
            if ( endDate ) query.date.$lte = new Date( endDate );
        }

        return await Finance.find( query )
            .sort( { date: -1 } )
            .skip( ( page - 1 ) * limit )
            .limit( limit )
            .exec();
    }

    async getTransactionById( id ) {
        const transaction = await Finance.findById( id );
        if ( !transaction ) {
            throw new NotFoundError( 'İşlem bulunamadı' );
        }
        return transaction;
    }

    async updateTransaction( id, data ) {
        const transaction = await Finance.findByIdAndUpdate( id, data, {
            new: true,
            runValidators: true
        } );
        if ( !transaction ) {
            throw new NotFoundError( 'İşlem bulunamadı' );
        }
        return transaction;
    }

    // Fatura işlemleri
    async createInvoice( data ) {
        try {
            const invoice = new Invoice( data );
            await invoice.validate();
            const savedInvoice = await invoice.save();

            // DIMES entegrasyonu
            if ( process.env.DIMES_AUTO_SYNC === 'true' ) {
                await this.syncInvoiceWithDimes( savedInvoice );
            }

            return savedInvoice;
        } catch ( error ) {
            throw new ValidationError( 'Fatura oluşturma hatası: ' + error.message );
        }
    }

    async getInvoices( filters ) {
        const { page, limit, type, startDate, endDate, status } = filters;
        const query = {};

        if ( type ) query.type = type;
        if ( status ) query.status = status;
        if ( startDate || endDate ) {
            query.date = {};
            if ( startDate ) query.date.$gte = new Date( startDate );
            if ( endDate ) query.date.$lte = new Date( endDate );
        }

        return await Invoice.find( query )
            .sort( { date: -1 } )
            .skip( ( page - 1 ) * limit )
            .limit( limit )
            .exec();
    }

    // Ödeme işlemleri
    async createPayment( data ) {
        try {
            const payment = new Payment( data );
            await payment.validate();
            const savedPayment = await payment.save();

            // DIMES entegrasyonu
            if ( process.env.DIMES_AUTO_SYNC === 'true' ) {
                await this.syncPaymentWithDimes( savedPayment );
            }

            return savedPayment;
        } catch ( error ) {
            throw new ValidationError( 'Ödeme oluşturma hatası: ' + error.message );
        }
    }

    async getPayments( filters ) {
        const { page, limit, type, startDate, endDate, status } = filters;
        const query = {};

        if ( type ) query.type = type;
        if ( status ) query.status = status;
        if ( startDate || endDate ) {
            query.date = {};
            if ( startDate ) query.date.$gte = new Date( startDate );
            if ( endDate ) query.date.$lte = new Date( endDate );
        }

        return await Payment.find( query )
            .sort( { date: -1 } )
            .skip( ( page - 1 ) * limit )
            .limit( limit )
            .exec();
    }

    // DIMES entegrasyonu işlemleri
    async syncWithDimes() {
        try {
            const syncResults = {
                invoices: await this.syncPendingInvoices(),
                payments: await this.syncPendingPayments()
            };
            return syncResults;
        } catch ( error ) {
            throw new Error( 'DIMES senkronizasyon hatası: ' + error.message );
        }
    }

    async syncPendingInvoices() {
        const pendingInvoices = await Invoice.find( {
            'dimesIntegration.status': { $ne: 'SYNCED' }
        } );

        const results = await Promise.allSettled(
            pendingInvoices.map( invoice => this.syncInvoiceWithDimes( invoice ) )
        );

        return {
            total: pendingInvoices.length,
            success: results.filter( r => r.status === 'fulfilled' ).length,
            failed: results.filter( r => r.status === 'rejected' ).length
        };
    }

    async syncPendingPayments() {
        const pendingPayments = await Payment.find( {
            'dimesIntegration.status': { $ne: 'SYNCED' }
        } );

        const results = await Promise.allSettled(
            pendingPayments.map( payment => this.syncPaymentWithDimes( payment ) )
        );

        return {
            total: pendingPayments.length,
            success: results.filter( r => r.status === 'fulfilled' ).length,
            failed: results.filter( r => r.status === 'rejected' ).length
        };
    }

    async syncInvoiceWithDimes( invoice ) {
        try {
            const dimesResponse = await this.dimesClient.sendInvoice( invoice );

            invoice.dimesIntegration = {
                integrationId: dimesResponse.id,
                status: 'SYNCED',
                lastSync: new Date()
            };

            await invoice.save();
            return dimesResponse;
        } catch ( error ) {
            invoice.dimesIntegration.errors.push( {
                code: error.code || 'UNKNOWN',
                message: error.message,
                timestamp: new Date()
            } );
            await invoice.save();
            throw error;
        }
    }

    async syncPaymentWithDimes( payment ) {
        try {
            const dimesResponse = await this.dimesClient.sendPayment( payment );

            payment.dimesIntegration = {
                integrationId: dimesResponse.id,
                status: 'SYNCED',
                lastSync: new Date()
            };

            await payment.save();
            return dimesResponse;
        } catch ( error ) {
            payment.dimesIntegration.errors.push( {
                code: error.code || 'UNKNOWN',
                message: error.message,
                timestamp: new Date()
            } );
            await payment.save();
            throw error;
        }
    }

    async getDimesStatus() {
        try {
            const status = await this.dimesClient.getSystemStatus();
            return {
                isAvailable: status.isAvailable,
                lastCheck: new Date(),
                syncStats: await this.getSyncStatistics()
            };
        } catch ( error ) {
            throw new Error( 'DIMES durum kontrolü hatası: ' + error.message );
        }
    }

    // Raporlama işlemleri
    async getFinancialSummary( startDate, endDate ) {
        const query = {};
        if ( startDate || endDate ) {
            query.date = {};
            if ( startDate ) query.date.$gte = new Date( startDate );
            if ( endDate ) query.date.$lte = new Date( endDate );
        }

        const [income, expenses, invoices, payments] = await Promise.all( [
            Finance.aggregate( [
                { $match: { ...query, type: 'INCOME' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ] ),
            Finance.aggregate( [
                { $match: { ...query, type: 'EXPENSE' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ] ),
            Invoice.aggregate( [
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
            ] ),
            Payment.aggregate( [
                { $match: query },
                { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
            ] )
        ] );

        return {
            income: income[0]?.total || 0,
            expenses: expenses[0]?.total || 0,
            balance: ( income[0]?.total || 0 ) - ( expenses[0]?.total || 0 ),
            invoices: this.formatAggregateResults( invoices ),
            payments: this.formatAggregateResults( payments )
        };
    }

    async getCashFlow( startDate, endDate, interval = 'monthly' ) {
        const query = {};
        if ( startDate || endDate ) {
            query.date = {};
            if ( startDate ) query.date.$gte = new Date( startDate );
            if ( endDate ) query.date.$lte = new Date( endDate );
        }

        const groupByInterval = {
            daily: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            weekly: { $week: '$date' },
            monthly: {
                $dateToString: { format: '%Y-%m', date: '$date' }
            }
        };

        const cashFlow = await Finance.aggregate( [
            { $match: query },
            {
                $group: {
                    _id: {
                        period: groupByInterval[interval],
                        type: '$type'
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.period': 1 } }
        ] );

        return this.formatCashFlowResults( cashFlow, interval );
    }

    // Yardımcı metodlar
    formatAggregateResults( results ) {
        return results.reduce( ( acc, curr ) => {
            acc[curr._id.toLowerCase()] = {
                count: curr.count,
                total: curr.total
            };
            return acc;
        }, {} );
    }

    formatCashFlowResults( results, interval ) {
        return results.reduce( ( acc, curr ) => {
            const period = curr._id.period;
            if ( !acc[period] ) {
                acc[period] = { income: 0, expense: 0, balance: 0 };
            }

            if ( curr._id.type === 'INCOME' ) {
                acc[period].income = curr.total;
            } else if ( curr._id.type === 'EXPENSE' ) {
                acc[period].expense = curr.total;
            }

            acc[period].balance = acc[period].income - acc[period].expense;
            return acc;
        }, {} );
    }

    async getSyncStatistics() {
        const [invoices, payments] = await Promise.all( [
            Invoice.aggregate( [
                {
                    $group: {
                        _id: '$dimesIntegration.status',
                        count: { $sum: 1 }
                    }
                }
            ] ),
            Payment.aggregate( [
                {
                    $group: {
                        _id: '$dimesIntegration.status',
                        count: { $sum: 1 }
                    }
                }
            ] )
        ] );

        return {
            invoices: this.formatSyncStats( invoices ),
            payments: this.formatSyncStats( payments )
        };
    }

    formatSyncStats( results ) {
        return results.reduce( ( acc, curr ) => {
            acc[curr._id?.toLowerCase() || 'pending'] = curr.count;
            return acc;
        }, { synced: 0, pending: 0, failed: 0 } );
    }
}

module.exports = FinanceService;