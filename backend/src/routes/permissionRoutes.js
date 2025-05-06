/**
 * permissionRoutes.js - İzin yönetimi rotaları
 */

const express = require( 'express' );
const PermissionController = require( '../controllers/PermissionController' );
const auth = require( '../middleware/auth' );
const { checkPermission } = require( '../middleware/permissions' );

const router = express.Router();

// Tüm izinler
router.get( '/permissions', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.listPermissions );

// Modüller
router.get( '/permissions/modules', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.listModules );

// İzin detayı (ID)
router.get( '/permissions/:id', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.getPermissionById );

// İzin detayı (Kod)
router.get( '/permissions/code/:code', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.getPermissionByCode );

// İzin oluştur
router.post( '/permissions', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.createPermission );

// Toplu izin oluştur
router.post( '/permissions/bulk', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.bulkCreatePermissions );

// İzin güncelle
router.put( '/permissions/:id', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.updatePermission );

// İzin durumu güncelle
router.put( '/permissions/:id/status', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.setPermissionStatus );

// İzin sil
router.delete( '/permissions/:id', auth, checkPermission( 'MANAGE_PERMISSIONS' ), PermissionController.deletePermission );

// İzin kontrolü (kullanıcının belirli bir izne sahip olup olmadığını kontrol et)
router.get( '/permissions/check/:userId/:permissionCode', auth, checkPermission( 'MANAGE_USERS' ), PermissionController.checkUserPermission );

module.exports = router;