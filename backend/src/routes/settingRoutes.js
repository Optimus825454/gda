/**
 * settingRoutes.js - Sistem ayarlaru0131 rotalaru0131
 */

const express = require( 'express' );
const SettingController = require( '../controllers/SettingController' );
const auth = require( '../middleware/auth' );
const { permissions } = require( '../config/permissions' );
const { checkPermission } = require( '../middleware/permissions' );

const router = express.Router();

// Rota dosyasu0131na giriu015f logu - GEu00c7u0130Cu0130 DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] settingRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Genel (public) ayarlar - kimlik dou011frulama gerekmez
router.get( '/public', SettingController.getPublicSettings );

// Bu router'daki diu011fer tu00fcm istekler iu00e7in kimlik dou011frulama uygula
router.use( auth );

// Tu00fcm ayarlar - permissions check removed temporarily
router.get( '/', SettingController.listSettings );

// Ayar gruplaru0131 - no permission check needed
router.get( '/groups', SettingController.listGroups );

// ID'ye gu00f6re ayar detayu0131
router.get( '/:id', SettingController.getSettingById );

// Anahtar'a gu00f6re ayar detayu0131 
router.get( '/key/:key', SettingController.getSettingByKey );

// Grup'a gu00f6re ayarlar
router.get( '/group/:group', SettingController.getSettingsByGroup );

// Yeni ayar oluu015ftur
router.post( '/', SettingController.createSetting );

// Ayaru0131 gu00fcncelle (ID'ye gu00f6re)
router.put( '/:id', SettingController.updateSetting );

// Ayaru0131 gu00fcncelle veya oluu015ftur (anahtar'a gu00f6re)
router.put( '/key/:key', SettingController.setValueByKey );

// Ayarlaru0131 toplu gu00fcncelle
router.put( '/bulk/update', SettingController.bulkUpdateSettings );

// Ayaru0131 sil (ID'ye gu00f6re)
router.delete( '/:id', SettingController.deleteSetting );

// Ayaru0131 sil (anahtar'a gu00f6re)
router.delete( '/key/:key', SettingController.deleteSettingByKey );

module.exports = router;