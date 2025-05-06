const request = require( 'supertest' );
const app = require( '../../index' );
const { sequelize } = require( '../../models/Notification' );

describe( 'Bildirim Entegrasyon Testleri', () => {
    let testUserId = '123-test-user';
    let notificationId;

    // Testlerden önce veritabanını temizle
    beforeAll( async () => {
        // Test için tablolardaki verileri temizle
        await sequelize.query( `DELETE FROM "Notifications" WHERE "userId" = '${testUserId}'` );
    } );

    // Testlerden sonra bağlantıyı kapat
    afterAll( async () => {
        await sequelize.close();
    } );

    it( 'yeni bir bildirim oluşturabilmeli', async () => {
        const response = await request( app )
            .post( '/api/notifications' )
            .send( {
                userId: testUserId,
                message: 'Entegrasyon test bildirimi',
                type: 'info'
            } );

        // Yanıtı kontrol et
        expect( response.status ).toBe( 201 );
        expect( response.body ).toHaveProperty( 'id' );
        expect( response.body.message ).toBe( 'Entegrasyon test bildirimi' );
        expect( response.body.userId ).toBe( testUserId );
        expect( response.body.isRead ).toBe( false );

        // ID'yi diğer testlerde kullanmak için sakla
        notificationId = response.body.id;
    } );

    it( 'kullanıcıya ait tüm bildirimleri listeleyebilmeli', async () => {
        const response = await request( app )
            .get( `/api/notifications/user/${testUserId}` );

        // Yanıtı kontrol et
        expect( response.status ).toBe( 200 );
        expect( Array.isArray( response.body ) ).toBe( true );
        expect( response.body.length ).toBeGreaterThan( 0 );
        expect( response.body.some( n => n.message === 'Entegrasyon test bildirimi' ) ).toBe( true );
    } );

    it( 'bildirimi okundu olarak işaretleyebilmeli', async () => {
        // Öncelikle bildirimin var olduğundan emin ol
        expect( notificationId ).toBeDefined();

        const response = await request( app )
            .put( `/api/notifications/${notificationId}/read` );

        // Yanıtı kontrol et
        expect( response.status ).toBe( 200 );
        expect( response.body ).toHaveProperty( 'isRead', true );
    } );

    it( 'bildirimi silebilmeli', async () => {
        // Öncelikle bildirimin var olduğundan emin ol
        expect( notificationId ).toBeDefined();

        const response = await request( app )
            .delete( `/api/notifications/${notificationId}` );

        // Yanıtı kontrol et
        expect( response.status ).toBe( 200 );
        expect( response.body ).toHaveProperty( 'message', 'Bildirim silindi' );

        // Bildirimin gerçekten silindiğini doğrula
        const getResponse = await request( app )
            .get( `/api/notifications/user/${testUserId}` );

        expect( getResponse.body.every( n => n.id !== notificationId ) ).toBe( true );
    } );
} );