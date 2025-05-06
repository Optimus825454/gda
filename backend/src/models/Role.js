/**
 * Role.js - Kullanıcı rolleri veri modeli
 * Dinamik rol yönetimi için kullanılır
 */

const { supabaseAdmin: supabase } = require( '../config/supabase' );
const Permission = require( './Permission' );

class Role {
    constructor( {
        id,
        name,
        description,
        isSystem = false,
        createdAt,
        updatedAt,
        permissions = []
    } ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isSystem = isSystem; // Sistem tarafından oluşturulan roller silinemez
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.permissions = permissions; // İzin nesneleri dizisi
    }

    // Veritabanı kaydından Role nesnesi oluşturur
    static fromDatabase( dbRole, permissions = [] ) {
        return new Role( {
            id: dbRole.id,
            name: dbRole.name,
            description: dbRole.description,
            isSystem: dbRole.is_system,
            createdAt: dbRole.created_at,
            updatedAt: dbRole.updated_at,
            permissions: permissions
        } );
    }

    // Role nesnesini veritabanı formatına dönüştürür
    toDatabase() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            is_system: this.isSystem,
            created_at: this.createdAt || new Date(),
            updated_at: new Date()
        };
    }

    // Tüm rolleri listele
    static async findAll() {
        try {
            const { data: roles, error } = await supabase
                .from( 'roles' )
                .select( '*' )
                .order( 'name' );

            if ( error ) throw error;

            // Her rol için izinleri getir
            const roleObjects = [];

            for ( const role of roles ) {
                const permissions = await Permission.findByRoleId( role.id );
                roleObjects.push( Role.fromDatabase( role, permissions ) );
            }

            return roleObjects;
        } catch ( error ) {
            console.error( 'Roller listelenirken hata:', error );
            throw error;
        }
    }

    // ID'ye göre rol bulma
    static async findById( id ) {
        try {
            const { data: role, error } = await supabase
                .from( 'roles' )
                .select( '*' )
                .eq( 'id', id )
                .single();

            if ( error ) throw error;
            if ( !role ) throw new Error( `ID'si ${id} olan rol bulunamadı` );

            // Rolün izinlerini getir
            const permissions = await Permission.findByRoleId( id );

            return Role.fromDatabase( role, permissions );
        } catch ( error ) {
            console.error( `ID'ye göre rol bulunurken hata:`, error );
            throw error;
        }
    }

    // İsme göre rol bulma
    static async findByName( name ) {
        try {
            const { data: role, error } = await supabase
                .from( 'roles' )
                .select( '*' )
                .ilike( 'name', name )
                .single();

            if ( error && error.code !== 'PGRST116' ) throw error;
            if ( !role ) return null;

            // Rolün izinlerini getir
            const permissions = await Permission.findByRoleId( role.id );

            return Role.fromDatabase( role, permissions );
        } catch ( error ) {
            console.error( 'İsme göre rol bulunurken hata:', error );
            throw error;
        }
    }

    // Kullanıcı ID'sine göre roller bulma
    static async findByUserId( userId ) {
        try {
            // user_roles tablosundan kullanıcının rollerini getir
            const { data: userRoles, error: userRolesError } = await supabase
                .from( 'user_roles' )
                .select( 'role_id' )
                .eq( 'user_id', userId );

            if ( userRolesError ) throw userRolesError;
            if ( !userRoles || userRoles.length === 0 ) return [];

            // Rol ID'lerini al
            const roleIds = userRoles.map( ur => ur.role_id );

            // Rolleri getir
            const { data: roles, error: rolesError } = await supabase
                .from( 'roles' )
                .select( '*' )
                .in( 'id', roleIds );

            if ( rolesError ) throw rolesError;

            // Her rol için izinleri getir
            const roleObjects = [];

            for ( const role of roles ) {
                const permissions = await Permission.findByRoleId( role.id );
                roleObjects.push( Role.fromDatabase( role, permissions ) );
            }

            return roleObjects;
        } catch ( error ) {
            console.error( 'Kullanıcı ID sine göre roller bulunurken hata:', error );
            throw error;
        }
    }

    // Yeni rol oluştur
    static async create( {
        name,
        description = '',
        isSystem = false,
        permissionCodes = []
    } ) {
        try {
            // İsim kontrolü
            if ( !name || name.trim() === '' ) {
                throw new Error( 'Rol ismi gereklidir' );
            }

            // Aynı isimde rol var mı kontrol et
            const existingRole = await Role.findByName( name );
            if ( existingRole ) {
                throw new Error( `'${name}' isimli rol zaten mevcut` );
            }

            // Rol oluştur
            const { data: role, error } = await supabase
                .from( 'roles' )
                .insert( {
                    name,
                    description,
                    is_system: isSystem,
                    created_at: new Date(),
                    updated_at: new Date()
                } )
                .select()
                .single();

            if ( error ) throw error;

            // İzinleri ekle
            if ( permissionCodes && permissionCodes.length > 0 ) {
                await Promise.all(
                    permissionCodes.map( async ( code ) => {
                        try {
                            const permission = await Permission.findByCode( code );
                            if ( permission ) {
                                await Role.addPermission( role.id, permission.id );
                            }
                        } catch ( error ) {
                            console.error( `'${code}' izni eklenirken hata:`, error );
                        }
                    } )
                );
            }

            // Oluşturulan rolü izinleriyle birlikte getir
            return Role.findById( role.id );
        } catch ( error ) {
            console.error( 'Rol oluşturulurken hata:', error );
            throw error;
        }
    }

    // Rol güncelleme
    async save() {
        try {
            if ( !this.id ) {
                throw new Error( 'Güncellenecek rolün ID si belirtilmemiş' );
            }

            // Sistemde tanımlı rol kontrolü
            if ( this.isSystem ) {
                const { data: sysRole } = await supabase
                    .from( 'roles' )
                    .select( 'is_system' )
                    .eq( 'id', this.id )
                    .single();

                // Sistemde tanımlı rol ise sadece açıklaması değiştirilebilir
                if ( sysRole?.is_system ) {
                    const { error } = await supabase
                        .from( 'roles' )
                        .update( {
                            description: this.description,
                            updated_at: new Date()
                        } )
                        .eq( 'id', this.id );

                    if ( error ) throw error;
                    return await Role.findById( this.id );
                }
            }

            // Normal rol güncellemesi
            const { error } = await supabase
                .from( 'roles' )
                .update( this.toDatabase() )
                .eq( 'id', this.id );

            if ( error ) throw error;
            return await Role.findById( this.id );
        } catch ( error ) {
            console.error( 'Rol güncellenirken hata:', error );
            throw error;
        }
    }

    // Rol silme
    static async delete( id ) {
        try {
            // Sistemde tanımlı rol kontrolü
            const { data: role, error: roleError } = await supabase
                .from( 'roles' )
                .select( '*' )
                .eq( 'id', id )
                .single();

            if ( roleError ) throw roleError;
            if ( !role ) throw new Error( `ID'si ${id} olan rol bulunamadı` );
            if ( role.is_system ) {
                throw new Error( 'Sistemde tanımlı roller silinemez' );
            }

            // Önce role_permissions tablosundaki ilgili kayıtları sil
            const { error: permDeleteError } = await supabase
                .from( 'role_permissions' )
                .delete()
                .eq( 'role_id', id );

            if ( permDeleteError ) throw permDeleteError;

            // Sonra user_roles tablosundaki ilgili kayıtları sil
            const { error: userRoleDeleteError } = await supabase
                .from( 'user_roles' )
                .delete()
                .eq( 'role_id', id );

            if ( userRoleDeleteError ) throw userRoleDeleteError;

            // Son olarak rolü sil
            const { error: roleDeleteError } = await supabase
                .from( 'roles' )
                .delete()
                .eq( 'id', id );

            if ( roleDeleteError ) throw roleDeleteError;

            return true;
        } catch ( error ) {
            console.error( 'Rol silinirken hata:', error );
            throw error;
        }
    }

    // Role izin ekleme
    static async addPermission( roleId, permissionId ) {
        try {
            // Önceden eklenmiş mi kontrol et
            const { data: existing, error: checkError } = await supabase
                .from( 'role_permissions' )
                .select( '*' )
                .eq( 'role_id', roleId )
                .eq( 'permission_id', permissionId )
                .maybeSingle();

            if ( checkError ) throw checkError;

            // Eğer ilişki zaten varsa eklemeye gerek yok
            if ( existing ) return true;

            // İlişki yoksa ekle
            const { error } = await supabase
                .from( 'role_permissions' )
                .insert( {
                    role_id: roleId,
                    permission_id: permissionId,
                    created_at: new Date()
                } );

            if ( error ) throw error;
            return true;
        } catch ( error ) {
            console.error( 'Role izin eklenirken hata:', error );
            throw error;
        }
    }

    // Rolden izin kaldırma
    static async removePermission( roleId, permissionId ) {
        try {
            const { error } = await supabase
                .from( 'role_permissions' )
                .delete()
                .eq( 'role_id', roleId )
                .eq( 'permission_id', permissionId );

            if ( error ) throw error;
            return true;
        } catch ( error ) {
            console.error( 'Rolden izin kaldırılırken hata:', error );
            throw error;
        }
    }

    // Rol izinlerini güncelleme (toplu)
    static async updatePermissions( roleId, permissionIds ) {
        try {
            // Önce tüm izinleri sil
            const { error: deleteError } = await supabase
                .from( 'role_permissions' )
                .delete()
                .eq( 'role_id', roleId );

            if ( deleteError ) throw deleteError;

            // Yeni izinleri ekle
            if ( permissionIds && permissionIds.length > 0 ) {
                const newPermissions = permissionIds.map( pid => ( {
                    role_id: roleId,
                    permission_id: pid,
                    created_at: new Date()
                } ) );

                const { error: insertError } = await supabase
                    .from( 'role_permissions' )
                    .insert( newPermissions );

                if ( insertError ) throw insertError;
            }

            // Güncellenmiş rolü getir
            return Role.findById( roleId );
        } catch ( error ) {
            console.error( 'Rol izinleri güncellenirken hata:', error );
            throw error;
        }
    }

    // Kullanıcıya rol atama
    static async assignToUser( roleId, userId ) {
        try {
            // Önceden atanmış mı kontrol et
            const { data: existing, error: checkError } = await supabase
                .from( 'user_roles' )
                .select( '*' )
                .eq( 'user_id', userId )
                .eq( 'role_id', roleId )
                .maybeSingle();

            if ( checkError ) throw checkError;

            // Eğer ilişki zaten varsa eklemeye gerek yok
            if ( existing ) return true;

            // İlişki yoksa ekle
            const { error } = await supabase
                .from( 'user_roles' )
                .insert( {
                    user_id: userId,
                    role_id: roleId,
                    created_at: new Date()
                } );

            if ( error ) throw error;
            return true;
        } catch ( error ) {
            console.error( 'Kullanıcıya rol atanırken hata:', error );
            throw error;
        }
    }

    // Kullanıcıdan rol kaldırma
    static async removeFromUser( roleId, userId ) {
        try {
            const { error } = await supabase
                .from( 'user_roles' )
                .delete()
                .eq( 'user_id', userId )
                .eq( 'role_id', roleId );

            if ( error ) throw error;
            return true;
        } catch ( error ) {
            console.error( 'Kullanıcıdan rol kaldırılırken hata:', error );
            throw error;
        }
    }

    // Kullanıcı rollerini güncelleme (toplu)
    static async updateUserRoles( userId, roleIds ) {
        try {
            // Önce tüm rolleri kaldır
            const { error: deleteError } = await supabase
                .from( 'user_roles' )
                .delete()
                .eq( 'user_id', userId );

            if ( deleteError ) throw deleteError;

            // Yeni rolleri ekle
            if ( roleIds && roleIds.length > 0 ) {
                const newRoles = roleIds.map( rid => ( {
                    user_id: userId,
                    role_id: rid,
                    created_at: new Date()
                } ) );

                const { error: insertError } = await supabase
                    .from( 'user_roles' )
                    .insert( newRoles );

                if ( insertError ) throw insertError;
            }

            // Güncellenmiş kullanıcı rollerini getir
            return Role.findByUserId( userId );
        } catch ( error ) {
            console.error( 'Kullanıcı rolleri güncellenirken hata:', error );
            throw error;
        }
    }

    // API yanıtı için formatlama
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            isSystem: this.isSystem,
            permissions: this.permissions.map( p => p.toJSON ? p.toJSON() : p ),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Role;