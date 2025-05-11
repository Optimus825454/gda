/**
 * Notification.js - Bildirim sistemi veri modeli
 * Kullanıcılara bildirim gönderme ve yönetme için kullanılır
 */

const { supabase } = require( '../config/supabase' );

class Notification {
    constructor( {
        id,
        userId,
        type,
        title,
        message,
        data = {},
        isRead = false,
        priority = 'normal',
        categoryId = null,
        createdAt,
        updatedAt,
        readAt
    } ) {
        this.id = id;
        this.userId = userId; // Bildirimin hedef kullanıcısı
        this.type = type; // Bildirim tipi (örn: 'info', 'warning', 'success', 'error')
        this.title = title; // Bildirim başlığı
        this.message = message; // Bildirim mesajı
        this.data = data; // Ek veriler (JSON olarak saklanır)
        this.isRead = isRead; // Okunma durumu
        this.priority = priority; // Öncelik ('low', 'normal', 'high', 'urgent')
        this.categoryId = categoryId; // Bildirim kategorisi (hayvan, satış vs.)
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.readAt = readAt; // Okunma zamanı
    }

    // Veritabanı kaydından Notification nesnesi oluşturur
    static fromDatabase( dbNotification ) {
        let data = dbNotification.data;

        // JSON string ise objeye dönüştür
        if ( typeof data === 'string' ) {
            try {
                data = JSON.parse( data );
            } catch ( error ) {
                console.error( 'Bildirim verisi JSON formatına dönüştürülürken hata:', error );
                data = {};
            }
        }

        return new Notification( {
            id: dbNotification.id,
            userId: dbNotification.user_id,
            type: dbNotification.type,
            title: dbNotification.title,
            message: dbNotification.message,
            data: data || {},
            isRead: dbNotification.is_read,
            priority: dbNotification.priority,
            categoryId: dbNotification.category_id,
            createdAt: dbNotification.created_at,
            updatedAt: dbNotification.updated_at,
            readAt: dbNotification.read_at
        } );
    }

    // Notification nesnesini veritabanı formatına dönüştürür
    toDatabase() {
        // Veriyi string formatına dönüştür
        const dataString = typeof this.data === 'object' ?
            JSON.stringify( this.data ) :
            this.data;

        return {
            id: this.id,
            user_id: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            data: dataString,
            is_read: this.isRead,
            priority: this.priority,
            category_id: this.categoryId,
            created_at: this.createdAt || new Date(),
            updated_at: new Date(),
            read_at: this.readAt
        };
    }

    // Tüm bildirimleri listele
    static async findAll( options = {} ) {
        try {
            let query = supabase
                .from( 'notifications' )
                .select( '*' );

            // Kullanıcı filtreleme
            if ( options.userId ) {
                query = query.eq( 'user_id', options.userId );
            }

            // Okunma durumuna göre filtreleme
            if ( options.isRead !== undefined ) {
                query = query.eq( 'is_read', options.isRead );
            }

            // Tip filtreleme
            if ( options.type ) {
                query = query.eq( 'type', options.type );
            }

            // Kategori filtreleme
            if ( options.categoryId ) {
                query = query.eq( 'category_id', options.categoryId );
            }

            // Öncelik filtreleme
            if ( options.priority ) {
                query = query.eq( 'priority', options.priority );
            }

            // Tarih aralığı filtreleme
            if ( options.startDate ) {
                query = query.gte( 'created_at', options.startDate );
            }

            if ( options.endDate ) {
                query = query.lte( 'created_at', options.endDate );
            }

            // Sıralama
            const orderColumn = options.orderBy || 'created_at';
            const orderDirection = options.orderDirection === 'asc' ? true : false;
            query = query.order( orderColumn, { ascending: orderDirection } );

            // Sayfalama
            if ( options.limit ) {
                query = query.limit( options.limit );
            }

            if ( options.offset ) {
                query = query.range( options.offset, options.offset + ( options.limit || 10 ) - 1 );
            }

            const { data: notifications, error } = await query;

            if ( error ) throw error;

            return notifications.map( n => Notification.fromDatabase( n ) );
        } catch ( error ) {
            console.error( 'Bildirimler listelenirken hata:', error );
            throw error;
        }
    }

    // ID'ye göre bildirim bulma
    static async findById( id ) {
        try {
            const { data: notification, error } = await supabase
                .from( 'notifications' )
                .select( '*' )
                .eq( 'id', id )
                .single();

            if ( error ) throw error;
            if ( !notification ) throw new Error( `ID'si ${id} olan bildirim bulunamadı` );

            return Notification.fromDatabase( notification );
        } catch ( error ) {
            console.error( `ID'ye göre bildirim bulunurken hata:`, error );
            throw error;
        }
    }

    // Belirli bir kullanıcının bildirimlerini getir
    static async findByUserId( userId, options = {} ) {
        try {
            // Temel sorguyu oluştur
            let query = supabase
                .from( 'notifications' )
                .select( '*' )
                .eq( 'user_id', userId );

            // Okunma durumuna göre filtreleme
            if ( options.isRead !== undefined ) {
                query = query.eq( 'is_read', options.isRead );
            }

            // Tiplere göre filtreleme
            if ( options.types && Array.isArray( options.types ) ) {
                query = query.in( 'type', options.types );
            }

            // Sıralama
            const orderColumn = options.orderBy || 'created_at';
            const orderDirection = options.orderDirection === 'asc' ? true : false;
            query = query.order( orderColumn, { ascending: orderDirection } );

            // Sayfalama
            const limit = options.limit || 20; // Varsayılan limit
            query = query.limit( limit );

            if ( options.offset ) {
                query = query.range( options.offset, options.offset + limit - 1 );
            }

            const { data: notifications, error } = await query;

            if ( error ) throw error;

            return notifications.map( n => Notification.fromDatabase( n ) );
        } catch ( error ) {
            console.error( 'Kullanıcı bildirimleri alınırken hata:', error );
            throw error;
        }
    }

    // Yeni bildirim oluştur
    static async create( {
        userId,
        type,
        title,
        message,
        data = {},
        priority = 'normal',
        categoryId = null
    } ) {
        try {
            // Gerekli alan kontrolü
            if ( !userId ) {
                throw new Error( 'Kullanıcı ID zorunludur' );
            }

            if ( !title || !message ) {
                throw new Error( 'Bildirim başlığı ve mesajı zorunludur' );
            }

            const now = new Date();

            // Bildirim oluştur
            const { data: notification, error } = await supabase
                .from( 'notifications' )
                .insert( {
                    user_id: userId,
                    type: type || 'info',
                    title,
                    message,
                    data: JSON.stringify( data ),
                    is_read: false,
                    priority,
                    category_id: categoryId,
                    created_at: now,
                    updated_at: now,
                    read_at: null
                } )
                .select()
                .single();

            if ( error ) throw error;

            return Notification.fromDatabase( notification );
        } catch ( error ) {
            console.error( 'Bildirim oluşturulurken hata:', error );
            throw error;
        }
    }

    // Toplu bildirim oluşturma
    static async createBulk( notifications = [] ) {
        try {
            if ( !Array.isArray( notifications ) || notifications.length === 0 ) {
                throw new Error( 'Geçerli bildirim dizisi gereklidir' );
            }

            const now = new Date();

            // Bildirimleri veritabanı formatına dönüştür
            const notificationsToInsert = notifications.map( n => ( {
                user_id: n.userId,
                type: n.type || 'info',
                title: n.title,
                message: n.message,
                data: JSON.stringify( n.data || {} ),
                is_read: false,
                priority: n.priority || 'normal',
                category_id: n.categoryId || null,
                created_at: now,
                updated_at: now,
                read_at: null
            } ) );

            // Hepsini ekle
            const { data: createdNotifications, error } = await supabase
                .from( 'notifications' )
                .insert( notificationsToInsert )
                .select();

            if ( error ) throw error;

            return createdNotifications.map( n => Notification.fromDatabase( n ) );
        } catch ( error ) {
            console.error( 'Toplu bildirim oluşturulurken hata:', error );
            throw error;
        }
    }

    // Aynı bildirimi birden fazla kullanıcıya gönder
    static async sendToMultipleUsers( userIds = [], notificationData ) {
        try {
            if ( !Array.isArray( userIds ) || userIds.length === 0 ) {
                throw new Error( 'Geçerli kullanıcı ID dizisi gereklidir' );
            }

            if ( !notificationData || !notificationData.title || !notificationData.message ) {
                throw new Error( 'Geçerli bildirim verileri gereklidir (başlık ve mesaj)' );
            }

            // Her kullanıcı için bir bildirim oluştur
            const notifications = userIds.map( userId => ( {
                userId,
                type: notificationData.type || 'info',
                title: notificationData.title,
                message: notificationData.message,
                data: notificationData.data || {},
                priority: notificationData.priority || 'normal',
                categoryId: notificationData.categoryId || null
            } ) );

            // Toplu oluşturma yap
            return await Notification.createBulk( notifications );
        } catch ( error ) {
            console.error( 'Çoklu kullanıcıya bildirim gönderilirken hata:', error );
            throw error;
        }
    }

    // Bildirim güncelleme
    async save() {
        try {
            if ( !this.id ) {
                throw new Error( 'Güncellenecek bildirimin ID si belirtilmemiş' );
            }

            const { error } = await supabase
                .from( 'notifications' )
                .update( this.toDatabase() )
                .eq( 'id', this.id );

            if ( error ) throw error;

            return await Notification.findById( this.id );
        } catch ( error ) {
            console.error( 'Bildirim güncellenirken hata:', error );
            throw error;
        }
    }

    // Bildirimi okundu olarak işaretle
    async markAsRead() {
        try {
            this.isRead = true;
            this.readAt = new Date();

            return await this.save();
        } catch ( error ) {
            console.error( 'Bildirim okundu olarak işaretlenirken hata:', error );
            throw error;
        }
    }

    // Bildirimi okunmadı olarak işaretle
    async markAsUnread() {
        try {
            this.isRead = false;
            this.readAt = null;

            return await this.save();
        } catch ( error ) {
            console.error( 'Bildirim okunmadı olarak işaretlenirken hata:', error );
            throw error;
        }
    }

    // ID ile bildirimi okundu olarak işaretle
    static async markAsReadById( id ) {
        try {
            const notification = await Notification.findById( id );
            return await notification.markAsRead();
        } catch ( error ) {
            console.error( 'Bildirim okundu olarak işaretlenirken hata:', error );
            throw error;
        }
    }

    // Kullanıcının tüm bildirimlerini okundu olarak işaretle
    static async markAllAsRead( userId ) {
        try {
            const now = new Date();

            const { error } = await supabase
                .from( 'notifications' )
                .update( {
                    is_read: true,
                    read_at: now,
                    updated_at: now
                } )
                .eq( 'user_id', userId )
                .eq( 'is_read', false );

            if ( error ) throw error;

            // Güncellenen bildirimlerin sayısını almak için okunmamış bildirim sorgula
            const { count: updatedCount, error: countError } = await supabase
                .from( 'notifications' )
                .select( '*', { count: 'exact', head: true } )
                .eq( 'user_id', userId )
                .eq( 'is_read', true )
                .gte( 'read_at', now );

            if ( countError ) throw countError;

            return {
                success: true,
                updatedCount: updatedCount
            };
        } catch ( error ) {
            console.error( 'Tüm bildirimler okundu olarak işaretlenirken hata:', error );
            throw error;
        }
    }

    // Bildirimi sil
    static async delete( id ) {
        try {
            const { error } = await supabase
                .from( 'notifications' )
                .delete()
                .eq( 'id', id );

            if ( error ) throw error;

            return true;
        } catch ( error ) {
            console.error( 'Bildirim silinirken hata:', error );
            throw error;
        }
    }

    // Kullanıcının bildirimlerini toplu olarak sil
    static async deleteAllByUserId( userId, options = {} ) {
        try {
            let query = supabase
                .from( 'notifications' )
                .delete()
                .eq( 'user_id', userId );

            // İsteğe bağlı filtreleme
            if ( options.isRead !== undefined ) {
                query = query.eq( 'is_read', options.isRead );
            }

            if ( options.olderThan ) {
                query = query.lt( 'created_at', options.olderThan );
            }

            const { error } = await query;

            if ( error ) throw error;

            return true;
        } catch ( error ) {
            console.error( 'Kullanıcı bildirimleri toplu silinirken hata:', error );
            throw error;
        }
    }

    // Kullanıcının okunmamış bildirim sayısını getir
    static async countUnread( userId ) {
        try {
            const { count, error } = await supabase
                .from( 'notifications' )
                .select( '*', { count: 'exact', head: true } )
                .eq( 'user_id', userId )
                .eq( 'is_read', false );

            if ( error ) throw error;

            return count;
        } catch ( error ) {
            console.error( 'Okunmamış bildirim sayısı alınırken hata:', error );
            throw error;
        }
    }

    // API yanıtı için formatlama
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            type: this.type,
            title: this.title,
            message: this.message,
            data: this.data,
            isRead: this.isRead,
            priority: this.priority,
            categoryId: this.categoryId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            readAt: this.readAt
        };
    }
}

module.exports = Notification;