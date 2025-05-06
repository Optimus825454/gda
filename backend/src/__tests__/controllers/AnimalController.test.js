const request = require( 'supertest' );
const express = require( 'express' );
const AnimalController = require( '../../controllers/AnimalController' );
const AnimalService = require( '../../services/AnimalService' );
const Animal = require( '../../models/Animal' );

jest.mock( '../../services/AnimalService' );

const app = express();
app.use( express.json() );

// Controller metodlarını route'lara bağla
app.get( '/api/animals', AnimalController.listAnimals );
app.get( '/api/animals/category/:category', AnimalController.listByCategory );
app.post( '/api/animals', AnimalController.addAnimal );
app.get( '/api/animals/test-results/:result', AnimalController.listByTestResult );
app.post( '/api/animals/:animalId/test-result', AnimalController.recordTestResult );
app.post( '/api/animals/:animalId/complete-sale', AnimalController.completeSale );
app.get( '/api/reports', AnimalController.getReports );
app.get( '/api/animal-constants', AnimalController.getConstants );

describe( 'AnimalController Tests', () => {
    beforeEach( () => {
        jest.clearAllMocks();
    } );

    describe( 'GET /api/animals', () => {
        test( 'Tüm hayvanları listeleme başarılı olmalı', async () => {
            const mockAnimals = [
                { id: '1', animalId: 'TEST001' },
                { id: '2', animalId: 'TEST002' }
            ];

            Animal.findAll = jest.fn().mockResolvedValue( mockAnimals );

            const response = await request( app )
                .get( '/api/animals' )
                .expect( 200 );

            expect( response.body ).toEqual( mockAnimals );
            expect( Animal.findAll ).toHaveBeenCalled();
        } );

        test( 'Hata durumunda 500 dönmeli', async () => {
            Animal.findAll = jest.fn().mockRejectedValue( new Error( 'Database error' ) );

            await request( app )
                .get( '/api/animals' )
                .expect( 500 );
        } );
    } );

    describe( 'POST /api/animals', () => {
        test( 'Yeni hayvan başarıyla eklenmeli', async () => {
            const mockAnimal = {
                animalId: 'TEST001',
                type: 'Simental',
                birthDate: '2022-01-01',
                gender: 'female',
                weight: 450,
                category: 'DUVE'
            };

            const mockCreatedAnimal = {
                id: '1',
                ...mockAnimal,
                category: 'DUVE'
            };

            AnimalService.addAnimal = jest.fn().mockResolvedValue( mockCreatedAnimal );

            const response = await request( app )
                .post( '/api/animals' )
                .send( mockAnimal )
                .expect( 201 );

            expect( response.body ).toEqual( mockCreatedAnimal );
            expect( AnimalService.addAnimal ).toHaveBeenCalledWith( mockAnimal );
        } );
    } );

    describe( 'POST /api/animals/:animalId/test-result', () => {
        test( 'Test sonucu kaydetme başarılı olmalı', async () => {
            const mockTestData = {
                testType: 'TEST1',
                testResult: 'POZITIF',
                description: 'Test açıklaması'
            };

            const mockResult = {
                testRecord: { id: 'test-1', ...mockTestData },
                animal: { id: 'animal-1', testResult: 'POZITIF' }
            };

            AnimalService.processTestResult = jest.fn().mockResolvedValue( mockResult );

            const response = await request( app )
                .post( '/api/animals/animal-1/test-result' )
                .send( mockTestData )
                .expect( 200 );

            expect( response.body ).toEqual( mockResult );
            expect( AnimalService.processTestResult ).toHaveBeenCalledWith( 'animal-1', mockTestData );
        } );

        test( 'İneklere test uygulanamamalı', async () => {
            AnimalService.processTestResult = jest.fn()
                .mockRejectedValue( new Error( 'İneklere test uygulanamaz' ) );

            await request( app )
                .post( '/api/animals/inek-1/test-result' )
                .send( { testType: 'TEST1', testResult: 'POZITIF' } )
                .expect( 500 )
                .expect( res => {
                    expect( res.body.error ).toBe( 'İneklere test uygulanamaz' );
                } );
        } );
    } );

    describe( 'POST /api/animals/:animalId/complete-sale', () => {
        test( 'Satış işlemi başarılı olmalı', async () => {
            const mockSaleData = {
                price: 15000
            };

            const mockSaleDate = new Date();
            const mockResult = {
                id: 'animal-1',
                saleStatus: 'SATILDI',
                salePrice: 15000,
                saleDate: mockSaleDate
            };

            AnimalService.completeSale = jest.fn().mockResolvedValue( mockResult );

            const response = await request( app )
                .post( '/api/animals/animal-1/complete-sale' )
                .send( mockSaleData )
                .expect( 200 );

            expect( response.body ).toEqual( {
                ...mockResult,
                saleDate: mockSaleDate.toISOString()
            } );
            expect( AnimalService.completeSale ).toHaveBeenCalledWith( 'animal-1', 15000 );
        } );

        test( 'Satış sırası hatası 500 dönmeli', async () => {
            AnimalService.completeSale = jest.fn()
                .mockRejectedValue( new Error( 'Önce üst kategorideki hayvanlar satılmalı' ) );

            await request( app )
                .post( '/api/animals/duve-1/complete-sale' )
                .send( { price: 15000 } )
                .expect( 500 )
                .expect( res => {
                    expect( res.body.error ).toBe( 'Önce üst kategorideki hayvanlar satılmalı' );
                } );
        } );
    } );

    describe( 'GET /api/reports', () => {
        test( 'Rapor verileri başarıyla getirilmeli', async () => {
            const mockReports = {
                inventory: {},
                testResults: {},
                destinationSummary: {},
                salesSummary: {},
                generatedAt: new Date()
            };

            AnimalService.generateReports = jest.fn().mockResolvedValue( mockReports );

            const response = await request( app )
                .get( '/api/reports' )
                .expect( 200 );

            expect( response.body ).toEqual( {
                ...mockReports,
                generatedAt: mockReports.generatedAt.toISOString()
            } );
            expect( AnimalService.generateReports ).toHaveBeenCalled();
        } );
    } );

    describe( 'GET /api/constants', () => {
        test( 'Sabit değerler doğru şekilde dönmeli', async () => {
            const response = await request( app )
                .get( '/api/constants' )
                .expect( 200 );

            expect( response.body ).toHaveProperty( 'categories', Animal.CATEGORIES );
            expect( response.body ).toHaveProperty( 'testResults', Animal.TEST_RESULTS );
            expect( response.body ).toHaveProperty( 'destinationCompanies', Animal.DESTINATION_COMPANIES );
            expect( response.body ).toHaveProperty( 'saleStatus', Animal.SALE_STATUS );
        } );
    } );
} );
