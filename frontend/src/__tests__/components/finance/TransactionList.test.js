import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionList } from '../../../components/finance/TransactionList';
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

// Mock işlemler
const mockTransactions = [
    {
        id: 1,
        reference_number: 'TRX-001',
        description: 'Gelir İşlemi 1',
        amount: 1000,
        type: 'income',
        created_at: '2025-04-01T10:00:00Z'
    },
    {
        id: 2,
        reference_number: 'TRX-002',
        description: 'Gider İşlemi 1',
        amount: 500,
        type: 'expense',
        created_at: '2025-04-02T10:00:00Z'
    },
    {
        id: 3,
        reference_number: 'TRX-003',
        description: 'Gelir İşlemi 2',
        amount: 1500,
        type: 'income',
        created_at: '2025-04-03T10:00:00Z'
    }
];

// Test wrapper bileşeni
const TestWrapper = ( { children } ) => (
    <FinanceProvider>
        {children}
    </FinanceProvider>
);

describe( 'TransactionList', () => {
    beforeEach( () => {
        jest.clearAllMocks();
        // Başarılı API yanıtını simüle et
        supabase.from().select.mockImplementation( () =>
            Promise.resolve( { data: mockTransactions, error: null } )
        );
    } );

    it( 'yükleme durumunda spinner gösterilir', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        expect( screen.getByRole( 'status' ) ).toBeInTheDocument();

        await waitFor( () => {
            expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
        } );
    } );

    it( 'işlemler başarıyla yüklendiğinde liste gösterilir', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'TRX-001' ) ).toBeInTheDocument();
            expect( screen.getByText( 'TRX-002' ) ).toBeInTheDocument();
            expect( screen.getByText( 'TRX-003' ) ).toBeInTheDocument();
        } );
    } );

    it( 'işlem türü filtresi doğru çalışır', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'TRX-001' ) ).toBeInTheDocument();
        } );

        // Gelir filtresi seç
        const typeFilter = screen.getByLabelText( 'İşlem Türü' );
        fireEvent.change( typeFilter, { target: { value: 'income' } } );

        // Sadece gelir işlemlerinin görüntülendiğini kontrol et
        expect( screen.getByText( 'TRX-001' ) ).toBeInTheDocument();
        expect( screen.getByText( 'TRX-003' ) ).toBeInTheDocument();
        expect( screen.queryByText( 'TRX-002' ) ).not.toBeInTheDocument();
    } );

    it( 'arama filtresi doğru çalışır', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'TRX-001' ) ).toBeInTheDocument();
        } );

        // Arama yap
        const searchInput = screen.getByPlaceholderText( 'İşlem ara...' );
        fireEvent.change( searchInput, { target: { value: 'Gelir İşlemi 1' } } );

        // Sadece aranan işlemin görüntülendiğini kontrol et
        expect( screen.getByText( 'TRX-001' ) ).toBeInTheDocument();
        expect( screen.queryByText( 'TRX-002' ) ).not.toBeInTheDocument();
        expect( screen.queryByText( 'TRX-003' ) ).not.toBeInTheDocument();
    } );

    it( 'sıralama doğru çalışır', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( 'TRX-001' ) ).toBeInTheDocument();
        } );

        // Tutara göre sırala
        const sortSelect = screen.getByLabelText( 'Sıralama' );
        fireEvent.change( sortSelect, { target: { value: 'amount' } } );

        // Sıralama sonrası liste sırasını kontrol et
        const transactionRefs = screen.getAllByTestId( 'transaction-ref' )
            .map( el => el.textContent );
        expect( transactionRefs ).toEqual( ['TRX-003', 'TRX-001', 'TRX-002'] );
    } );

    it( 'toplam tutarlar doğru hesaplanır', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            // Toplam gelir: 2.500 ₺ (1.000 + 1.500)
            expect( screen.getByTestId( 'total-amount' ) ).toHaveTextContent( '2.000,00 ₺' );
        } );

        // Gider filtresini seç
        const typeFilter = screen.getByLabelText( 'İşlem Türü' );
        fireEvent.change( typeFilter, { target: { value: 'expense' } } );

        // Toplam gider: 500 ₺
        expect( screen.getByTestId( 'total-amount' ) ).toHaveTextContent( '-500,00 ₺' );
    } );

    it( 'hata durumunda hata mesajı gösterilir', async () => {
        // Hata durumunu simüle et
        supabase.from().select.mockImplementation( () =>
            Promise.resolve( { data: null, error: { message: 'Test error' } } )
        );

        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            expect( screen.getByText( /Test error/i ) ).toBeInTheDocument();
        } );
    } );

    it( 'tarih formatı doğru gösterilir', async () => {
        render( <TransactionList />, { wrapper: TestWrapper } );

        await waitFor( () => {
            const dates = screen.getAllByTestId( 'transaction-date' );
            expect( dates[0] ).toHaveTextContent( '01.04.2025' );
            expect( dates[1] ).toHaveTextContent( '02.04.2025' );
            expect( dates[2] ).toHaveTextContent( '03.04.2025' );
        } );
    } );
} );