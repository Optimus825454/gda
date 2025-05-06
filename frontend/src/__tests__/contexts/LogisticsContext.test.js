/**
 * LogisticsContext.test.js - Lojistik context test dosyası
 */

import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { LogisticsProvider, useLogistics } from '../../contexts/LogisticsContext';
import { supabase } from '../../supabaseClient';

// Mock supabase
jest.mock( '../../supabaseClient', () => ( {
    supabase: {
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn()
    }
} ) );

// Mock fetch API
global.fetch = jest.fn();

// Test component
const TestComponent = () => {
    const {
        operations,
        shipments,
        loading,
        error,
        createOperation,
        createShipment
    } = useLogistics();

    return (
        <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="error">{error || 'no error'}</div>
            <div data-testid="operations-count">{operations.length}</div>
            <div data-testid="shipments-count">{shipments.length}</div>
            <button
                data-testid="create-operation"
                onClick={() => createOperation( {
                    batchNumber: 'TEST-001',
                    processType: 'KESIM'
                } )}
            >
                Operasyon Oluştur
            </button>
            <button
                data-testid="create-shipment"
                onClick={() => createShipment( {
                    shipmentNumber: 'SHIP-001',
                    batchNumbers: ['TEST-001']
                } )}
            >
                Sevkiyat Oluştur
            </button>
        </div>
    );
};

describe( 'LogisticsContext Tests', () => {
    beforeEach( () => {
        global.fetch.mockClear();
    } );

    test( 'Provider başlangıç durumu doğru olmalı', () => {
        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        expect( screen.getByTestId( 'loading' ).textContent ).toBe( 'true' );
        expect( screen.getByTestId( 'error' ).textContent ).toBe( 'no error' );
        expect( screen.getByTestId( 'operations-count' ).textContent ).toBe( '0' );
        expect( screen.getByTestId( 'shipments-count' ).textContent ).toBe( '0' );
    } );

    test( 'Operasyonları başarıyla yüklemeli', async () => {
        const mockOperations = [
            { id: 1, batchNumber: 'TEST-001', processType: 'KESIM' },
            { id: 2, batchNumber: 'TEST-002', processType: 'PARCALAMA' }
        ];

        global.fetch.mockImplementationOnce( () =>
            Promise.resolve( {
                ok: true,
                json: () => Promise.resolve( mockOperations )
            } )
        );

        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        await waitFor( () => {
            expect( screen.getByTestId( 'loading' ).textContent ).toBe( 'false' );
            expect( screen.getByTestId( 'operations-count' ).textContent ).toBe( '2' );
        } );
    } );

    test( 'Sevkiyatları başarıyla yüklemeli', async () => {
        const mockShipments = [
            { id: 1, shipmentNumber: 'SHIP-001', status: 'PLANLANMIS' },
            { id: 2, shipmentNumber: 'SHIP-002', status: 'YOLDA' }
        ];

        global.fetch.mockImplementationOnce( () =>
            Promise.resolve( {
                ok: true,
                json: () => Promise.resolve( mockShipments )
            } )
        );

        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        await waitFor( () => {
            expect( screen.getByTestId( 'loading' ).textContent ).toBe( 'false' );
            expect( screen.getByTestId( 'shipments-count' ).textContent ).toBe( '2' );
        } );
    } );

    test( 'Yeni operasyon oluşturabilmeli', async () => {
        const mockNewOperation = {
            id: 3,
            batchNumber: 'TEST-001',
            processType: 'KESIM'
        };

        global.fetch.mockImplementationOnce( () =>
            Promise.resolve( {
                ok: true,
                json: () => Promise.resolve( mockNewOperation )
            } )
        );

        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        await act( async () => {
            screen.getByTestId( 'create-operation' ).click();
        } );

        await waitFor( () => {
            expect( global.fetch ).toHaveBeenCalledWith(
                '/api/logistics/operations',
                expect.objectContaining( {
                    method: 'POST',
                    body: expect.stringContaining( 'TEST-001' )
                } )
            );
        } );
    } );

    test( 'Yeni sevkiyat oluşturabilmeli', async () => {
        const mockNewShipment = {
            id: 3,
            shipmentNumber: 'SHIP-001',
            status: 'PLANLANMIS'
        };

        global.fetch.mockImplementationOnce( () =>
            Promise.resolve( {
                ok: true,
                json: () => Promise.resolve( mockNewShipment )
            } )
        );

        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        await act( async () => {
            screen.getByTestId( 'create-shipment' ).click();
        } );

        await waitFor( () => {
            expect( global.fetch ).toHaveBeenCalledWith(
                '/api/logistics/shipments',
                expect.objectContaining( {
                    method: 'POST',
                    body: expect.stringContaining( 'SHIP-001' )
                } )
            );
        } );
    } );

    test( 'API hatalarını doğru şekilde yönetmeli', async () => {
        global.fetch.mockImplementationOnce( () =>
            Promise.resolve( {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            } )
        );

        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        await waitFor( () => {
            expect( screen.getByTestId( 'error' ).textContent ).not.toBe( 'no error' );
            expect( screen.getByTestId( 'loading' ).textContent ).toBe( 'false' );
        } );
    } );

    test( 'Realtime güncellemeleri doğru şekilde işlemeli', () => {
        render(
            <LogisticsProvider>
                <TestComponent />
            </LogisticsProvider>
        );

        expect( supabase.channel ).toHaveBeenCalledWith( 'logistics_operations' );
        expect( supabase.channel ).toHaveBeenCalledWith( 'logistics_shipments' );
        expect( supabase.subscribe ).toHaveBeenCalled();
    } );
} );