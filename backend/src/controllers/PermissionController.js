/**
 * PermissionController.js - İzin yönetimi controller
 */

const Permission = require( '../models/Permission' );

class PermissionController {
    /**
     * Tüm izinleri listele
     */
    static async listPermissions( req, res ) {
        try {
            const { module, isActive } = req.query;

            // Filtreleme seçeneklerini hazırla
            const options = {};
            if ( module ) options.module = module;
            if ( isActive !== undefined ) {
                options.isActive = isActive === 'true' || isActive === true;
            }

            const permissions = await Permission.findAll( options );

            res.json( {
                success: true,
                data: permissions.map( p => p.toJSON() )
            } );
        } catch ( error ) {
            console.error( 'İzinler listelenirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * ID'ye göre izin detayları
     */
    static async getPermissionById( req, res ) {
        try {
            const { id } = req.params;
            const permission = await Permission.findById( id );

            res.json( {
                success: true,
                data: permission.toJSON()
            } );
        } catch ( error ) {
            console.error( 'İzin detayı alınırken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Kod'a göre izin detayları
     */
    static async getPermissionByCode( req, res ) {
        try {
            const { code } = req.params;
            const permission = await Permission.findByCode( code );

            if ( !permission ) {
                return res.status( 404 ).json( {
                    success: false,
                    error: `'${code}' kodlu izin bulunamadı`
                } );
            }

            res.json( {
                success: true,
                data: permission.toJSON()
            } );
        } catch ( error ) {
            console.error( 'İzin detayı alınırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Yeni izin oluştur
     */
    static async createPermission( req, res ) {
        try {
            const { code, name, description, module, isActive } = req.body;

            // Alan kontrolü
            if ( !code || !name || !module ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'İzin kodu, adı ve modül zorunludur'
                } );
            }

            const permission = await Permission.create( {
                code,
                name,
                description,
                module,
                isActive
            } );

            res.status( 201 ).json( {
                success: true,
                data: permission.toJSON(),
                message: 'İzin başarıyla oluşturuldu'
            } );
        } catch ( error ) {
            console.error( 'İzin oluşturulurken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * İzinleri toplu oluştur
     */
    static async bulkCreatePermissions( req, res ) {
        try {
            const { permissions } = req.body;

            if ( !Array.isArray( permissions ) || permissions.length === 0 ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Geçerli izin verisi dizisi gereklidir'
                } );
            }

            const createdPermissions = await Permission.bulkCreate( permissions );

            res.status( 201 ).json( {
                success: true,
                data: createdPermissions.map( p => p.toJSON() ),
                message: `${createdPermissions.length} izin başarıyla oluşturuldu`
            } );
        } catch ( error ) {
            console.error( 'İzinler toplu oluşturulurken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * İzin bilgilerini güncelle
     */
    static async updatePermission( req, res ) {
        try {
            const { id } = req.params;
            const { code, name, description, module, isActive } = req.body;

            // İzni bul
            const permission = await Permission.findById( id );

            // Alanları güncelle
            if ( code ) permission.code = code;
            if ( name ) permission.name = name;
            if ( description !== undefined ) permission.description = description;
            if ( module ) permission.module = module;
            if ( isActive !== undefined ) permission.isActive = isActive;

            // Kaydet
            const updatedPermission = await permission.save();

            res.json( {
                success: true,
                data: updatedPermission.toJSON(),
                message: 'İzin başarıyla güncellendi'
            } );
        } catch ( error ) {
            console.error( 'İzin güncellenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * İzni aktif/pasif yap
     */
    static async setPermissionStatus( req, res ) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if ( isActive === undefined ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'isActive parametresi gereklidir'
                } );
            }

            // İzni bul
            const permission = await Permission.findById( id );

            // Durumu güncelle
            await permission.setActive( isActive );

            res.json( {
                success: true,
                data: { id, isActive },
                message: `İzin durumu ${isActive ? 'aktif' : 'pasif'} olarak güncellendi`
            } );
        } catch ( error ) {
            console.error( 'İzin durumu güncellenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * İzni sil
     */
    static async deletePermission( req, res ) {
        try {
            const { id } = req.params;

            await Permission.delete( id );

            res.json( {
                success: true,
                message: 'İzin başarıyla silindi'
            } );
        } catch ( error ) {
            console.error( 'İzin silinirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Tüm modülleri getir
     */
    static async listModules( req, res ) {
        try {
            const modules = await Permission.getAllModules();

            res.json( {
                success: true,
                data: modules
            } );
        } catch ( error ) {
            console.error( 'Modüller listelenirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Kullanıcının belirli bir izne sahip olup olmadığını kontrol et
     */
    static async checkUserPermission( req, res ) {
        try {
            const { userId, permissionCode } = req.params;

            if ( !userId || !permissionCode ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Kullanıcı ID ve izin kodu gereklidir'
                } );
            }

            const hasPermission = await Permission.checkUserHasPermission(
                userId,
                permissionCode
            );

            res.json( {
                success: true,
                data: { hasPermission }
            } );
        } catch ( error ) {
            console.error( 'İzin kontrolü yapılırken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }
}

module.exports = PermissionController;