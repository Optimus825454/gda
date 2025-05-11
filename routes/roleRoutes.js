/**
 * roleRoutes.js - Rol yönetimi rotaları
 */

const express = require( 'express' );
const RoleController = require( '../controllers/RoleController' );
const { checkPermission } = require( '../middleware/permissions' );
const { PERMISSIONS } = require( '../config/permissionConstants' );

const router = express.Router();

// Rota dosyasına giriş logu - GEÇİCİ DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] roleRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Bu router'daki tüm istekler için kimlik doğrulama uygula
const auth = require( '../middleware/auth' ); // auth middleware'ini import et
// router.use( auth ); // Yetkilendirme middleware'i devre dışı bırakıldı

// Tüm roller
router.get( '/', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.listRoles );

// Rol detayı
router.get( '/:id', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.getRoleById );

// Rol oluştur
router.post( '/', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.createRole );

// Rol güncelle
router.put( '/:id', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.updateRole );

// Rol sil
router.delete( '/:id', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.deleteRole );

// Rol izinlerini güncelle
router.put( '/:id/permissions', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.updateRolePermissions );

// Role izin ekle
router.post( '/:roleId/permissions/:permissionId', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.addPermissionToRole );

// Rolden izin kaldır
router.delete( '/:roleId/permissions/:permissionId', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.removePermissionFromRole );

// Rol kullanıcıları
router.get( '/:id/users', checkPermission( PERMISSIONS.MANAGE_ROLES ), RoleController.getRoleUsers );

module.exports = router;
