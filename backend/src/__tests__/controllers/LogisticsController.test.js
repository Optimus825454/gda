/**
 * LogisticsController.test.js - Lojistik controller test dosyası
 */

const request = require( 'supertest' );
const app = require( '../../index' );
const { supabase } = require( '../../config/supabase' );

describe( 'LogisticsController Tests', () => {
    let testOperation;
    let testShipment;

    beforeEach( async () => {
        // Test verilerini oluştur
        const operationData = {
            batch_number: 'TEST-BATCH-001',
            process_type: 'KESIM',
            start_date: new Date(),
            status: 'BEKLEMEDE'
        };

        const shipmentData = {
            shipment_number: 'TEST-SHIP-001',
            batch_numbers: ['TEST-BATCH-001'],
            vehicle_type: 'KAMYON',
            vehicle_plate: '34TEST001',
            status: 'PLANLANMIS'
        };

        // Test operasyonunu oluştur
        const { data: operation } = await supabase
            .from( 'logistics' )
            .insert( operationData )
            .select()
            .single();

        testOperation = operation;

        // Test sevkiyatını oluştur
        const { data: shipment } = await supabase
            .from( 'shipments' )
            .insert( shipmentData )
            .select()
            .single();

        testShipment = shipment;
    } );

    afterEach( async () => {
        // Test verilerini temizle
        await supabase
            .from( 'logistics' )
            .delete()
            .eq( 'batch_number', 'TEST-BATCH-001' );

        await supabase
            .from( 'shipments' )
            .delete()
            .eq( 'shipment_number', 'TEST-SHIP-001' );
    } );

    describe( 'Operasyon Testleri', () => {
        test( 'Yeni operasyon oluşturma', async () => {
            const newOperation = {
                batch_number: 'TEST-BATCH-002',
                process_type: 'KESIM',
                start_date: new Date().toISOString(),
                status: 'BEKLEMEDE'
            };

            const response = await request( app )
                .post( '/api/logistics/operations' )
                .send( newOperation );

            expect( response.status ).toBe( 201 );
            expect( response.body ).toHaveProperty( 'batch_number', newOperation.batch_number );
        } );

        test( 'Operasyon detaylarını getirme', async () => {
            const response = await request( app )
                .get( `/api/logistics/operations/${testOperation.id}` );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'id', testOperation.id );
        } );

        test( 'Operasyon durumunu güncelleme', async () => {
            const newStatus = 'ISLEMDE';
            const response = await request( app )
                .patch( `/api/logistics/operations/${testOperation.id}/status` )
                .send( { status: newStatus } );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'status', newStatus );
        } );

        test( 'Tüm operasyonları listeleme', async () => {
            const response = await request( app )
                .get( '/api/logistics/operations' );

            expect( response.status ).toBe( 200 );
            expect( Array.isArray( response.body ) ).toBeTruthy();
        } );
    } );

    describe( 'Sevkiyat Testleri', () => {
        test( 'Yeni sevkiyat oluşturma', async () => {
            const newShipment = {
                shipment_number: 'TEST-SHIP-002',
                batch_numbers: ['TEST-BATCH-001'],
                vehicle_type: 'KAMYON',
                vehicle_plate: '34TEST002',
                status: 'PLANLANMIS'
            };

            const response = await request( app )
                .post( '/api/logistics/shipments' )
                .send( newShipment );

            expect( response.status ).toBe( 201 );
            expect( response.body ).toHaveProperty( 'shipment_number', newShipment.shipment_number );
        } );

        test( 'Sevkiyat detaylarını getirme', async () => {
            const response = await request( app )
                .get( `/api/logistics/shipments/${testShipment.id}` );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'id', testShipment.id );
        } );

        test( 'Sevkiyat durumunu güncelleme', async () => {
            const newStatus = 'YUKLENIYOR';
            const response = await request( app )
                .patch( `/api/logistics/shipments/${testShipment.id}/status` )
                .send( { status: newStatus } );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'status', newStatus );
        } );

        test( 'Tüm sevkiyatları listeleme', async () => {
            const response = await request( app )
                .get( '/api/logistics/shipments' );

            expect( response.status ).toBe( 200 );
            expect( Array.isArray( response.body ) ).toBeTruthy();
        } );
    } );

    describe( 'Çevresel Veri Testleri', () => {
        test( 'Operasyon sıcaklık verisi güncelleme', async () => {
            const response = await request( app )
                .patch( `/api/logistics/operations/${testOperation.id}/environmental` )
                .send( { temperature: 2 } );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'temperature', 2 );
        } );

        test( 'Sevkiyat çevresel verilerini güncelleme', async () => {
            const response = await request( app )
                .patch( `/api/logistics/shipments/${testShipment.id}/environmental` )
                .send( {
                    temperature: 3,
                    humidity: 75
                } );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'temperature', 3 );
            expect( response.body ).toHaveProperty( 'humidity', 75 );
        } );
    } );

    describe( 'İstatistik ve Rapor Testleri', () => {
        test( 'Günlük operasyon özetini getirme', async () => {
            const response = await request( app )
                .get( '/api/logistics/daily-operations' );

            expect( response.status ).toBe( 200 );
            expect( Array.isArray( response.body ) ).toBeTruthy();
        } );

        test( 'Günlük sevkiyat özetini getirme', async () => {
            const response = await request( app )
                .get( '/api/logistics/daily-shipments' );

            expect( response.status ).toBe( 200 );
            expect( Array.isArray( response.body ) ).toBeTruthy();
        } );

        test( 'Genel istatistikleri getirme', async () => {
            const response = await request( app )
                .get( '/api/logistics/statistics' );

            expect( response.status ).toBe( 200 );
            expect( response.body ).toHaveProperty( 'operations' );
            expect( response.body ).toHaveProperty( 'shipments' );
        } );
    } );
} );