const { mockRequest, mockResponse } = require( '../mocks/express' );
const FinanceController = require( '../../controllers/FinanceController' );
const FinanceService = require( '../../services/FinanceService' );

jest.mock( '../../services/FinanceService' );

describe( 'FinanceController Tests', () => {
    let controller;
    let req;
    let res;

    beforeEach( () => {
        controller = new FinanceController();
        req = mockRequest();
        res = mockResponse();
        jest.clearAllMocks();
    } );

    describe( 'Genel Finans İşlemleri', () => {
        describe( 'createTransaction', () => {
            it( 'başarılı işlem oluşturma durumunu test eder', async () => {
                const mockTransaction = {
                    id: '123',
                    type: 'INCOME',
                    amount: 1000
                };

                FinanceService.prototype.createTransaction.mockResolvedValue( mockTransaction );

                await controller.createTransaction( req, res );

                expect( res.status ).toHaveBeenCalledWith( 201 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'İşlem başarıyla oluşturuldu',
                    data: mockTransaction
                } );
            } );

            it( 'validasyon hatası durumunu test eder', async () => {
                const error = new Error( 'Validation error' );
                FinanceService.prototype.createTransaction.mockRejectedValue( error );

                await controller.createTransaction( req, res );

                expect( res.status ).toHaveBeenCalledWith( 400 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: false,
                    message: error.message
                } );
            } );
        } );

        describe( 'getTransactions', () => {
            it( 'işlem listesini başarıyla getirir', async () => {
                const mockTransactions = [
                    { id: '1', type: 'INCOME', amount: 1000 },
                    { id: '2', type: 'EXPENSE', amount: 500 }
                ];

                FinanceService.prototype.getTransactions.mockResolvedValue( mockTransactions );

                await controller.getTransactions( req, res );

                expect( res.status ).toHaveBeenCalledWith( 200 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'İşlemler başarıyla getirildi',
                    data: mockTransactions
                } );
            } );
        } );
    } );

    describe( 'Fatura İşlemleri', () => {
        describe( 'createInvoice', () => {
            it( 'başarılı fatura oluşturma durumunu test eder', async () => {
                const mockInvoice = {
                    id: '123',
                    invoiceNumber: 'INV-001',
                    total: 1180
                };

                FinanceService.prototype.createInvoice.mockResolvedValue( mockInvoice );

                await controller.createInvoice( req, res );

                expect( res.status ).toHaveBeenCalledWith( 201 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'Fatura başarıyla oluşturuldu',
                    data: mockInvoice
                } );
            } );
        } );

        describe( 'getInvoices', () => {
            it( 'fatura listesini filtrelerle getirir', async () => {
                const mockInvoices = [
                    { id: '1', invoiceNumber: 'INV-001', total: 1180 },
                    { id: '2', invoiceNumber: 'INV-002', total: 2360 }
                ];

                req.query = {
                    page: '1',
                    limit: '10',
                    type: 'SALES',
                    startDate: '2025-01-01',
                    endDate: '2025-12-31'
                };

                FinanceService.prototype.getInvoices.mockResolvedValue( mockInvoices );

                await controller.getInvoices( req, res );

                expect( FinanceService.prototype.getInvoices ).toHaveBeenCalledWith( {
                    page: 1,
                    limit: 10,
                    type: 'SALES',
                    startDate: '2025-01-01',
                    endDate: '2025-12-31'
                } );

                expect( res.status ).toHaveBeenCalledWith( 200 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'Faturalar başarıyla getirildi',
                    data: mockInvoices
                } );
            } );
        } );
    } );

    describe( 'DIMES Entegrasyonu', () => {
        describe( 'syncWithDimes', () => {
            it( 'başarılı senkronizasyon durumunu test eder', async () => {
                const mockResult = {
                    invoices: { total: 5, success: 5, failed: 0 },
                    payments: { total: 3, success: 3, failed: 0 }
                };

                FinanceService.prototype.syncWithDimes.mockResolvedValue( mockResult );

                await controller.syncWithDimes( req, res );

                expect( res.status ).toHaveBeenCalledWith( 200 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'DIMES senkronizasyonu başarılı',
                    data: mockResult
                } );
            } );

            it( 'senkronizasyon hatası durumunu test eder', async () => {
                const error = new Error( 'DIMES bağlantı hatası' );
                FinanceService.prototype.syncWithDimes.mockRejectedValue( error );

                await controller.syncWithDimes( req, res );

                expect( res.status ).toHaveBeenCalledWith( 500 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: false,
                    message: error.message
                } );
            } );
        } );
    } );

    describe( 'Raporlama İşlemleri', () => {
        describe( 'getFinancialSummary', () => {
            it( 'finansal özeti tarih aralığına göre getirir', async () => {
                const mockSummary = {
                    income: 10000,
                    expenses: 6000,
                    balance: 4000,
                    invoices: {
                        pending: { count: 2, total: 2360 },
                        paid: { count: 5, total: 5900 }
                    },
                    payments: {
                        completed: { count: 4, total: 4720 },
                        pending: { count: 1, total: 1180 }
                    }
                };

                req.query = {
                    startDate: '2025-01-01',
                    endDate: '2025-12-31'
                };

                FinanceService.prototype.getFinancialSummary.mockResolvedValue( mockSummary );

                await controller.getFinancialSummary( req, res );

                expect( FinanceService.prototype.getFinancialSummary ).toHaveBeenCalledWith(
                    '2025-01-01',
                    '2025-12-31'
                );

                expect( res.status ).toHaveBeenCalledWith( 200 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'Finansal özet başarıyla getirildi',
                    data: mockSummary
                } );
            } );
        } );

        describe( 'getCashFlow', () => {
            it( 'nakit akışı raporunu periyoda göre getirir', async () => {
                const mockCashFlow = {
                    '2025-01': { income: 3000, expense: 2000, balance: 1000 },
                    '2025-02': { income: 4000, expense: 1500, balance: 2500 }
                };

                req.query = {
                    startDate: '2025-01-01',
                    endDate: '2025-12-31',
                    interval: 'monthly'
                };

                FinanceService.prototype.getCashFlow.mockResolvedValue( mockCashFlow );

                await controller.getCashFlow( req, res );

                expect( FinanceService.prototype.getCashFlow ).toHaveBeenCalledWith(
                    '2025-01-01',
                    '2025-12-31',
                    'monthly'
                );

                expect( res.status ).toHaveBeenCalledWith( 200 );
                expect( res.json ).toHaveBeenCalledWith( {
                    success: true,
                    message: 'Nakit akışı başarıyla getirildi',
                    data: mockCashFlow
                } );
            } );
        } );
    } );
} );