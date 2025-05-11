/**
 * settingRoutes.js - Sistem ayarları rotaları
 */

const express = require( 'express' );
const SettingController = require( '../controllers/SettingController' );
const auth = require( '../middleware/auth' );
const { permissions } = require( '../config/permissions' );
const { checkPermission } = require( '../middleware/permissions' );
const pool = require( '../config/database' ); // Veritabanı havuzunuzun import edildiği yer

const router = express.Router();

// Rota dosyasına giriş logu - GEÇİCİ DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] settingRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Genel (public) ayarlar - kimlik doğrulama gerekmez
router.get( '/public', SettingController.getPublicSettings );

// Bu router'daki diğer tüm istekler için kimlik doğrulama uygula
// router.use( auth ); // Yetkilendirme middleware'i devre dışı bırakıldı

// Tüm ayarlar - permissions check removed temporarily
router.get( '/', async ( req, res ) => {
    let connection; // Bağlantı değişkeni tanımlanır
    try {
        connection = await pool.getConnection(); // Bağlantı alınır
        // Ayarları veritabanından çekme sorgusu
        const [rows] = await connection.query( 'SELECT * FROM settings LIMIT 1' ); // Örnek sorgu

        if ( rows.length > 0 ) {
            res.json( rows[0] );
        } else {
            // Varsayılan ayarlar veya hata durumu
            console.warn( 'Setting.findAll - Veritabanında ayar bulunamadı, varsayılan ayarlar kullanılacak' );
            res.status( 404 ).json( { message: 'Ayarlar bulunamadı.' } );
        }
    } catch ( error ) {
        console.error( 'Setting.findAll - Veritabanı hatası, varsayılan ayarlar kullanılacak:', error.message ); // Hata mesajını logla
        // Hata durumunda da varsayılan veya boş bir yanıt dönebilirsiniz
        res.status( 500 ).json( { message: 'Ayarlar alınırken bir hata oluştu.' } );
    } finally {
        // Bağlantı varsa serbest bırakılır
        if ( connection ) {
            connection.release();
        }
    }
} );

// Ayar grupları - no permission check needed
router.get( '/groups', SettingController.listGroups );

// ID'ye göre ayar detayı
router.get( '/:id', SettingController.getSettingById );

// Anahtar'a göre ayar detayı 
router.get( '/key/:key', SettingController.getSettingByKey );

// Grup'a göre ayarlar
router.get( '/group/:group', SettingController.getSettingsByGroup );

// Yeni ayar oluştur
router.post( '/', SettingController.createSetting );

// Ayarı güncelle (ID'ye göre)
router.put( '/:id', SettingController.updateSetting );

// Ayarı güncelle veya oluştur (anahtar'a göre)
router.put( '/key/:key', SettingController.setValueByKey );

// Ayarları toplu güncelle
router.put( '/bulk/update', SettingController.bulkUpdateSettings );

// Ayarı sil (ID'ye göre)
router.delete( '/:id', SettingController.deleteSetting );

// Ayarı sil (anahtar'a göre)
router.delete( '/key/:key', SettingController.deleteSettingByKey );

module.exports = router;