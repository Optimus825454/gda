import { createContext, useContext, useState, useReducer } from 'react';
import { supabase } from '../supabaseClient';

const FinanceContext = createContext();

const initialState = {
    transactions: [],
    invoices: [],
    payments: [],
    loading: false,
    error: null,
    stats: {
        totalRevenue: 0,
        totalExpenses: 0,
        pendingInvoices: 0,
        overduePayments: 0
    }
};

function financeReducer( state, action ) {
    switch ( action.type ) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };
        case 'SET_INVOICES':
            return { ...state, invoices: action.payload };
        case 'SET_PAYMENTS':
            return { ...state, payments: action.payload };
        case 'UPDATE_STATS':
            return { ...state, stats: action.payload };
        default:
            return state;
    }
}

export function FinanceProvider( { children } ) {
    const [state, dispatch] = useReducer( financeReducer, initialState );

    // API Fonksiyonları
    const fetchTransactions = async () => {
        try {
            dispatch( { type: 'SET_LOADING', payload: true } );
            const { data, error } = await supabase
                .from( 'transactions' )
                .select( '*' )
                .order( 'created_at', { ascending: false } );

            if ( error ) throw error;
            dispatch( { type: 'SET_TRANSACTIONS', payload: data } );
        } catch ( error ) {
            dispatch( { type: 'SET_ERROR', payload: error.message } );
        } finally {
            dispatch( { type: 'SET_LOADING', payload: false } );
        }
    };

    const fetchInvoices = async () => {
        try {
            dispatch( { type: 'SET_LOADING', payload: true } );
            const { data, error } = await supabase
                .from( 'invoices' )
                .select( '*' )
                .order( 'due_date', { ascending: true } );

            if ( error ) throw error;
            dispatch( { type: 'SET_INVOICES', payload: data } );
        } catch ( error ) {
            dispatch( { type: 'SET_ERROR', payload: error.message } );
        } finally {
            dispatch( { type: 'SET_LOADING', payload: false } );
        }
    };

    const createInvoice = async ( invoiceData ) => {
        try {
            dispatch( { type: 'SET_LOADING', payload: true } );
            const { data, error } = await supabase
                .from( 'invoices' )
                .insert( [invoiceData] )
                .select();

            if ( error ) throw error;
            await fetchInvoices();
            return data[0];
        } catch ( error ) {
            dispatch( { type: 'SET_ERROR', payload: error.message } );
            throw error;
        } finally {
            dispatch( { type: 'SET_LOADING', payload: false } );
        }
    };

    const updatePaymentStatus = async ( paymentId, status ) => {
        try {
            dispatch( { type: 'SET_LOADING', payload: true } );
            const { error } = await supabase
                .from( 'payments' )
                .update( { status } )
                .eq( 'id', paymentId );

            if ( error ) throw error;
            await fetchTransactions();
        } catch ( error ) {
            dispatch( { type: 'SET_ERROR', payload: error.message } );
            throw error;
        } finally {
            dispatch( { type: 'SET_LOADING', payload: false } );
        }
    };

    const value = {
        ...state,
        fetchTransactions,
        fetchInvoices,
        createInvoice,
        updatePaymentStatus
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export const useFinanceContext = () => {
    const context = useContext( FinanceContext );
    if ( !context ) {
        throw new Error( 'useFinanceContext must be used within a FinanceProvider' );
    }
    return context;
};