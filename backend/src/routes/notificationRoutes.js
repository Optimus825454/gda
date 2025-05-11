/**
 * notificationRoutes.js - Bildirim sistemi için API rotaları
 */

const express = require( 'express' );
const router = express.Router();
const NotificationController = require( '../controllers/NotificationController' );
const authMiddleware = require( '../middleware/auth' );
const permissionMiddleware = require( '../middleware/permissions' );

// ========== Kullanıcı bildirimleri için rotalar ==========

// Giriş yapmış kullanıcının bildirimlerini listele
router.get(
    '/my',
    authMiddleware,
    NotificationController.getMyNotifications
);

// Giriş yapmış kullanıcının okunmamış bildirim sayısını getir
router.get(
    '/my/count',
    authMiddleware,
    NotificationController.getMyUnreadCount
);

// Giriş yapmış kullanıcının tüm bildirimlerini okundu olarak işaretle
router.post(
    '/my/mark-all-read',
    authMiddleware,
    NotificationController.markAllAsRead
);

// Giriş yapmış kullanıcının tüm okunmuş bildirimlerini sil
router.delete(
    '/my/read',
    authMiddleware,
    NotificationController.deleteAllReadNotifications
);

// Giriş yapmış kullanıcının eski bildirimlerini sil
router.delete(
    '/my/old',
    authMiddleware,
    NotificationController.deleteOldNotifications
);

// ========== Tek bildirim işlemleri için rotalar ==========

// Bildirim detayını getir
router.get(
    '/:id',
    authMiddleware,
    NotificationController.getNotificationById
);

// Bildirimi okundu olarak işaretle
router.put(
    '/:id/read',
    authMiddleware,
    NotificationController.markAsRead
);

// Bildirimi okunmadı olarak işaretle
router.put(
    '/:id/unread',
    authMiddleware,
    NotificationController.markAsUnread
);

// Bildirimi sil
router.delete(
    '/:id',
    authMiddleware,
    NotificationController.deleteNotification
);

// ========== Admin için bildirim yönetimi rotaları ==========

// Tüm bildirimleri listele (Admin)
router.get(
    '/',
    authMiddleware,
    permissionMiddleware.hasPermission( 'notifications.list' ),
    NotificationController.listAllNotifications
);

// Yeni bildirim oluştur (Admin)
router.post(
    '/',
    authMiddleware,
    permissionMiddleware.hasPermission( 'notifications.create' ),
    NotificationController.createNotification
);

// Aynı bildirimi birden fazla kullanıcıya gönder (Admin)
router.post(
    '/bulk-send',
    authMiddleware,
    permissionMiddleware.hasPermission( 'notifications.create' ),
    NotificationController.sendToMultipleUsers
);

// Toplu bildirim oluştur (Admin)
router.post(
    '/bulk',
    authMiddleware,
    permissionMiddleware.hasPermission( 'notifications.create' ),
    NotificationController.createBulkNotifications
);



module.exports = router;