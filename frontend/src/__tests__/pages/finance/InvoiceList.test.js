import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvoiceList } from '../../../pages/finance/InvoiceList';
import { FinanceProvider } from '../../../contexts/FinanceContext';
import { supabase } from '../../../supabaseClient';

// Supabase mock
jest.mock( '../../../supabaseClient', () => ( {
    supabase: {
        from: jest.fn( () => ( {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis()
        } ) )
    }
} ) );

// Mock faturaları
const mockInvoices = [
    {
        id: 1,
        invoice_number: 'INV-001',
        amount: 1000,
        due_date: '2025-05-01',
        status: 'pending',
        customer_name: 'Test Müşteri 1',
        created_at: '2025-04-01'
    },
    {
        id: 2,
        invoice_number: 'INV-002',
        amount: 2000,
        due_date: '2025-05-15',
        status: 'paid',
        customer_name: 'Test Müşteri 2',
        created_at: '2025-04-15'
    }
];

// Test wrapper bileşeni
const TestWrapper = ( { children } ) => (
    <FinanceProvider>
        {children}
    </FinanceProvider>
);

describe( 'InvoiceList', () => {
    beforeEach( () => {
        jest.clearAllMocks();
        // Başarılı API yanıtını simüle et
        supabase.from().select.mockImplementation( () =>
            Promise.resolve( { data: mockInvoices, error: null } )
        );
    } );

    it( 'yükleme durumunda spinner gösterilir', async () => {
        render( <InvoiceList />, { wrapper: TestWrapper } );

        expect( screen.getByRole( 'status' ) ).toBeInTheDocument();

        await waitFor( () => {
            expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
        } );
    } );

    it( 'faturalar başarıyla yüklendiğinde liste gösterilir', async () => {
        render( <InvoiceList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'INV-001' ) ).toBeInTheDocument();
            expect( screen.getByText( 'INV-002' ) ).toBeInTheDocument();
            expect( screen.getByText( 'Test Müşteri 1' ) ).toBeInTheDocument();
            expect( screen.getByText( 'Test Müşteri 2' ) ).toBeInTheDocument();
        } );
    } );

    it( 'arama filtresi doğru çalışır', async () => {
        render( <InvoiceList />, { wrapper: TestWrapper } );

        // Faturaların yüklenmesini bekle
        await waitFor( () => {
            expect( screen.getByText( 'INV-001' ) ).toBeInTheDocument();
        } );

        // Arama yap
        const searchInput = screen.getByPlaceholderText( 'Fatura ara...' );
        fireEvent.change( searchInput, { target: { value: 'INV-001' } } );

        // Sadece aranan faturanın görüntülendiğini kontrol et
        expect( screen.getByText( 'INV-001' ) ).toBeInTheDocument();
        expect( screen.queryByText( 'INV-002' ) ).not.toBeInTheDocument();
    } );

    it( 'durum filtresi doğru çalışır', async () => {
        render( <InvoiceList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'INV-001' ) ).toBeInTheDocument();
        } );

        // Durum filtresini değiştir
        const statusFilter = screen.getByLabelText( 'Durum Filtresi' );
        fireEvent.change( statusFilter, { target: { value: 'paid' } } );

        // Sadece ödenmiş faturaların görüntülendiğini kontrol et
        expect( screen.queryByText( 'INV-001' ) ).not.toBeInTheDocument();
        expect( screen.getByText( 'INV-002' ) ).toBeInTheDocument();
    } );

    it( 'sıralama doğru çalışır', async () => {
        render( <InvoiceList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'INV-001' ) ).toBeInTheDocument();
        } );

        // Tutara göre sırala
        const sortSelect = screen.getByLabelText( 'Sıralama' );
        fireEvent.change( sortSelect, { target: { value: 'amount' } } );

        // Sıralama sonrası liste sırasını kontrol et
        const invoiceNumbers = screen.getAllByTestId( 'invoice-number' )
            .map( el => el.textContent );
        expect( invoiceNumbers ).toEqual( ['INV-002', 'INV-001'] );
    } );

    it( 'hata durumunda hata mesajı gösterilir', async () => {
        // Hata durumunu simüle et
        supabase.from().select.mockImplementation( () =>
            Promise.resolve( { data: null, error: { message: 'Test error' } } )
        );

        render( <InvoiceList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( /Test error/i ) ).toBeInTheDocument();
        } );
    } );

    it( '"Yeni Fatura" butonu doğru çalışır', async () => {
        const mockOnNewInvoice = jest.fn();
        render( <InvoiceList onNewInvoice={mockOnNewInvoice} />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'Yeni Fatura' ) ).toBeInTheDocument();
        } );

        fireEvent.click( screen.getByText( 'Yeni Fatura' ) );
        expect( mockOnNewInvoice ).toHaveBeenCalled();
    } );

    it( 'fatura detayları görüntülenebilir', async () => {
        render( <InvoiceList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getAllByText( 'Görüntüle' )[0] ).toBeInTheDocument();
        } );

        const viewButtons = screen.getAllByText( 'Görüntüle' );
        fireEvent.click( viewButtons[0] );

        // Modal'ın açıldığını kontrol et
        expect( screen.getByText( /Fatura Detayları/i ) ).toBeInTheDocument();
        expect( screen.getByText( 'Test Müşteri 1' ) ).toBeInTheDocument();
        expect( screen.getByText( '1.000,00 ₺' ) ).toBeInTheDocument();
    } );
} );