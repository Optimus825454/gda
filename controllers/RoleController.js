/**
 * RoleController.js - Rol yönetimi controller
 */

const Role = require( '../models/Role' );
const Permission = require( '../models/Permission' );

class RoleController {
    /**
     * Tüm rolleri listele
     */
    static async listRoles( req, res ) {
        try {
            const roles = await Role.findAll();

            res.json( {
                success: true,
                data: roles.map( role => role.toJSON() )
            } );
        } catch ( error ) {
            console.error( 'Roller listelenirken hata:', error );
            res.status( 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Rol detaylarını getir
     */
    static async getRoleById( req, res ) {
        try {
            const { id } = req.params;
            const role = await Role.findById( id );

            res.json( {
                success: true,
                data: role.toJSON()
            } );
        } catch ( error ) {
            console.error( 'Rol detayı alınırken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Yeni rol oluştur
     */
    static async createRole( req, res ) {
        try {
            const { name, description, isSystem, permissionCodes } = req.body;

            // Alan kontrolü
            if ( !name ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'Rol adı zorunludur'
                } );
            }

            const role = await Role.create( {
                name,
                description,
                isSystem,
                permissionCodes
            } );

            res.status( 201 ).json( {
                success: true,
                data: role.toJSON(),
                message: 'Rol başarıyla oluşturuldu'
            } );
        } catch ( error ) {
            console.error( 'Rol oluşturulurken hata:', error );
            res.status( 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Rol bilgilerini güncelle
     */
    static async updateRole( req, res ) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            // Rolü bul
            const role = await Role.findById( id );

            // Alanları güncelle
            if ( name ) role.name = name;
            if ( description !== undefined ) role.description = description;

            // Kaydet
            const updatedRole = await role.save();

            res.json( {
                success: true,
                data: updatedRole.toJSON(),
                message: 'Rol başarıyla güncellendi'
            } );
        } catch ( error ) {
            console.error( 'Rol güncellenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 400 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Rolü sil
     */
    static async deleteRole( req, res ) {
        try {
            const { id } = req.params;

            await Role.delete( id );

            res.json( {
                success: true,
                message: 'Rol başarıyla silindi'
            } );
        } catch ( error ) {
            console.error( 'Rol silinirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 :
                error.message.includes( 'tanımlı roller' ) ? 403 : 500 ).json( {
                    success: false,
                    error: error.message
                } );
        }
    }

    /**
     * Rol izinlerini güncelle
     */
    static async updateRolePermissions( req, res ) {
        try {
            const { id } = req.params;
            const { permissionIds } = req.body;

            if ( !Array.isArray( permissionIds ) ) {
                return res.status( 400 ).json( {
                    success: false,
                    error: 'İzin listesi bir dizi olmalıdır'
                } );
            }

            const updatedRole = await Role.updatePermissions( id, permissionIds );

            res.json( {
                success: true,
                data: updatedRole.toJSON(),
                message: 'Rol izinleri başarıyla güncellendi'
            } );
        } catch ( error ) {
            console.error( 'Rol izinleri güncellenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Role izin ekle
     */
    static async addPermissionToRole( req, res ) {
        try {
            const { roleId, permissionId } = req.params;

            // Role ve izin var mı kontrol et
            const [role, permission] = await Promise.all( [
                Role.findById( roleId ),
                Permission.findById( permissionId )
            ] );

            // İzni role ekle
            await Role.addPermission( roleId, permissionId );

            res.json( {
                success: true,
                message: `"${permission.name}" izni "${role.name}" rolüne başarıyla eklendi`
            } );
        } catch ( error ) {
            console.error( 'Role izin eklenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Rolden izin kaldır
     */
    static async removePermissionFromRole( req, res ) {
        try {
            const { roleId, permissionId } = req.params;

            // Role ve izin var mı kontrol et
            const [role, permission] = await Promise.all( [
                Role.findById( roleId ),
                Permission.findById( permissionId )
            ] );

            // İzni rolden kaldır
            await Role.removePermission( roleId, permissionId );

            res.json( {
                success: true,
                message: `"${permission.name}" izni "${role.name}" rolünden başarıyla kaldırıldı`
            } );
        } catch ( error ) {
            console.error( 'Rolden izin kaldırılırken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }

    /**
     * Rol kullanıcılarını getir
     */
    static async getRoleUsers( req, res ) {
        try {
            const { id } = req.params;

            // Rolün var olduğunu kontrol et
            await Role.findById( id );

            // Rol kullanıcılarını getir
            const { data: userRoles, error } = await supabase
                .from( 'user_roles' )
                .select( 'user_id' )
                .eq( 'role_id', id );

            if ( error ) throw error;

            // Kullanıcı ID'lerini çıkart
            const userIds = userRoles.map( ur => ur.user_id );

            // Kullanıcı bilgilerini getir
            const User = require( '../models/User' ); // İlgili modeliniz
            const users = await Promise.all(
                userIds.map( async userId => {
                    try {
                        const user = await User.findById( userId );
                        return user ? user.toJSON() : null;
                    } catch ( err ) {
                        return null;
                    }
                } )
            );

            // null değerlerini filtrele
            const validUsers = users.filter( Boolean );

            res.json( {
                success: true,
                data: validUsers
            } );
        } catch ( error ) {
            console.error( 'Rol kullanıcıları listelenirken hata:', error );
            res.status( error.message.includes( 'bulunamadı' ) ? 404 : 500 ).json( {
                success: false,
                error: error.message
            } );
        }
    }
}

module.exports = RoleController;