import { useCallback, useMemo } from 'react';
import { useFinanceContext } from '../contexts/FinanceContext';

export const useFinance = () => {
    const {
        transactions,
        invoices,
        payments,
        loading,
        error,
        stats,
        fetchTransactions,
        fetchInvoices,
        createInvoice,
        updatePaymentStatus
    } = useFinanceContext();

    // İstatistikleri hesapla
    const calculateStats = useCallback( () => {
        const totalRevenue = transactions
            .filter( t => t.type === 'income' )
            .reduce( ( sum, t ) => sum + t.amount, 0 );

        const totalExpenses = transactions
            .filter( t => t.type === 'expense' )
            .reduce( ( sum, t ) => sum + t.amount, 0 );

        const pendingInvoices = invoices
            .filter( i => i.status === 'pending' )
            .length;

        const overduePayments = payments
            .filter( p => new Date( p.due_date ) < new Date() && p.status === 'pending' )
            .length;

        return {
            totalRevenue,
            totalExpenses,
            pendingInvoices,
            overduePayments,
            netIncome: totalRevenue - totalExpenses
        };
    }, [transactions, invoices, payments] );

    // Fatura durumunu kontrol et
    const checkInvoiceStatus = useCallback( ( invoice ) => {
        const now = new Date();
        const dueDate = new Date( invoice.due_date );

        if ( invoice.status === 'paid' ) return 'paid';
        if ( dueDate < now ) return 'overdue';
        if ( dueDate > now ) return 'pending';
        return 'due-today';
    }, [] );

    // Faturaları filtrele ve sırala
    const getFilteredInvoices = useCallback( ( status = 'all', sortBy = 'date' ) => {
        let filtered = [...invoices];

        if ( status !== 'all' ) {
            filtered = filtered.filter( inv => checkInvoiceStatus( inv ) === status );
        }

        return filtered.sort( ( a, b ) => {
            if ( sortBy === 'date' ) {
                return new Date( b.created_at ) - new Date( a.created_at );
            }
            if ( sortBy === 'amount' ) {
                return b.amount - a.amount;
            }
            return 0;
        } );
    }, [invoices, checkInvoiceStatus] );

    // Ödeme takibi için özet
    const getPaymentSummary = useCallback( () => {
        return payments.reduce( ( summary, payment ) => {
            summary[payment.status] = ( summary[payment.status] || 0 ) + 1;
            return summary;
        }, {} );
    }, [payments] );

    const memorizedStats = useMemo( () => calculateStats(), [calculateStats] );

    return {
        // Context state ve fonksiyonları
        transactions,
        invoices,
        payments,
        loading,
        error,
        stats: memorizedStats,

        // Context fonksiyonları
        fetchTransactions,
        fetchInvoices,
        createInvoice,
        updatePaymentStatus,

        // Yardımcı fonksiyonlar
        checkInvoiceStatus,
        getFilteredInvoices,
        getPaymentSummary,

        // Hesaplanmış değerler
        calculatedStats: memorizedStats
    };
};