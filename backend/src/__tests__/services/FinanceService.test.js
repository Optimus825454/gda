const mongoose = require( 'mongoose' );
const FinanceService = require( '../../services/FinanceService' );
const Finance = require( '../../models/Finance' );
const Invoice = require( '../../models/Invoice' );
const Payment = require( '../../models/Payment' );
const DimesClient = require( '../../utils/dimesClient' );
const { ValidationError, NotFoundError } = require( '../../utils/errors' );

jest.mock( '../../utils/dimesClient' );
jest.mock( '../../models/Finance' );
jest.mock( '../../models/Invoice' );
jest.mock( '../../models/Payment' );

describe( 'FinanceService Tests', () => {
    let service;
    const mockId = new mongoose.Types.ObjectId();

    beforeEach( () => {
        service = new FinanceService();
        jest.clearAllMocks();
    } );

    describe( 'Genel Finans İşlemleri', () => {
        describe( 'createTransaction', () => {
            const mockTransactionData = {
                type: 'INCOME',
                amount: 1000,
                currency: 'TRY',
                category: 'SALES'
            };

            it( 'geçerli veri ile işlem oluşturur', async () => {
                const mockTransaction = {
                    ...mockTransactionData,
                    save: jest.fn().mockResolvedValue( { id: mockId, ...mockTransactionData } ),
                    validate: jest.fn().mockResolvedValue( true )
                };

                Finance.mockImplementation( () => mockTransaction );

                const result = await service.createTransaction( mockTransactionData );

                expect( Finance ).toHaveBeenCalledWith( mockTransactionData );
                expect( mockTransaction.validate ).toHaveBeenCalled();
                expect( mockTransaction.save ).toHaveBeenCalled();
                expect( result ).toHaveProperty( 'id', mockId );
            } );

            it( 'geçersiz veri ile hata fırlatır', async () => {
                const mockTransaction = {
                    ...mockTransactionData,
                    validate: jest.fn().mockRejectedValue( new Error( 'Validation failed' ) )
                };

                Finance.mockImplementation( () => mockTransaction );

                await expect( service.createTransaction( mockTransactionData ) )
                    .rejects
                    .toThrow( 'İşlem oluşturma hatası: Validation failed' );
            } );
        } );

        describe( 'getTransactions', () => {
            const mockFilters = {
                page: 1,
                limit: 10,
                type: 'INCOME',
                startDate: '2025-01-01',
                endDate: '2025-12-31'
            };

            it( 'filtrelere göre işlemleri getirir', async () => {
                const mockTransactions = [
                    { id: '1', type: 'INCOME', amount: 1000 },
                    { id: '2', type: 'INCOME', amount: 2000 }
                ];

                Finance.find.mockReturnThis();
                Finance.sort.mockReturnThis();
                Finance.skip.mockReturnThis();
                Finance.limit.mockReturnThis();
                Finance.exec.mockResolvedValue( mockTransactions );

                const result = await service.getTransactions( mockFilters );

                expect( Finance.find ).toHaveBeenCalledWith( {
                    type: 'INCOME',
                    date: {
                        $gte: expect.any( Date ),
                        $lte: expect.any( Date )
                    }
                } );
                expect( result ).toEqual( mockTransactions );
            } );
        } );
    } );

    describe( 'Fatura İşlemleri', () => {
        const mockInvoiceData = {
            invoiceNumber: 'INV-001',
            type: 'SALES',
            date: new Date(),
            dueDate: new Date(),
            supplier: {
                name: 'Test Supplier',
                taxNumber: '1234567890'
            },
            items: [{
                description: 'Test Item',
                quantity: 1,
                unitPrice: 1000,
                taxRate: 18
            }]
        };

        describe( 'createInvoice', () => {
            it( 'faturayı oluşturur ve DIMES ile senkronize eder', async () => {
                const mockInvoice = {
                    ...mockInvoiceData,
                    save: jest.fn().mockResolvedValue( { id: mockId, ...mockInvoiceData } ),
                    validate: jest.fn().mockResolvedValue( true )
                };

                Invoice.mockImplementation( () => mockInvoice );
                process.env.DIMES_AUTO_SYNC = 'true';

                const mockDimesResponse = { id: 'DIMES-001', status: 'SUCCESS' };
                DimesClient.prototype.sendInvoice.mockResolvedValue( mockDimesResponse );

                const result = await service.createInvoice( mockInvoiceData );

                expect( Invoice ).toHaveBeenCalledWith( mockInvoiceData );
                expect( mockInvoice.validate ).toHaveBeenCalled();
                expect( mockInvoice.save ).toHaveBeenCalled();
                expect( DimesClient.prototype.sendInvoice ).toHaveBeenCalled();
                expect( result ).toHaveProperty( 'id', mockId );
            } );
        } );
    } );

    describe( 'DIMES Entegrasyonu', () => {
        describe( 'syncWithDimes', () => {
            it( 'bekleyen tüm işlemleri senkronize eder', async () => {
                const mockPendingInvoices = [
                    { id: '1', save: jest.fn() },
                    { id: '2', save: jest.fn() }
                ];

                const mockPendingPayments = [
                    { id: '3', save: jest.fn() },
                    { id: '4', save: jest.fn() }
                ];

                Invoice.find.mockResolvedValue( mockPendingInvoices );
                Payment.find.mockResolvedValue( mockPendingPayments );

                DimesClient.prototype.sendInvoice.mockResolvedValue( { status: 'SUCCESS' } );
                DimesClient.prototype.sendPayment.mockResolvedValue( { status: 'SUCCESS' } );

                const result = await service.syncWithDimes();

                expect( result ).toEqual( {
                    invoices: { total: 2, success: 2, failed: 0 },
                    payments: { total: 2, success: 2, failed: 0 }
                } );
            } );

            it( 'senkronizasyon hatalarını yakalar ve kaydeder', async () => {
                const mockInvoice = {
                    id: '1',
                    dimesIntegration: { errors: [] },
                    save: jest.fn()
                };

                Invoice.find.mockResolvedValue( [mockInvoice] );
                Payment.find.mockResolvedValue( [] );

                const error = new Error( 'DIMES connection failed' );
                DimesClient.prototype.sendInvoice.mockRejectedValue( error );

                const result = await service.syncWithDimes();

                expect( result.invoices.failed ).toBe( 1 );
                expect( mockInvoice.dimesIntegration.errors ).toHaveLength( 1 );
                expect( mockInvoice.save ).toHaveBeenCalled();
            } );
        } );
    } );

    describe( 'Raporlama İşlemleri', () => {
        describe( 'getFinancialSummary', () => {
            it( 'finansal özeti hesaplar', async () => {
                const mockAggregateResults = {
                    income: [{ _id: null, total: 10000 }],
                    expenses: [{ _id: null, total: 6000 }],
                    invoices: [
                        { _id: 'PENDING', count: 2, total: 2360 },
                        { _id: 'PAID', count: 5, total: 5900 }
                    ],
                    payments: [
                        { _id: 'COMPLETED', count: 4, total: 4720 },
                        { _id: 'PENDING', count: 1, total: 1180 }
                    ]
                };

                Finance.aggregate
                    .mockResolvedValueOnce( mockAggregateResults.income )
                    .mockResolvedValueOnce( mockAggregateResults.expenses );

                Invoice.aggregate.mockResolvedValue( mockAggregateResults.invoices );
                Payment.aggregate.mockResolvedValue( mockAggregateResults.payments );

                const result = await service.getFinancialSummary( '2025-01-01', '2025-12-31' );

                expect( result ).toEqual( {
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
                } );
            } );
        } );

        describe( 'getCashFlow', () => {
            it( 'periyodik nakit akışını hesaplar', async () => {
                const mockAggregateResults = [
                    { _id: { period: '2025-01', type: 'INCOME' }, total: 3000 },
                    { _id: { period: '2025-01', type: 'EXPENSE' }, total: 2000 },
                    { _id: { period: '2025-02', type: 'INCOME' }, total: 4000 },
                    { _id: { period: '2025-02', type: 'EXPENSE' }, total: 1500 }
                ];

                Finance.aggregate.mockResolvedValue( mockAggregateResults );

                const result = await service.getCashFlow( '2025-01-01', '2025-12-31', 'monthly' );

                expect( result ).toEqual( {
                    '2025-01': { income: 3000, expense: 2000, balance: 1000 },
                    '2025-02': { income: 4000, expense: 1500, balance: 2500 }
                } );
            } );
        } );
    } );
} );