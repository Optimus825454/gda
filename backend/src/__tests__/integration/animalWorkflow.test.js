const request = require( 'supertest' );
const app = require( '../../index' );
const { supabase } = require( '../../config/supabase' );

describe( 'Hayvan İş Akışı Entegrasyon Testleri', () => {
    beforeEach( () => {
        jest.clearAllMocks();
    } );

    test( 'Tam iş akışı testi: Hayvan Ekleme -> Test -> Satış', async () => {
        // Yeni hayvan ekleme
        const newAnimal = {
            type: 'DUVE',
            birthDate: '2023-01-01',
            gender: 'F',
            breed: 'Holstein',
            weight: 450,
            price: 12000,
            pregnancyStatus: 'pregnant'
        };

        supabase.mockSingleResponse( {
            id: 'test-animal-1',
            ...newAnimal,
            category: 'GEBE_DUVE',
            status: 'active',
            healthStatus: 'healthy',
            saleStatus: 'BEKLEMEDE'
        } );

        const createResponse = await request( app )
            .post( '/api/animals' )
            .send( newAnimal )
            .expect( 201 );

        const testAnimalId = createResponse.body.id;

        // Test sonucu ekleme
        const testData = {
            testType: 'BRUSELLA',
            testResult: 'NEGATIF',
            performedBy: 'Dr. Ahmet'
        };

        supabase.mockSingleResponse( {
            id: testAnimalId,
            testResult: 'NEGATIF',
            destinationCompany: 'GULVET',
            saleStatus: 'SATISA_HAZIR'
        } );

        await request( app )
            .post( `/api/animals/${testAnimalId}/test-result` )
            .send( testData )
            .expect( 200 );

        // Satış tamamlama
        const saleData = { price: 15000 };

        supabase.mockSingleResponse( {
            id: testAnimalId,
            saleStatus: 'SATILDI',
            salePrice: 15000,
            saleDate: new Date()
        } );

        const saleResponse = await request( app )
            .post( `/api/animals/${testAnimalId}/complete-sale` )
            .send( saleData )
            .expect( 200 );

        expect( saleResponse.body.saleStatus ).toBe( 'SATILDI' );
        expect( saleResponse.body.salePrice ).toBe( 15000 );
    } );

    test( 'İneklere test uygulanamamalı', async () => {
        const inekId = 'test-inek-1';

        supabase.mockSingleResponse( {
            id: inekId,
            type: 'INEK',
            category: 'INEK'
        } );

        const testData = {
            testType: 'BRUSELLA',
            testResult: 'NEGATIF',
            performedBy: 'Dr. Ahmet'
        };

        await request( app )
            .post( `/api/animals/${inekId}/test-result` )
            .send( testData )
            .expect( 400 )
            .expect( res => {
                expect( res.body.error ).toBe( 'İneklere test uygulanamaz' );
            } );
    } );

    test( 'Satış sırası kontrolü', async () => {
        const gebeDuveId = 'test-gebe-duve-1';

        // Gebe düve bilgilerini getir
        supabase.mockSingleResponse( {
            id: gebeDuveId,
            category: 'GEBE_DUVE',
            saleStatus: 'SATISA_HAZIR'
        } );

        // Satılmamış inek var
        supabase.mockQueryResponse( [{
            id: 'test-inek-1',
            category: 'INEK',
            saleStatus: 'SATISA_HAZIR'
        }] );

        await request( app )
            .post( `/api/animals/${gebeDuveId}/complete-sale` )
            .send( { price: 15000 } )
            .expect( 500 )
            .expect( res => {
                expect( res.body.error ).toContain( 'INEK kategorisindeki hayvanların satışı tamamlanmalıdır' );
            } );
    } );
} );