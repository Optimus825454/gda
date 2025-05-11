/**
 * LogisticsContext.js - Lojistik operasyonları için context yönetimi
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LogisticsContext = createContext();

export const useLogistics = () => {
    const context = useContext( LogisticsContext );
    if ( !context ) {
        throw new Error( 'useLogistics hook\'u LogisticsProvider içinde kullanılmalıdır' );
    }
    return context;
};

export const LogisticsProvider = ( { children } ) => {
    const [operations, setOperations] = useState( [] );
    const [shipments, setShipments] = useState( [] );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );
    const [stats, setStats] = useState( null );

    // Operasyonları yükle
    const loadOperations = async ( filters = {} ) => {
        try {
            setLoading( true );
            const response = await fetch( '/api/logistics/operations?' + new URLSearchParams( filters ) );
            if ( !response.ok ) throw new Error( 'Operasyonlar yüklenemedi' );
            const data = await response.json();
            setOperations( data );
        } catch ( err ) {
            setError( err.message );
        } finally {
            setLoading( false );
        }
    };

    // Sevkiyatları yükle
    const loadShipments = async ( filters = {} ) => {
        try {
            setLoading( true );
            const response = await fetch( '/api/logistics/shipments?' + new URLSearchParams( filters ) );
            if ( !response.ok ) throw new Error( 'Sevkiyatlar yüklenemedi' );
            const data = await response.json();
            setShipments( data );
        } catch ( err ) {
            setError( err.message );
        } finally {
            setLoading( false );
        }
    };

    // Yeni operasyon oluştur
    const createOperation = async ( operationData ) => {
        try {
            const response = await fetch( '/api/logistics/operations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( operationData )
            } );
            if ( !response.ok ) throw new Error( 'Operasyon oluşturulamadı' );
            const data = await response.json();
            setOperations( [...operations, data] );
            return data;
        } catch ( err ) {
            setError( err.message );
            throw err;
        }
    };

    // Yeni sevkiyat oluştur
    const createShipment = async ( shipmentData ) => {
        try {
            const response = await fetch( '/api/logistics/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( shipmentData )
            } );
            if ( !response.ok ) throw new Error( 'Sevkiyat oluşturulamadı' );
            const data = await response.json();
            setShipments( [...shipments, data] );
            return data;
        } catch ( err ) {
            setError( err.message );
            throw err;
        }
    };

    // Operasyon durumunu güncelle
    const updateOperationStatus = async ( id, status ) => {
        try {
            const response = await fetch( `/api/logistics/operations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( { status } )
            } );
            if ( !response.ok ) throw new Error( 'Operasyon durumu güncellenemedi' );
            const updatedOperation = await response.json();
            setOperations( operations.map( op =>
                op.id === id ? updatedOperation : op
            ) );
            return updatedOperation;
        } catch ( err ) {
            setError( err.message );
            throw err;
        }
    };

    // Sevkiyat durumunu güncelle
    const updateShipmentStatus = async ( id, status, locationUpdate = null ) => {
        try {
            const response = await fetch( `/api/logistics/shipments/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( { status, locationUpdate } )
            } );
            if ( !response.ok ) throw new Error( 'Sevkiyat durumu güncellenemedi' );
            const updatedShipment = await response.json();
            setShipments( shipments.map( ship =>
                ship.id === id ? updatedShipment : ship
            ) );
            return updatedShipment;
        } catch ( err ) {
            setError( err.message );
            throw err;
        }
    };

    // İstatistikleri yükle
    const loadStats = async () => {
        try {
            const response = await fetch( '/api/logistics/statistics' );
            if ( !response.ok ) throw new Error( 'İstatistikler yüklenemedi' );
            const data = await response.json();
            setStats( data );
        } catch ( err ) {
            setError( err.message );
        }
    };

    // Çevresel verileri güncelle
    const updateEnvironmentalData = async ( id, type, data ) => {
        try {
            const response = await fetch( `/api/logistics/${type}s/${id}/environmental`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( data )
            } );
            if ( !response.ok ) throw new Error( 'Çevresel veriler güncellenemedi' );
            const updatedData = await response.json();

            if ( type === 'operation' ) {
                setOperations( operations.map( op =>
                    op.id === id ? updatedData : op
                ) );
            } else {
                setShipments( shipments.map( ship =>
                    ship.id === id ? updatedData : ship
                ) );
            }

            return updatedData;
        } catch ( err ) {
            setError( err.message );
            throw err;
        }
    };

    // Gerçek zamanlı güncelleme için subscription
    useEffect( () => {
        const operationsSubscription = supabase
            .channel( 'logistics_operations' )
            .on( 'postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'logistics'
            }, ( payload ) => {
                switch ( payload.eventType ) {
                    case 'INSERT':
                        setOperations( prev => [...prev, payload.new] );
                        break;
                    case 'UPDATE':
                        setOperations( prev =>
                            prev.map( op => op.id === payload.new.id ? payload.new : op )
                        );
                        break;
                    case 'DELETE':
                        setOperations( prev =>
                            prev.filter( op => op.id !== payload.old.id )
                        );
                        break;
                }
            } )
            .subscribe();

        const shipmentsSubscription = supabase
            .channel( 'logistics_shipments' )
            .on( 'postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'shipments'
            }, ( payload ) => {
                switch ( payload.eventType ) {
                    case 'INSERT':
                        setShipments( prev => [...prev, payload.new] );
                        break;
                    case 'UPDATE':
                        setShipments( prev =>
                            prev.map( ship => ship.id === payload.new.id ? payload.new : ship )
                        );
                        break;
                    case 'DELETE':
                        setShipments( prev =>
                            prev.filter( ship => ship.id !== payload.old.id )
                        );
                        break;
                }
            } )
            .subscribe();

        // Initial data load
        loadOperations();
        loadShipments();
        loadStats();

        return () => {
            operationsSubscription.unsubscribe();
            shipmentsSubscription.unsubscribe();
        };
    }, [] );

    const value = {
        operations,
        shipments,
        loading,
        error,
        stats,
        createOperation,
        createShipment,
        updateOperationStatus,
        updateShipmentStatus,
        updateEnvironmentalData,
        loadOperations,
        loadShipments,
        loadStats
    };

    return (
        <LogisticsContext.Provider value={value}>
            {children}
        </LogisticsContext.Provider>
    );
};

export default LogisticsContext;