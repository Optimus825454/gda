const AnimalService = require( '../../services/AnimalService' );
const Animal = require( '../../models/Animal' );
const { supabase } = require( '../../config/supabase' );

jest.mock( '../../config/supabase' );

describe( 'AnimalService Tests', () => {
    describe( 'Test Sonucu İşlemleri', () => {
        test( 'İneklere test uygulanamamalı', async () => {
            const mockAnimal = {
                id: 'test-id',
                category: Animal.CATEGORIES.INEK
            };

            supabase.mockResponse( mockAnimal );

            await expect(
                AnimalService.processTestResult( 'test-id', {
                    testType: 'TEST1',
                    testResult: 'POZITIF'
                } )
            ).rejects.toThrow( 'İneklere test uygulanamaz' );
        } );

        test( 'Test sonucu başarıyla kaydedilmeli', async () => {
            const mockAnimal = new Animal( {
                id: 'test-id',
                category: Animal.CATEGORIES.DUVE
            } );

            const mockTestData = {
                testType: 'TEST1',
                testResult: 'POZITIF',
                description: 'Test açıklaması',
                performedBy: 'Test Uzmanı'
            };

            supabase.mockResponse( mockAnimal );
            supabase.mockResponse( {
                ...mockAnimal,
                testResult: mockTestData.testResult,
                destinationCompany: Animal.DESTINATION_COMPANIES.ASYAET,
                saleStatus: Animal.SALE_STATUS.SATISA_HAZIR
            } );

            const result = await AnimalService.processTestResult( 'test-id', mockTestData );
            expect( result.testResult ).toBe( 'POZITIF' );
            expect( result.destinationCompany ).toBe( Animal.DESTINATION_COMPANIES.ASYAET );
        } );
    } );

    describe( 'Satış İşlemleri', () => {
        test( 'Üst kategorideki hayvanlar satılmadan alt kategori satılamamalı', async () => {
            const mockGebeDuve = {
                id: 'gebe-duve-1',
                category: Animal.CATEGORIES.GEBE_DUVE
            };

            const mockUnsoldInek = [{
                id: 'inek-1',
                category: Animal.CATEGORIES.INEK,
                saleStatus: Animal.SALE_STATUS.BEKLEMEDE
            }];

            supabase.mockResponse( mockGebeDuve );
            supabase.mockResponse( mockUnsoldInek );

            await expect(
                AnimalService.completeSale( 'gebe-duve-1', 15000 )
            ).rejects.toThrow( 'Önce INEK kategorisindeki hayvanların satışı tamamlanmalıdır' );
        } );

        test( 'Satış sırası doğru ise satış tamamlanmalı', async () => {
            const mockInek = {
                id: 'inek-1',
                category: Animal.CATEGORIES.INEK,
                saleStatus: Animal.SALE_STATUS.SATISA_HAZIR
            };

            const mockNoUnsoldInek = [];

            supabase.mockResponse( mockInek );
            supabase.mockResponse( mockNoUnsoldInek );
            supabase.mockResponse( {
                ...mockInek,
                saleStatus: Animal.SALE_STATUS.SATILDI,
                salePrice: 15000,
                saleDate: expect.any( Date )
            } );

            const result = await AnimalService.completeSale( 'inek-1', 15000 );
            expect( result.saleStatus ).toBe( Animal.SALE_STATUS.SATILDI );
            expect( result.salePrice ).toBe( 15000 );
        } );
    } );

    describe( 'Hayvan Kategorizasyonu', () => {
        test( 'İnek tipindeki hayvan INEK kategorisine atanmalı', () => {
            const animal = {
                type: 'INEK',
                birthDate: new Date( '2023-01-01' )
            };

            const category = AnimalService.categorizeAnimal( animal );
            expect( category ).toBe( Animal.CATEGORIES.INEK );
        } );

        test( 'Gebe düve GEBE_DUVE kategorisine atanmalı', () => {
            const animal = {
                type: 'DUVE',
                pregnancyStatus: 'pregnant',
                birthDate: new Date( '2023-01-01' )
            };

            const category = AnimalService.categorizeAnimal( animal );
            expect( category ).toBe( Animal.CATEGORIES.GEBE_DUVE );
        } );

        test( '12-24 ay arası dişi DUVE kategorisine atanmalı', () => {
            // Mock hayvan oluştur - 18 aylık dişi
            const birthDate = new Date();
            birthDate.setMonth( birthDate.getMonth() - 18 ); // 18 ay önce
            
            const animal = {
                birth_date: birthDate.toISOString(),
                gender: 'female'
            };
            
            const category = AnimalService.categorizeAnimal( animal );
            expect( category ).toBe( Animal.CATEGORIES.DUVE );
        } );

        test( '12 aydan küçük hayvan BUZAGI kategorisine atanmalı', () => {
            const animal = {
                type: 'BUZAGI',
                birthDate: new Date( '2025-01-01' )
            };

            const category = AnimalService.categorizeAnimal( animal );
            expect( category ).toBe( Animal.CATEGORIES.BUZAGI );
        } );
    } );

    describe( 'Rapor Üretimi', () => {
        test( 'Rapor verileri doğru şekilde toplanmalı', async () => {
            const mockAnimals = [
                { category: Animal.CATEGORIES.INEK, testResult: 'POZITIF', saleStatus: 'SATILDI', destinationCompany: 'ASYAET' },
                { category: Animal.CATEGORIES.GEBE_DUVE, testResult: 'NEGATIF', saleStatus: 'BEKLEMEDE', destinationCompany: 'GULVET' }
            ];

            const mockHealthRecords = [
                { animalId: '1', testType: 'TEST1', testResult: 'POZITIF' },
                { animalId: '2', testType: 'TEST1', testResult: 'NEGATIF' }
            ];

            supabase.mockResponse( mockAnimals );
            supabase.mockResponse( mockHealthRecords );

            const report = await AnimalService.generateReport();

            expect( report.totalAnimals ).toBe( 2 );
            expect( report.byCategory[Animal.CATEGORIES.INEK] ).toBe( 1 );
            expect( report.byTestResult['POZITIF'] ).toBe( 1 );
            expect( report.bySaleStatus['SATILDI'] ).toBe( 1 );
            expect( report.byDestination['ASYAET'] ).toBe( 1 );
        } );
    } );
} );

describe( 'AnimalService İş Kuralları', () => {
    beforeEach( () => {
        jest.clearAllMocks();
    } );

    test( 'Satış önceliği: Gebe düve ve düve yüksek öncelikli olmalı', async () => {
        const gebeDuve = new Animal( { category: 'GEBE_DUVE' } );
        const duve = new Animal( { category: 'DUVE' } );
        const tohumluDuve = new Animal( { category: 'TOHUMLU_DUVE' } );
        expect( gebeDuve.determineSalePriority() ).toBe( Animal.SALE_PRIORITY.YUKSEK );
        expect( duve.determineSalePriority() ).toBe( Animal.SALE_PRIORITY.YUKSEK );
        expect( tohumluDuve.determineSalePriority() ).toBe( Animal.SALE_PRIORITY.YUKSEK );
    } );

    test( 'Test sonucu işleme: Pozitif ise hedef şirket AsyaEt, Negatif ise Gülvet olmalı', async () => {
        const animal = new Animal( { id: '1', category: 'DUVE', testResult: 'BEKLEMEDE' } );
        animal.save = jest.fn().mockResolvedValue( animal );
        await animal.processTestResult( { testResult: 'POZITIF' } );
        expect( animal.destinationCompany ).toBe( Animal.DESTINATION_COMPANIES.ASYAET );
        await animal.processTestResult( { testResult: 'NEGATIF' } );
        expect( animal.destinationCompany ).toBe( Animal.DESTINATION_COMPANIES.GULVET );
    } );

    test( 'Satış işlemi: Satışa hazır olmayan hayvan satılamaz', async () => {
        const animal = new Animal( { id: '1', saleStatus: 'BEKLEMEDE' } );
        await expect( animal.completeSale( 10000 ) ).rejects.toThrow( 'Hayvan satışa hazır değil' );
    } );

    test( 'Model validasyonu: Geçersiz kimlik numarası hata vermeli', () => {
        const animal = new Animal( { animalId: '123', type: 'DUVE' } );
        const result = animal.validate();
        expect( result.valid ).toBe( false );
        expect( result.errors ).toContain( 'Geçersiz hayvan kimlik numarası formatı (TR ile başlayan 10 haneli numara olmalı)' );
    } );
} );