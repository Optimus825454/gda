/**
 * SettingController.js - Sistem ayarları controller
 */

const Setting = require( '../models/Setting' );

class SettingController {
    /**
     * Tüm ayarları listele
     */
    static async listSettings( req, res ) {
        try {
            const { group, isPublic, keyPrefix } = req.query;

            // Filtreleme seçeneklerini hazırla
            const options = {};
            if ( group ) options.group = group;
            if ( isPublic !== undefined ) {
                options.isPublic = isPublic === 'true';
            }
            if ( keyPrefix ) options.keyPrefix = keyPrefix;

            try {
                const settings = await Setting.findAll( options );
                
                res.json( {
                    success: true,
                    data: settings.map( s => s.toJSON() )
                } );
            } catch (dbError) {
                console.error('Veritabanı hatası:', dbError);
                
                // Tablo bulunamadı hatası için özel işlem
                if (dbError.code === '42P01') {
                    return res.status(500).json({
                        success: false,
                        error: 'Settings tablosu bulunamadı. Sistem yöneticisine başvurun.',
                        code: 'TABLE_NOT_FOUND'
                    });
                }
                
                throw dbError;
            }
        } catch ( error ) {
            console.error( 'Ayarlar listelenirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            } );
        }
    }

    /**
     * Tüm ayar gruplarını listele
     */
    static async listGroups( req, res ) {
        try {
            // Default groups to return in case of error
            const defaultGroups = ['genel', 'sistem', 'hayvan', 'kullanıcı', 'finans'];
            
            try {
                const groups = await Setting.getAllGroups();
                res.json( {
                    success: true,
                    data: groups
                } );
            } catch (error) {
                console.error( 'Ayar grupları listelenirken hata:', error );
                // Return default groups instead of error
                res.json( {
                    success: true,
                    data: defaultGroups,
                    message: 'Varsayılan gruplar döndürülüyor'
                } );
            }
        } catch ( error ) {
            console.error( 'Ayar grupları listelenirken kritik hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * ID'ye göre ayar detayı
     */
    static async getSettingById( req, res ) {
        try {
            const { id } = req.params;
            const setting = await Setting.findById( id );

            res.json( {
                success: true,
                data: setting.toJSON()
            } );
        } catch ( error ) {
            console.error( 'Ayar detayı alınırken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Anahtar'a göre ayar detayı
     */
    static async getSettingByKey( req, res ) {
        try {
            const { key } = req.params;
            const setting = await Setting.findByKey( key );

            if ( !setting ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: `'${key}' anahtarlı ayar bulunamadı`
                } );
            }

            res.json( {
                success: true,
                data: setting.toJSON()
            } );
        } catch ( error ) {
            console.error( 'Ayar detayı alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Grup'a göre ayarları getir
     */
    static async getSettingsByGroup( req, res ) {
        try {
            const { group } = req.params;
            const settings = await Setting.findByGroup( group );

            res.json( {
                success: true,
                data: settings.map( s => s.toJSON() )
            } );
        } catch ( error ) {
            console.error( 'Gruba göre ayarlar alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Yeni ayar oluştur
     */
    static async createSetting( req, res ) {
        try {
            const { key, value, type, group, description, isPublic } = req.body;

            // Alan kontrolü
            if ( !key ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Ayar anahtarı zorunludur'
                } );
            }

            if ( value === undefined || value === null ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Ayar değeri gereklidir'
                } );
            }

            const setting = await Setting.create( {
                key,
                value,
                type: type || 'string',
                group: group || 'genel',
                description,
                isPublic
            } );

            res.status( 201 ).json( {
                success: true,
                data: setting.toJSON(),
                message: 'Ayar başarıyla oluşturuldu'
            } );
        } catch ( error ) {
            console.error( 'Ayar oluşturulurken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Ayarı güncelle
     */
    static async updateSetting( req, res ) {
        try {
            const { id } = req.params;
            const { value, type, group, description, isPublic } = req.body;

            // Ayarı bul
            const setting = await Setting.findById( id );

            // Alanları güncelle
            if ( value !== undefined ) setting.value = value;
            if ( type ) setting.type = type;
            if ( group ) setting.group = group;
            if ( description !== undefined ) setting.description = description;
            if ( isPublic !== undefined ) setting.isPublic = isPublic;

            // Kaydet
            const updatedSetting = await setting.save();

            res.json( {
                success: true,
                data: updatedSetting.toJSON(),
                message: 'Ayar başarıyla güncellendi'
            } );
        } catch ( error ) {
            console.error( 'Ayar güncellenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Anahtar ile ayarı güncelle veya oluştur
     */
    static async setValueByKey( req, res ) {
        try {
            const { key } = req.params;
            const { value, type, group, description, isPublic } = req.body;

            if ( value === undefined || value === null ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Ayar değeri gereklidir'
                } );
            }

            // Ayarı güncelle veya oluştur
            const setting = await Setting.setValue( key, value, {
                type,
                group,
                description,
                isPublic
            } );

            res.json( {
                success: true,
                data: setting.toJSON(),
                message: 'Ayar başarıyla güncellendi'
            } );
        } catch ( error ) {
            console.error( 'Ayar güncellenirken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Ayarları toplu güncelle
     */
    static async bulkUpdateSettings( req, res ) {
        try {
            const { settings } = req.body;

            if ( !Array.isArray( settings ) || settings.length === 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Geçerli ayar dizisi gereklidir'
                } );
            }

            const results = await Setting.bulkUpdate( settings );

            res.json( {
                success: true,
                data: results,
                message: 'Ayarlar başarıyla güncellendi'
            } );
        } catch ( error ) {
            console.error( 'Ayarlar toplu güncellenirken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Ayarı sil
     */
    static async deleteSetting( req, res ) {
        try {
            const { id } = req.params;

            await Setting.delete( id );

            res.json( {
                success: true,
                message: 'Ayar başarıyla silindi'
            } );
        } catch ( error ) {
            console.error( 'Ayar silinirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Anahtar'a göre ayarı sil
     */
    static async deleteSettingByKey( req, res ) {
        try {
            const { key } = req.params;

            // Önce ayarı bul
            const setting = await Setting.findByKey( key );

            if ( !setting ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: `'${key}' anahtarlı ayar bulunamadı`
                } );
            }

            // Sil
            await Setting.delete( setting.id );

            res.json( {
                success: true,
                message: `'${key}' anahtarlı ayar başarıyla silindi`
            } );
        } catch ( error ) {
            console.error( 'Anahtar ile ayar silinirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Genel (public) ayarları getir
     */
    static async getPublicSettings( req, res ) {
        try {
            try {
                const settings = await Setting.getPublicSettings();

                res.json( {
                    success: true,
                    data: settings
                } );
            } catch (dbError) {
                console.error('Veritabanı hatası:', dbError);
                
                // Tablo bulunamadı hatası için özel işlem
                if (dbError.code === '42P01') {
                    // Tablo yoksa boş ayarlar döndür
                    return res.json({
                        success: true,
                        data: {},
                        message: 'Settings tablosu bulunamadı, varsayılan ayarlar kullanılıyor.'
                    });
                }
                
                throw dbError;
            }
        } catch ( error ) {
            console.error( 'Genel ayarlar alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            } );
        }
    }
}

module.exports = SettingController;