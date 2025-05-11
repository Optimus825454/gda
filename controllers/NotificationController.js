/**
 * NotificationController.js - Bildirim sistemi controller
 */

const Notification = require( '../models/Notification' );

class NotificationController {
    /**
     * Tüm bildirimleri listele (admin için)
     */
    static async listAllNotifications( req, res ) {
        try {
            const {
                userId, isRead, type, priority, categoryId,
                startDate, endDate, orderBy, orderDirection,
                limit = 20, offset = 0
            } = req.query;

            // Filtreleme seçeneklerini hazırla
            const options = {
                limit: parseInt( limit ),
                offset: parseInt( offset )
            };

            if ( userId ) options.userId = userId;
            if ( isRead !== undefined ) options.isRead = isRead === 'true';
            if ( type ) options.type = type;
            if ( priority ) options.priority = priority;
            if ( categoryId ) options.categoryId = categoryId;
            if ( startDate ) options.startDate = new Date( startDate );
            if ( endDate ) options.endDate = new Date( endDate );
            if ( orderBy ) options.orderBy = orderBy;
            if ( orderDirection ) options.orderDirection = orderDirection;

            const notifications = await Notification.findAll( options );

            res.json( {
                success: true,
                data: notifications.map( n => n.toJSON() )
            } );
        } catch ( error ) {
            console.error( 'Bildirimler listelenirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Giriş yapmış kullanıcının bildirimlerini listele
     */
    static async getMyNotifications( req, res ) {
        try {
            const userId = req.user.id;
            const {
                isRead, type, limit = 20, offset = 0,
                orderBy = 'created_at', orderDirection = 'desc'
            } = req.query;

            // Filtreleme seçenekleri
            const options = {
                limit: parseInt( limit ),
                offset: parseInt( offset ),
                orderBy,
                orderDirection
            };

            if ( isRead !== undefined ) {
                options.isRead = isRead === 'true';
            }

            if ( type ) {
                options.types = type.split( ',' );
            }

            const notifications = await Notification.findByUserId( userId, options );

            // Okunmamış bildirim sayısını da getir
            const unreadCount = await Notification.countUnread( userId );

            res.json( {
                success: true,
                data: notifications.map( n => n.toJSON() ),
                unreadCount,
                pagination: {
                    limit: options.limit,
                    offset: options.offset,
                    total: null // Toplam sayı hesaplamak için ek sorgu gerekir
                }
            } );
        } catch ( error ) {
            console.error( 'Kullanıcı bildirimleri alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * ID'ye göre bildirim detayı
     */
    static async getNotificationById( req, res ) {
        try {
            const { id } = req.params;
            const notification = await Notification.findById( id );

            // Bildirim başka bir kullanıcıya aitse veya admin değilse erişimi engelle
            if ( notification.userId !== req.user.id && !req.user.isAdmin ) {
                return res.status( 403 ).json( {
                    success: false,
                    error: 'Bu bildirimi görüntüleme yetkiniz yok'
                } );
            }

            res.json( {
                success: true,
                data: notification.toJSON()
            } );
        } catch ( error ) {
            console.error( 'Bildirim detayı alınırken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Giriş yapmış kullanıcının okunmamış bildirim sayısını getir
     */
    static async getMyUnreadCount( req, res ) {
        try {
            const userId = req.user.id;
            const count = await Notification.countUnread( userId );

            res.json( {
                success: true,
                count
            } );
        } catch ( error ) {
            console.error( 'Okunmamış bildirim sayısı alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Yeni bildirim oluştur (admin veya sistem tarafından)
     */
    static async createNotification( req, res ) {
        try {
            const { userId, type, title, message, data, priority, categoryId } = req.body;

            // Alan kontrolü
            if ( !userId ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Kullanıcı ID zorunludur'
                } );
            }

            if ( !title || !message ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Bildirim başlığı ve mesajı zorunludur'
                } );
            }

            const notification = await Notification.create( {
                userId,
                type: type || 'info',
                title,
                message,
                data,
                priority: priority || 'normal',
                categoryId
            } );

            res.status( 201 ).json( {
                success: true,
                data: notification.toJSON(),
                message: 'Bildirim başarıyla oluşturuldu'
            } );
        } catch ( error ) {
            console.error( 'Bildirim oluşturulurken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Aynı bildirimi birden fazla kullanıcıya gönder
     */
    static async sendToMultipleUsers( req, res ) {
        try {
            const { userIds, notification } = req.body;

            // Alan kontrolü
            if ( !Array.isArray( userIds ) || userIds.length === 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Geçerli kullanıcı ID dizisi gereklidir'
                } );
            }

            if ( !notification || !notification.title || !notification.message ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Geçerli bildirim verileri gereklidir (başlık ve mesaj)'
                } );
            }

            const createdNotifications = await Notification.sendToMultipleUsers( userIds, notification );

            res.status( 201 ).json( {
                success: true,
                data: {
                    count: createdNotifications.length,
                    notifications: createdNotifications.map( n => n.toJSON() )
                },
                message: `${createdNotifications.length} kullanıcıya bildirim gönderildi`
            } );
        } catch ( error ) {
            console.error( 'Çoklu kullanıcıya bildirim gönderilirken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Toplu bildirim oluşturma
     */
    static async createBulkNotifications( req, res ) {
        try {
            const { notifications } = req.body;

            // Alan kontrolü
            if ( !Array.isArray( notifications ) || notifications.length === 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Geçerli bildirim dizisi gereklidir'
                } );
            }

            // Her bildirim için gerekli alanların kontrolü
            for ( const notification of notifications ) {
                if ( !notification.userId || !notification.title || !notification.message ) {
                    return res.status( 400 ).json( {
                        success: false,
                        error: 'Her bildirim için kullanıcı ID, başlık ve mesaj gereklidir'
                    } );
                }
            }

            const createdNotifications = await Notification.createBulk( notifications );

            res.status( 201 ).json( {
                success: true,
                data: {
                    count: createdNotifications.length,
                    notifications: createdNotifications.map( n => n.toJSON() )
                },
                message: `${createdNotifications.length} bildirim başarıyla oluşturuldu`
            } );
        } catch ( error ) {
            console.error( 'Toplu bildirim oluşturulurken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Bildirimi okundu olarak işaretle
     */
    static async markAsRead( req, res ) {
        try {
            const { id } = req.params;
            const notification = await Notification.findById( id );

            // Kullanıcı kendi bildirimlerini işaretleyebilir veya admin tüm bildirimleri
            if ( notification.userId !== req.user.id && !req.user.isAdmin ) {
                return res.status( 403 ).json( {
                    success: false,
                    error: 'Bu bildirimi değiştirme yetkiniz yok'
                } );
            }

            const updatedNotification = await notification.markAsRead();

            res.json( {
                success: true,
                data: updatedNotification.toJSON(),
                message: 'Bildirim okundu olarak işaretlendi'
            } );
        } catch ( error ) {
            console.error( 'Bildirim okundu olarak işaretlenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Bildirimi okunmadı olarak işaretle
     */
    static async markAsUnread( req, res ) {
        try {
            const { id } = req.params;
            const notification = await Notification.findById( id );

            // Kullanıcı kendi bildirimlerini işaretleyebilir veya admin tüm bildirimleri
            if ( notification.userId !== req.user.id && !req.user.isAdmin ) {
                return res.status( 403 ).json( {
                    success: false,
                    error: 'Bu bildirimi değiştirme yetkiniz yok'
                } );
            }

            const updatedNotification = await notification.markAsUnread();

            res.json( {
                success: true,
                data: updatedNotification.toJSON(),
                message: 'Bildirim okunmadı olarak işaretlendi'
            } );
        } catch ( error ) {
            console.error( 'Bildirim okunmadı olarak işaretlenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Giriş yapmış kullanıcının tüm bildirimlerini okundu olarak işaretle
     */
    static async markAllAsRead( req, res ) {
        try {
            const userId = req.user.id;
            const result = await Notification.markAllAsRead( userId );

            res.json( {
                success: true,
                updatedCount: result.updatedCount,
                message: `${result.updatedCount} bildirim okundu olarak işaretlendi`
            } );
        } catch ( error ) {
            console.error( 'Tüm bildirimler okundu olarak işaretlenirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Bildirimi sil
     */
    static async deleteNotification( req, res ) {
        try {
            const { id } = req.params;
            const notification = await Notification.findById( id );

            // Kullanıcı kendi bildirimlerini silebilir veya admin tüm bildirimleri
            if ( notification.userId !== req.user.id && !req.user.isAdmin ) {
                return res.status( 403 ).json( {
                    success: false,
                    error: 'Bu bildirimi silme yetkiniz yok'
                } );
            }

            await Notification.delete( id );

            res.json( {
                success: true,
                message: 'Bildirim başarıyla silindi'
            } );
        } catch ( error ) {
            console.error( 'Bildirim silinirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Giriş yapmış kullanıcının tüm okunmuş bildirimlerini sil
     */
    static async deleteAllReadNotifications( req, res ) {
        try {
            const userId = req.user.id;

            await Notification.deleteAllByUserId( userId, { isRead: true } );

            res.json( {
                success: true,
                message: 'Tüm okunmuş bildirimler silindi'
            } );
        } catch ( error ) {
            console.error( 'Okunmuş bildirimler silinirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Giriş yapmış kullanıcının eski bildirimlerini sil
     */
    static async deleteOldNotifications( req, res ) {
        try {
            const userId = req.user.id;
            const { days = 30 } = req.query;

            // Belirtilen gün sayısı kadar eski bildirimleri hesapla
            const olderThan = new Date();
            olderThan.setDate( olderThan.getDate() - parseInt( days ) );

            await Notification.deleteAllByUserId( userId, { olderThan } );

            res.json( {
                success: true,
                message: `${days} günden eski tüm bildirimler silindi`
            } );
        } catch ( error ) {
            console.error( 'Eski bildirimler silinirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }
}

module.exports = NotificationController;