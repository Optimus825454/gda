const FinanceService = require( '../services/FinanceService' );
const { handleResponse, handleError } = require( '../utils/responseHelper' );

class FinanceController {
    constructor() {
        this.financeService = new FinanceService();
    }

    // Genel finans işlemleri
    async createTransaction( req, res ) {
        try {
            const transaction = await this.financeService.createTransaction( req.body );
            return handleResponse( res, 201, 'İşlem başarıyla oluşturuldu', transaction );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async getTransactions( req, res ) {
        try {
            const { page = 1, limit = 10, type, startDate, endDate, status } = req.query;
            const transactions = await this.financeService.getTransactions( {
                page: parseInt( page ),
                limit: parseInt( limit ),
                type,
                startDate,
                endDate,
                status
            } );
            return handleResponse( res, 200, 'İşlemler başarıyla getirildi', transactions );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async getTransactionById( req, res ) {
        try {
            const transaction = await this.financeService.getTransactionById( req.params.id );
            return handleResponse( res, 200, 'İşlem başarıyla getirildi', transaction );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async updateTransaction( req, res ) {
        try {
            const transaction = await this.financeService.updateTransaction( req.params.id, req.body );
            return handleResponse( res, 200, 'İşlem başarıyla güncellendi', transaction );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    // Fatura işlemleri
    async createInvoice( req, res ) {
        try {
            const invoice = await this.financeService.createInvoice( req.body );
            return handleResponse( res, 201, 'Fatura başarıyla oluşturuldu', invoice );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async getInvoices( req, res ) {
        try {
            const { page = 1, limit = 10, type, startDate, endDate, status } = req.query;
            const invoices = await this.financeService.getInvoices( {
                page: parseInt( page ),
                limit: parseInt( limit ),
                type,
                startDate,
                endDate,
                status
            } );
            return handleResponse( res, 200, 'Faturalar başarıyla getirildi', invoices );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    // Ödeme işlemleri
    async createPayment( req, res ) {
        try {
            const payment = await this.financeService.createPayment( req.body );
            return handleResponse( res, 201, 'Ödeme başarıyla oluşturuldu', payment );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async getPayments( req, res ) {
        try {
            const { page = 1, limit = 10, type, startDate, endDate, status } = req.query;
            const payments = await this.financeService.getPayments( {
                page: parseInt( page ),
                limit: parseInt( limit ),
                type,
                startDate,
                endDate,
                status
            } );
            return handleResponse( res, 200, 'Ödemeler başarıyla getirildi', payments );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    // DIMES entegrasyonu işlemleri
    async syncWithDimes( req, res ) {
        try {
            const result = await this.financeService.syncWithDimes();
            return handleResponse( res, 200, 'DIMES senkronizasyonu başarılı', result );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async getDimesStatus( req, res ) {
        try {
            const status = await this.financeService.getDimesStatus();
            return handleResponse( res, 200, 'DIMES durumu başarıyla getirildi', status );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    // Raporlama işlemleri
    async getFinancialSummary( req, res ) {
        try {
            const { startDate, endDate } = req.query;
            const summary = await this.financeService.getFinancialSummary( startDate, endDate );
            return handleResponse( res, 200, 'Finansal özet başarıyla getirildi', summary );
        } catch ( error ) {
            return handleError( res, error );
        }
    }

    async getCashFlow( req, res ) {
        try {
            const { startDate, endDate, interval = 'monthly' } = req.query;
            const cashFlow = await this.financeService.getCashFlow( startDate, endDate, interval );
            return handleResponse( res, 200, 'Nakit akışı başarıyla getirildi', cashFlow );
        } catch ( error ) {
            return handleError( res, error );
        }
    }
}

module.exports = new FinanceController();