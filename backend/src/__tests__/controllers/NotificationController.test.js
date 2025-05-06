const { createNotification, getNotifications, markAsRead, deleteNotification } = require( '../../controllers/NotificationController' );
const Notification = require( '../../models/Notification' );
const { mockRequest, mockResponse } = require( '../mocks/express' );

// Mock Notification model
jest.mock( '../../models/Notification' );

describe( 'NotificationController', () => {
    let req, res;

    beforeEach( () => {
        req = mockRequest();
        res = mockResponse();
        jest.clearAllMocks();
    } );

    describe( 'createNotification', () => {
        it( 'başarıyla yeni bir bildirim oluşturur', async () => {
            // Arrange
            req.body = {
                userId: '123',
                message: 'Test bildirimi',
                type: 'info'
            };
            Notification.create.mockResolvedValue( {
                id: 1,
                userId: '123',
                message: 'Test bildirimi',
                type: 'info',
                isRead: false
            } );

            // Act
            await createNotification( req, res );

            // Assert
            expect( Notification.create ).toHaveBeenCalledWith( {
                userId: '123',
                message: 'Test bildirimi',
                type: 'info'
            } );
            expect( res.status ).toHaveBeenCalledWith( 201 );
            expect( res.json ).toHaveBeenCalledWith( expect.objectContaining( {
                id: 1,
                userId: '123',
                message: 'Test bildirimi'
            } ) );
        } );

        it( 'doğrulama hatalarını yakalar', async () => {
            // Arrange
            req.body = {};

            // Act
            await createNotification( req, res );

            // Assert
            expect( res.status ).toHaveBeenCalledWith( 400 );
            expect( res.json ).toHaveBeenCalledWith( expect.objectContaining( {
                error: expect.any( String )
            } ) );
        } );
    } );

    describe( 'getNotifications', () => {
        it( 'kullanıcıya ait bildirimleri getirir', async () => {
            // Arrange
            req.params.userId = '123';
            const mockNotifications = [
                { id: 1, userId: '123', message: 'Bildirim 1', isRead: false },
                { id: 2, userId: '123', message: 'Bildirim 2', isRead: true }
            ];
            Notification.findAll.mockResolvedValue( mockNotifications );

            // Act
            await getNotifications( req, res );

            // Assert
            expect( Notification.findAll ).toHaveBeenCalledWith( {
                where: { userId: '123' },
                order: [['createdAt', 'DESC']]
            } );
            expect( res.json ).toHaveBeenCalledWith( mockNotifications );
        } );
    } );

    describe( 'markAsRead', () => {
        it( 'bildirimi okundu olarak işaretler', async () => {
            // Arrange
            req.params.id = '1';
            const mockNotification = {
                id: 1,
                userId: '123',
                message: 'Test bildirimi',
                isRead: false,
                update: jest.fn().mockResolvedValue( {
                    id: 1,
                    userId: '123',
                    message: 'Test bildirimi',
                    isRead: true
                } )
            };
            Notification.findByPk.mockResolvedValue( mockNotification );

            // Act
            await markAsRead( req, res );

            // Assert
            expect( Notification.findByPk ).toHaveBeenCalledWith( '1' );
            expect( mockNotification.update ).toHaveBeenCalledWith( { isRead: true } );
            expect( res.json ).toHaveBeenCalledWith( expect.objectContaining( {
                isRead: true
            } ) );
        } );

        it( 'bulunamayan bildirim için 404 döndürür', async () => {
            // Arrange
            req.params.id = '999';
            Notification.findByPk.mockResolvedValue( null );

            // Act
            await markAsRead( req, res );

            // Assert
            expect( res.status ).toHaveBeenCalledWith( 404 );
            expect( res.json ).toHaveBeenCalledWith( { error: 'Bildirim bulunamadı' } );
        } );
    } );

    describe( 'deleteNotification', () => {
        it( 'bildirimi siler', async () => {
            // Arrange
            req.params.id = '1';
            const mockNotification = {
                id: 1,
                destroy: jest.fn().mockResolvedValue( true )
            };
            Notification.findByPk.mockResolvedValue( mockNotification );

            // Act
            await deleteNotification( req, res );

            // Assert
            expect( Notification.findByPk ).toHaveBeenCalledWith( '1' );
            expect( mockNotification.destroy ).toHaveBeenCalled();
            expect( res.json ).toHaveBeenCalledWith( { message: 'Bildirim silindi' } );
        } );

        it( 'bulunamayan bildirim için 404 döndürür', async () => {
            // Arrange
            req.params.id = '999';
            Notification.findByPk.mockResolvedValue( null );

            // Act
            await deleteNotification( req, res );

            // Assert
            expect( res.status ).toHaveBeenCalledWith( 404 );
            expect( res.json ).toHaveBeenCalledWith( { error: 'Bildirim bulunamadı' } );
        } );
    } );
} );