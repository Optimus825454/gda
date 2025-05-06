import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { FinanceProvider, useFinanceContext } from '../../contexts/FinanceContext';
import { supabase } from '../../supabaseClient';

// Supabase mock
jest.mock( '../../supabaseClient', () => ( {
    supabase: {
        from: jest.fn( () => ( {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis()
        } ) )
    }
} ) );

// Test bileşeni
const TestComponent = () => {
    const context = useFinanceContext();
    return (
        <div>
            <span data-testid="loading">{context.loading.toString()}</span>
            <span data-testid="error">{context.error || 'no-error'}</span>
            <span data-testid="transactions-length">
                {context.transactions ? context.transactions.length : 0}
            </span>
            <button onClick={context.fetchTransactions}>Fetch Transactions</button>
            <button onClick={context.fetchInvoices}>Fetch Invoices</button>
        </div>
    );
};

describe( 'FinanceContext', () => {
    beforeEach( () => {
        jest.clearAllMocks();
    } );

    it( 'sağlayıcı başlangıç durumunu doğru şekilde ayarlar', () => {
        const { getByTestId } = render(
            <FinanceProvider>
                <TestComponent />
            </FinanceProvider>
        );

        expect( getByTestId( 'loading' ) ).toHaveTextContent( 'false' );
        expect( getByTestId( 'error' ) ).toHaveTextContent( 'no-error' );
        expect( getByTestId( 'transactions-length' ) ).toHaveTextContent( '0' );
    } );

    it( 'işlemler başarıyla yüklendiğinde state güncellenir', async () => {
        const mockData = {
            data: [
                { id: 1, amount: 100, type: 'income' },
                { id: 2, amount: 50, type: 'expense' }
            ],
            error: null
        };

        supabase.from().select.mockImplementation( () => Promise.resolve( mockData ) );

        const { getByTestId, getByText } = render(
            <FinanceProvider>
                <TestComponent />
            </FinanceProvider>
        );

        // İşlemleri yükle
        await act( async () => {
            getByText( 'Fetch Transactions' ).click();
        } );

        await waitFor( () => {
            expect( getByTestId( 'transactions-length' ) ).toHaveTextContent( '2' );
            expect( getByTestId( 'loading' ) ).toHaveTextContent( 'false' );
            expect( getByTestId( 'error' ) ).toHaveTextContent( 'no-error' );
        } );
    } );

    it( 'hata durumunda error state güncellenir', async () => {
        const mockError = {
            data: null,
            error: { message: 'Test error' }
        };

        supabase.from().select.mockImplementation( () => Promise.resolve( mockError ) );

        const { getByTestId, getByText } = render(
            <FinanceProvider>
                <TestComponent />
            </FinanceProvider>
        );

        // İşlemleri yüklemeyi dene
        await act( async () => {
            getByText( 'Fetch Transactions' ).click();
        } );

        await waitFor( () => {
            expect( getByTestId( 'error' ) ).toHaveTextContent( 'Test error' );
            expect( getByTestId( 'loading' ) ).toHaveTextContent( 'false' );
        } );
    } );

    it( 'yükleme durumu doğru şekilde yönetilir', async () => {
        const mockData = { data: [], error: null };
        let resolvePromise;

        supabase.from().select.mockImplementation( () => new Promise( resolve => {
            resolvePromise = () => resolve( mockData );
        } ) );

        const { getByTestId, getByText } = render(
            <FinanceProvider>
                <TestComponent />
            </FinanceProvider>
        );

        // İşlemleri yüklemeye başla
        act( () => {
            getByText( 'Fetch Transactions' ).click();
        } );

        // Yükleme durumunu kontrol et
        expect( getByTestId( 'loading' ) ).toHaveTextContent( 'true' );

        // İşlemi tamamla
        await act( async () => {
            resolvePromise();
        } );

        // Yüklemenin tamamlandığını kontrol et
        await waitFor( () => {
            expect( getByTestId( 'loading' ) ).toHaveTextContent( 'false' );
        } );
    } );
} );