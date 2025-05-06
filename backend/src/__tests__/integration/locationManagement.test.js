const request = require( 'supertest' );
const { app } = require( '../../index' );
const { supabase } = require( '../../config/supabaseClient' );

describe( 'Location Management Tests', () => {
    let testUser;
    let adminToken;
    let staffToken;
    let testLocation;
    let testAnimal;

    // Test öncesi hazırlıklar
    beforeAll( async () => {
        // Admin kullanıcı oluştur ve token al
        const { data: adminUser } = await supabase.auth.signUp( {
            email: 'test.admin@example.com',
            password: 'test123456'
        } );

        await supabase.from( 'user_profiles' ).insert( {
            id: adminUser.user.id,
            email: 'test.admin@example.com',
            username: 'testadmin',
            role: 'GULVET_ADMIN'
        } );

        const { data: adminAuth } = await supabase.auth.signInWithPassword( {
            email: 'test.admin@example.com',
            password: 'test123456'
        } );

        adminToken = adminAuth.session.access_token;

        // Saha personeli oluştur ve token al
        const { data: staffUser } = await supabase.auth.signUp( {
            email: 'test.staff@example.com',
            password: 'test123456'
        } );

        await supabase.from( 'user_profiles' ).insert( {
            id: staffUser.user.id,
            email: 'test.staff@example.com',
            username: 'teststaff',
            role: 'SAHA_PERSONELI'
        } );

        const { data: staffAuth } = await supabase.auth.signInWithPassword( {
            email: 'test.staff@example.com',
            password: 'test123456'
        } );

        staffToken = staffAuth.session.access_token;
    } );

    // Test sonrası temizlik
    afterAll( async () => {
        await supabase.from( 'animal_locations' ).delete().match( {} );
        await supabase.from( 'animals' ).delete().match( {} );
        await supabase.from( 'locations' ).delete().match( {} );
        await supabase.from( 'user_profiles' ).delete().match( {
            email: ['test.admin@example.com', 'test.staff@example.com']
        } );
    } );

    describe( 'Location CRUD Operations', () => {
        test( 'should create a new location as admin', async () => {
            const response = await request( app )
                .post( '/api/locations' )
                .set( 'Authorization', `Bearer ${adminToken}` )
                .send( {
                    name: 'Test Ahır 1',
                    type: 'AHIR',
                    capacity: 10,
                    notes: 'Test notları'
                } );

            expect( response.status ).toBe( 201 );
            expect( response.body.success ).toBe( true );
            expect( response.body.data.name ).toBe( 'Test Ahır 1' );

            testLocation = response.body.data;
        } );

        test( 'should not create location as staff', async () => {
            const response = await request( app )
                .post( '/api/locations' )
                .set( 'Authorization', `Bearer ${staffToken}` )
                .send( {
                    name: 'Test Ahır 2',
                    type: 'AHIR',
                    capacity: 10
                } );

            expect( response.status ).toBe( 403 );
        } );

        test( 'should get all locations', async () => {
            const response = await request( app )
                .get( '/api/locations' )
                .set( 'Authorization', `Bearer ${staffToken}` );

            expect( response.status ).toBe( 200 );
            expect( response.body.data ).toBeInstanceOf( Array );
            expect( response.body.data.length ).toBeGreaterThan( 0 );
        } );

        test( 'should update location as admin', async () => {
            const response = await request( app )
                .put( `/api/locations/${testLocation.id}` )
                .set( 'Authorization', `Bearer ${adminToken}` )
                .send( {
                    name: 'Updated Test Ahır',
                    capacity: 15
                } );

            expect( response.status ).toBe( 200 );
            expect( response.body.data.name ).toBe( 'Updated Test Ahır' );
            expect( response.body.data.capacity ).toBe( 15 );
        } );
    } );

    describe( 'Location Capacity Management', () => {
        beforeAll( async () => {
            // Test hayvanı oluştur
            const { data } = await supabase.from( 'animals' ).insert( {
                animal_id: 'TEST001',
                name: 'Test Hayvan',
                gender: 'ERKEK',
                purpose: 'DAMIZLIK',
                status: 'AKTIF'
            } ).select().single();

            testAnimal = data;
        } );

        test( 'should get location occupancy rate', async () => {
            const response = await request( app )
                .get( `/api/locations/${testLocation.id}/occupancy` )
                .set( 'Authorization', `Bearer ${staffToken}` );

            expect( response.status ).toBe( 200 );
            expect( response.body.data ).toHaveProperty( 'current' );
            expect( response.body.data ).toHaveProperty( 'capacity' );
            expect( response.body.data ).toHaveProperty( 'rate' );
        } );

        test( 'should transfer animal to location', async () => {
            const response = await request( app )
                .post( `/api/locations/${testLocation.id}/transfer` )
                .set( 'Authorization', `Bearer ${staffToken}` )
                .send( {
                    animalId: testAnimal.id,
                    notes: 'Test transferi'
                } );

            expect( response.status ).toBe( 200 );
            expect( response.body.success ).toBe( true );
        } );

        test( 'should get animals in location', async () => {
            const response = await request( app )
                .get( `/api/locations/${testLocation.id}/animals` )
                .set( 'Authorization', `Bearer ${staffToken}` );

            expect( response.status ).toBe( 200 );
            expect( response.body.data ).toBeInstanceOf( Array );
            expect( response.body.data.length ).toBe( 1 );
            expect( response.body.data[0].id ).toBe( testAnimal.id );
        } );

        test( 'should prevent transfer when location is full', async () => {
            // Önce lokasyon kapasitesini 1'e düşür
            await request( app )
                .put( `/api/locations/${testLocation.id}` )
                .set( 'Authorization', `Bearer ${adminToken}` )
                .send( { capacity: 1 } );

            // Yeni bir hayvan oluştur
            const { data: newAnimal } = await supabase.from( 'animals' ).insert( {
                animal_id: 'TEST002',
                name: 'Test Hayvan 2',
                gender: 'DİŞİ',
                purpose: 'DAMIZLIK',
                status: 'AKTIF'
            } ).select().single();

            // Transfer dene
            const response = await request( app )
                .post( `/api/locations/${testLocation.id}/transfer` )
                .set( 'Authorization', `Bearer ${staffToken}` )
                .send( {
                    animalId: newAnimal.id,
                    notes: 'Bu transfer başarısız olmalı'
                } );

            expect( response.status ).toBe( 400 );
            expect( response.body.message ).toContain( 'kapasitesi dolu' );
        } );
    } );
} );