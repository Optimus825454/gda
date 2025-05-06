/**
 * LogisticsService.test.js - Lojistik servisi test dosyası
 */

const LogisticsService = require( '../../services/LogisticsService' );
const Logistics = require( '../../models/Logistics' );
const Shipment = require( '../../models/Shipment' );
const { supabase } = require( '../../config/supabase' );

jest.mock( '../../models/Logistics' );
jest.mock( '../../models/Shipment' );
jest.mock( '../../config/supabase' );

describe( 'LogisticsService Tests', () => {
    let mockOperation;
    let mockShipment;

    beforeEach( () => {
        mockOperation = {
            id: 'test-op-1',
            batchNumber: 'TEST-BATCH-001',
            processType: 'KESIM',
            status: 'BEKLEMEDE',
            temperature: 2,
            save: jest.fn()
        };

        mockShipment = {
            id: 'test-ship-1',
            shipmentNumber: 'TEST-SHIP-001',
            batchNumbers: ['TEST-BATCH-001'],
            status: 'PLANLANMIS',
            temperature: 3,
            humidity: 75,
            save: jest.fn()
        };

        // Mock implementations temizle
        jest.clearAllMocks();
    } );

    describe( 'Operasyon Yönetimi', () => {
        test( 'Yeni operasyon başlatma', async () => {
            const operationData = {
                batchNumber: 'TEST-BATCH-001',
                processType: 'KESIM'
            };

            Logistics.mockImplementation( () => mockOperation );
            mockOperation.save.mockResolvedValue( mockOperation );

            const result = await LogisticsService.startOperation( operationData );

            expect( result ).toBeDefined();
            expect( result.batchNumber ).toBe( operationData.batchNumber );
            expect( mockOperation.save ).toHaveBeenCalled();
        } );

        test( 'Operasyon validasyonu', async () => {
            const invalidOperation = {
                ...mockOperation,
                batchNumber: '', // Geçersiz parti numarası
                validate: () => ( { valid: false, errors: ['Parti numarası zorunludur'] } )
            };

            await expect( LogisticsService.validateOperation( invalidOperation ) )
                .rejects
                .toThrow( 'Parti numarası zorunludur' );
        } );

        test( 'Operasyon durumu güncelleme', async () => {
            const newStatus = 'ISLEMDE';
            Logistics.findById = jest.fn().mockResolvedValue( mockOperation );
            mockOperation.updateStatus = jest.fn().mockResolvedValue( {
                ...mockOperation,
                status: newStatus
            } );

            const result = await LogisticsService.updateOperationStatus( 'test-op-1', newStatus );

            expect( result.status ).toBe( newStatus );
            expect( mockOperation.updateStatus ).toHaveBeenCalledWith( newStatus );
        } );
    } );

    describe( 'Sevkiyat Yönetimi', () => {
        test( 'Yeni sevkiyat planlama', async () => {
            const shipmentData = {
                shipmentNumber: 'TEST-SHIP-001',
                batchNumbers: ['TEST-BATCH-001']
            };

            Shipment.mockImplementation( () => mockShipment );
            mockShipment.save.mockResolvedValue( mockShipment );

            const result = await LogisticsService.planShipment( shipmentData );

            expect( result ).toBeDefined();
            expect( result.shipmentNumber ).toBe( shipmentData.shipmentNumber );
            expect( mockShipment.save ).toHaveBeenCalled();
        } );

        test( 'Sevkiyat validasyonu', async () => {
            const invalidShipment = {
                ...mockShipment,
                shipmentNumber: '', // Geçersiz sevkiyat numarası
                validate: () => ( { valid: false, errors: ['Sevkiyat numarası zorunludur'] } )
            };

            await expect( LogisticsService.validateShipment( invalidShipment ) )
                .rejects
                .toThrow( 'Sevkiyat numarası zorunludur' );
        } );

        test( 'Sevkiyat durumu güncelleme', async () => {
            const newStatus = 'YUKLENIYOR';
            Shipment.findById = jest.fn().mockResolvedValue( mockShipment );
            mockShipment.updateStatus = jest.fn().mockResolvedValue( {
                ...mockShipment,
                status: newStatus
            } );

            const result = await LogisticsService.updateShipmentStatus( 'test-ship-1', newStatus );

            expect( result.status ).toBe( newStatus );
            expect( mockShipment.updateStatus ).toHaveBeenCalledWith( newStatus );
        } );
    } );

    describe( 'Çevresel Veri Yönetimi', () => {
        test( 'Operasyon sıcaklık kontrolü', async () => {
            Logistics.findById = jest.fn().mockResolvedValue( mockOperation );
            mockOperation.updateTemperature = jest.fn().mockResolvedValue( {
                ...mockOperation,
                temperature: 4
            } );

            const result = await LogisticsService.updateOperationStatus( 'test-op-1', 'ISLEMDE' );
            expect( result ).toBeDefined();
        } );

        test( 'Sevkiyat çevresel veri kontrolü', async () => {
            const newTemp = 3;
            const newHumidity = 75;

            Shipment.findById = jest.fn().mockResolvedValue( mockShipment );
            mockShipment.updateEnvironmentalData = jest.fn().mockResolvedValue( {
                ...mockShipment,
                temperature: newTemp,
                humidity: newHumidity
            } );

            const result = await mockShipment.updateEnvironmentalData( newTemp, newHumidity );

            expect( result.temperature ).toBe( newTemp );
            expect( result.humidity ).toBe( newHumidity );
        } );
    } );

    describe( 'Raporlama ve İstatistik', () => {
        test( 'Günlük operasyon planlaması', async () => {
            const mockOperations = [mockOperation];
            Logistics.getDailyOperations = jest.fn().mockResolvedValue( mockOperations );

            const result = await LogisticsService.planDailyOperations( new Date() );
            expect( Array.isArray( result ) ).toBeTruthy();
            expect( result ).toHaveLength( 1 );
        } );

        test( 'Operasyon optimizasyonu', () => {
            const operations = [
                { ...mockOperation, priority: 1 },
                { ...mockOperation, priority: 3 },
                { ...mockOperation, priority: 2 }
            ];

            const result = LogisticsService.optimizeOperations( operations );
            expect( result[0].priority ).toBe( 3 );
            expect( result[2].priority ).toBe( 1 );
        } );

        test( 'Lojistik durum raporu', async () => {
            const mockActiveOperations = [mockOperation];
            const mockActiveShipments = [mockShipment];

            Logistics.findAll = jest.fn().mockResolvedValue( mockActiveOperations );
            Shipment.findAll = jest.fn().mockResolvedValue( mockActiveShipments );

            const result = await LogisticsService.getLogisticsStatus();

            expect( result ).toHaveProperty( 'activeOperations' );
            expect( result ).toHaveProperty( 'activeShipments' );
            expect( result ).toHaveProperty( 'summary' );
        } );

        test( 'Durum özeti oluşturma', async () => {
            const operations = [mockOperation];
            const shipments = [mockShipment];

            const result = await LogisticsService.generateStatusSummary( operations, shipments );

            expect( result ).toHaveProperty( 'totalActiveOperations', 1 );
            expect( result ).toHaveProperty( 'totalActiveShipments', 1 );
            expect( result ).toHaveProperty( 'operationsByType' );
            expect( result ).toHaveProperty( 'shipmentsByStatus' );
        } );
    } );
} );