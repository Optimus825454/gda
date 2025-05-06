const { supabase } = require( '../../config/supabase' );
const Animal = require( '../../models/Animal' );

jest.mock( '../../config/supabase' );

describe( 'Animal Model Tests', () => {
    beforeEach( () => {
        jest.clearAllMocks();
    } );

    describe( 'Constructor ve Validasyon', () => {
        test( 'Boş constructor ile oluşturulduğunda default değerleri almalı', () => {
            const animal = new Animal();
            expect( animal.saleStatus ).toBe( Animal.SALE_STATUS.BEKLEMEDE );
            expect( animal.healthStatus ).toBe( 'healthy' );
            expect( animal.pregnancyStatus ).toBe( 'not_pregnant' );
            expect( animal.status ).toBe( 'active' );
        } );

        test( 'Verilen değerlerle doğru şekilde oluşturulmalı', () => {
            const data = {
                id: 'test-id',
                type: 'DUVE',
                category: Animal.CATEGORIES.GENC_DISI,
                testResult: Animal.TEST_RESULTS.NEGATIF,
                saleStatus: Animal.SALE_STATUS.SATISA_HAZIR,
                destinationCompany: Animal.DESTINATION_COMPANIES.GULVET
            };
            const animal = new Animal( data );
            expect( animal.id ).toBe( data.id );
            expect( animal.type ).toBe( data.type );
            expect( animal.category ).toBe( data.category );
            expect( animal.testResult ).toBe( data.testResult );
            expect( animal.saleStatus ).toBe( data.saleStatus );
            expect( animal.destinationCompany ).toBe( data.destinationCompany );
        } );

        test( 'Geçersiz kategori validasyonu hata vermeli', () => {
            const animal = new Animal( { category: 'INVALID' } );
            const validation = animal.validate();
            expect( validation.valid ).toBe( false );
            expect( validation.errors ).toContain( 'Geçersiz kategori' );
        } );

        test( 'Geçersiz test sonucu validasyonu hata vermeli', () => {
            const animal = new Animal( { testResult: 'INVALID' } );
            const validation = animal.validate();
            expect( validation.valid ).toBe( false );
            expect( validation.errors ).toContain( 'Geçersiz test sonucu' );
        } );
    } );

    describe( 'Test Sonucu İşlemleri', () => {
        test( 'Pozitif test sonucu Asyaet\'e yönlendirmeli', async () => {
            supabase.mockResponse( {
                id: 'test-id',
                testResult: Animal.TEST_RESULTS.POZITIF,
                destinationCompany: Animal.DESTINATION_COMPANIES.ASYAET,
                saleStatus: Animal.SALE_STATUS.SATISA_HAZIR
            } );

            const animal = new Animal( { id: 'test-id' } );
            const result = await animal.processTestResult( {
                testResult: Animal.TEST_RESULTS.POZITIF
            } );

            expect( result.destinationCompany ).toBe( Animal.DESTINATION_COMPANIES.ASYAET );
            expect( result.saleStatus ).toBe( Animal.SALE_STATUS.SATISA_HAZIR );
        } );

        test( 'Negatif test sonucu Gülvet\'e yönlendirmeli', async () => {
            supabase.mockResponse( {
                id: 'test-id',
                testResult: Animal.TEST_RESULTS.NEGATIF,
                destinationCompany: Animal.DESTINATION_COMPANIES.GULVET,
                saleStatus: Animal.SALE_STATUS.SATISA_HAZIR
            } );

            const animal = new Animal( { id: 'test-id' } );
            const result = await animal.processTestResult( {
                testResult: Animal.TEST_RESULTS.NEGATIF
            } );

            expect( result.destinationCompany ).toBe( Animal.DESTINATION_COMPANIES.GULVET );
            expect( result.saleStatus ).toBe( Animal.SALE_STATUS.SATISA_HAZIR );
        } );
    } );

    describe( 'Satış İşlemleri', () => {
        test( 'Satış başarıyla tamamlanmalı', async () => {
            supabase.mockResponse( {
                id: 'test-id',
                saleStatus: Animal.SALE_STATUS.SATISA_HAZIR
            } );

            supabase.mockResponse( {
                id: 'test-id',
                saleStatus: Animal.SALE_STATUS.SATILDI,
                salePrice: 15000
            } );

            const animal = new Animal( { id: 'test-id' } );
            const result = await animal.completeSale( 15000 );

            expect( result.saleStatus ).toBe( Animal.SALE_STATUS.SATILDI );
            expect( result.salePrice ).toBe( 15000 );
        } );

        test( 'Satışa hazır olmayan hayvan satılamaz', async () => {
            supabase.mockResponse( {
                id: 'test-id',
                saleStatus: Animal.SALE_STATUS.BEKLEMEDE
            } );

            const animal = new Animal( { id: 'test-id' } );

            await expect( animal.completeSale( 15000 ) )
                .rejects
                .toThrow( 'Hayvan satışa hazır değil' );
        } );
    } );

    describe( 'Kategori Belirleme', () => {
        test( 'İnek direkt INEK kategorisine gitmeli', () => {
            const animal = new Animal( {
                type: 'INEK'
            } );

            expect( animal.determineCategory() ).toBe( Animal.CATEGORIES.INEK );
        } );

        test( 'Gebe düve GEBE_DUVE kategorisine gitmeli', () => {
            const animal = new Animal( {
                type: 'DUVE',
                pregnancyStatus: 'pregnant'
            } );

            expect( animal.determineCategory() ).toBe( Animal.CATEGORIES.GEBE_DUVE );
        } );

        test( '12 aydan küçük hayvan BUZAGI kategorisine gitmeli', () => {
            const birthDate = new Date();
            birthDate.setMonth( birthDate.getMonth() - 6 );

            const animal = new Animal( {
                birthDate: birthDate.toISOString()
            } );

            expect( animal.determineCategory() ).toBe( Animal.CATEGORIES.BUZAGI );
        } );

        test( '12-24 ay arası dişi hayvan DUVE kategorisine gitmeli', () => {
            const birthDate = new Date();
            birthDate.setMonth( birthDate.getMonth() - 18 );
            
            const animal = new Animal( {
                gender: 'female',
                birth_date: birthDate
            } );
            
            expect( animal.determineCategory() ).toBe( Animal.CATEGORIES.DUVE );
        } );
    } );
} );