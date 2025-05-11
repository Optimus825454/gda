/**
 * Role.js - Kullanıcı rolleri veri modeli
 * Dinamik rol yönetimi için kullanılır
 */

const { pool } = require( '../config/mysql' );
const Permission = require( './Permission' ); // Permission modelini import et

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
            isSystem: Boolean( dbRole.is_system ), // MySQL'den gelen 0/1 değerini boolean'a çevir
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
            is_system: this.isSystem ? 1 : 0, // Boolean'ı integer'a çevir (0 veya 1)
            created_at: this.createdAt || new Date(),
            updated_at: new Date()
        };
    }

    // Tüm rolleri listele
    static async findAll() {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.query( 'SELECT * FROM roles ORDER BY name ASC' );

            const roleObjects = [];
            if ( rows && rows.length > 0 ) {
                for ( const roleData of rows ) {
                    // Her rol için izinleri getir
                    const permissions = await Permission.findByRoleId( roleData.id );
                    roleObjects.push( Role.fromDatabase( roleData, permissions ) );
                }
            }
            return roleObjects;
        } catch ( error ) {
            console.error( 'Roller listelenirken hata (MySQL - Role.findAll):', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // ID'ye göre rol bulma
    static async findById( id ) {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.query( 'SELECT * FROM roles WHERE id = ?', [id] );

            if ( !rows || rows.length === 0 ) throw new Error( `ID'si ${id} olan rol bulunamadı` );

            // Rolün izinlerini getir
            const permissions = await Permission.findByRoleId( id );
            return Role.fromDatabase( rows[0], permissions );
        } catch ( error ) {
            console.error( `ID'ye göre rol bulunurken hata:`, error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // İsme göre rol bulma
    static async findByName( name ) {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.query( 'SELECT * FROM roles WHERE name = ?', [name] ); // MySQL'de ilike yerine = kullanıyoruz

            if ( !rows || rows.length === 0 ) return null;

            // Rolün izinlerini getir
            const permissions = await Permission.findByRoleId( rows[0].id );
            return Role.fromDatabase( rows[0], permissions );
        } catch ( error ) {
            console.error( 'İsme göre rol bulunurken hata:', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Kullanıcı ID'sine göre roller bulma
    static async findByUserId( userId ) {
        let connection;
        try {
            connection = await pool.getConnection();
            // user_roles tablosundan kullanıcının rol ID'lerini getir
            const [userRolesRows] = await connection.query( 'SELECT role_id FROM user_roles WHERE user_id = ?', [userId] );

            if ( !userRolesRows || userRolesRows.length === 0 ) return [];

            // Rol ID'lerini al
            const roleIds = userRolesRows.map( ur => ur.role_id );

            // Rolleri getir
            // IN operatörü ile sorgu
            const [rolesRows] = await connection.query( 'SELECT * FROM roles WHERE id IN (?)', [roleIds] );

            // Her rol için izinleri getir
            const roleObjects = [];

            for ( const roleData of rolesRows ) {
                const permissions = await Permission.findByRoleId( roleData.id );
                roleObjects.push( Role.fromDatabase( roleData, permissions ) );
            }

            return roleObjects;
        } catch ( error ) {
            console.error( 'Kullanıcı ID sine göre roller bulunurken hata:', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Yeni rol oluştur
    static async create( {
        name,
        description = '',
        isSystem = false,
        permissionCodes = []
    } ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); // İşlemi başlat

            // İsim kontrolü
            if ( !name || name.trim() === '' ) {
                throw new Error( 'Rol ismi gereklidir' );
            }

            // Aynı isimde rol var mı kontrol et
            const existingRole = await Role.findByName( name ); // findByName artık MySQL kullanıyor
            if ( existingRole ) {
                throw new Error( `'${name}' isimli rol zaten mevcut` );
            }

            // Rol oluştur
            const [result] = await connection.query(
                'INSERT INTO roles (name, description, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [name, description, isSystem ? 1 : 0, new Date(), new Date()]
            );

            const newRoleId = result.insertId;

            // İzinleri ekle
            if ( permissionCodes && permissionCodes.length > 0 ) {
                for ( const code of permissionCodes ) {
                    try {
                        const permission = await Permission.findByCode( code ); // Permission modelinin findByCode metodu olmalı
                        if ( permission ) {
                            await connection.query(
                                'INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)',
                                [newRoleId, permission.id, new Date()]
                            );
                        }
                    } catch ( error ) {
                        console.error( `'${code}' izni eklenirken hata:`, error );
                        // Hata durumunda işlemi geri alabilirsiniz
                        // await connection.rollback();
                        // throw error;
                    }
                }
            }

            await connection.commit(); // İşlemi onayla

            // Oluşturulan rolü izinleriyle birlikte getir
            return Role.findById( newRoleId ); // findById artık MySQL kullanıyor
        } catch ( error ) {
            console.error( 'Rol oluşturulurken hata:', error );
            if ( connection ) await connection.rollback(); // Hata durumunda işlemi geri al
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Rol güncelleme
    async save() {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); // İşlemi başlat

            if ( !this.id ) {
                throw new Error( 'Güncellenecek rolün ID si belirtilmemiş' );
            }

            // Sistemde tanımlı rol kontrolü
            const [sysRoleRows] = await connection.query( 'SELECT is_system FROM roles WHERE id = ?', [this.id] );

            // Sistemde tanımlı rol ise sadece açıklaması değiştirilebilir
            if ( sysRoleRows && sysRoleRows.length > 0 && sysRoleRows[0].is_system ) {
                await connection.query(
                    'UPDATE roles SET description = ?, updated_at = ? WHERE id = ?',
                    [this.description, new Date(), this.id]
                );
            } else {
                // Normal rol güncellemesi
                await connection.query(
                    'UPDATE roles SET name = ?, description = ?, is_system = ?, updated_at = ? WHERE id = ?',
                    [this.name, this.description, this.isSystem ? 1 : 0, new Date(), this.id]
                );
            }

            // İzinleri güncelleme (varsa) - Bu kısım RoleController'da updatePermissions metodu ile yönetiliyor olabilir.
            // Eğer Role modelinin save metodu izinleri de güncellemek için kullanılıyorsa, burada permissionIds parametresi olmalı
            // ve role_permissions tablosu güncellenmelidir. Mevcut kodda bu logic yok, sadece rol tablosu güncelleniyor.
            // Eğer izin güncelleme save metodu içinde yapılacaksa, permissionIds parametresi eklenmeli ve aşağıdaki gibi bir logic eklenmeli:
            /*
            if (this.permissions !== undefined) { // permissions property'si constructor'da tanımlı, bu kontrol yeterli olmayabilir.
                // Önce tüm mevcut izinleri sil
                await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [this.id]);
                // Yeni izinleri ekle
                if (this.permissions && this.permissions.length > 0) {
                    const newPermissions = this.permissions.map(p => [this.id, p.id, new Date()]);
                    await connection.query('INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ?', [newPermissions]);
                }
            }
            */

            await connection.commit(); // İşlemi onayla

            return Role.findById( this.id ); // findById artık MySQL kullanıyor
        } catch ( error ) {
            console.error( 'Rol güncellenirken hata:', error );
            if ( connection ) await connection.rollback(); // Hata durumunda işlemi geri al
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Rol silme
    static async delete( id ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); // İşlemi başlat

            // Sistemde tanımlı rol kontrolü
            const [roleRows] = await connection.query( 'SELECT is_system FROM roles WHERE id = ?', [id] );

            if ( !roleRows || roleRows.length === 0 ) throw new Error( `ID'si ${id} olan rol bulunamadı` );
            if ( roleRows[0].is_system ) {
                throw new Error( 'Sistemde tanımlı roller silinemez' );
            }

            // Önce role_permissions tablosundaki ilgili kayıtları sil
            await connection.query( 'DELETE FROM role_permissions WHERE role_id = ?', [id] );

            // Sonra user_roles tablosundaki ilgili kayıtları sil
            await connection.query( 'DELETE FROM user_roles WHERE role_id = ?', [id] );

            // Son olarak rolü sil
            await connection.query( 'DELETE FROM roles WHERE id = ?', [id] );

            await connection.commit(); // İşlemi onayla

            return true;
        } catch ( error ) {
            console.error( 'Rol silinirken hata:', error );
            if ( connection ) await connection.rollback(); // Hata durumunda işlemi geri al
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Role izin ekleme
    static async addPermission( roleId, permissionId ) {
        let connection;
        try {
            connection = await pool.getConnection();
            // Önceden eklenmiş mi kontrol et
            const [existingRows] = await connection.query(
                'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
                [roleId, permissionId]
            );

            // Eğer ilişki zaten varsa eklemeye gerek yok
            if ( existingRows && existingRows.length > 0 ) return true;

            // İlişki yoksa ekle
            await connection.query(
                'INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)',
                [roleId, permissionId, new Date()]
            );

            return true;
        } catch ( error ) {
            console.error( 'Role izin eklenirken hata:', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Rolden izin kaldırma
    static async removePermission( roleId, permissionId ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.query(
                'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
                [roleId, permissionId]
            );
            return true;
        } catch ( error ) {
            console.error( 'Rolden izin kaldırılırken hata:', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Rol izinlerini güncelleme (toplu)
    static async updatePermissions( roleId, permissionIds ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); // İşlemi başlat

            // Önce tüm izinleri sil
            await connection.query( 'DELETE FROM role_permissions WHERE role_id = ?', [roleId] );

            // Yeni izinleri ekle
            if ( permissionIds && permissionIds.length > 0 ) {
                const newPermissions = permissionIds.map( pid => [roleId, pid, new Date()] );
                await connection.query( 'INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ?', [newPermissions] );
            }

            await connection.commit(); // İşlemi onayla

            // Güncellenmiş rolü getir
            return Role.findById( roleId ); // findById artık MySQL kullanıyor
        } catch ( error ) {
            console.error( 'Rol izinleri güncellenirken hata:', error );
            if ( connection ) await connection.rollback(); // Hata durumunda işlemi geri al
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Kullanıcıya rol atama
    static async assignToUser( roleId, userId ) {
        let connection;
        try {
            connection = await pool.getConnection();
            // Önceden atanmış mı kontrol et
            const [existingRows] = await connection.query(
                'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
                [userId, roleId]
            );

            // Eğer ilişki zaten varsa eklemeye gerek yok
            if ( existingRows && existingRows.length > 0 ) return true;

            // İlişki yoksa ekle
            await connection.query(
                'INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)',
                [userId, roleId, new Date()]
            );

            return true;
        } catch ( error ) {
            console.error( 'Kullanıcıya rol atanırken hata:', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Kullanıcıdan rol kaldırma
    static async removeFromUser( roleId, userId ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.query(
                'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
                [userId, roleId]
            );
            return true;
        } catch ( error ) {
            console.error( 'Kullanıcıdan rol kaldırılırken hata:', error );
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
        }
    }

    // Kullanıcı rollerini güncelleme (toplu)
    static async updateUserRoles( userId, roleIds ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); // İşlemi başlat

            // Önce tüm rolleri kaldır
            await connection.query( 'DELETE FROM user_roles WHERE user_id = ?', [userId] );

            // Yeni rolleri ekle
            if ( roleIds && roleIds.length > 0 ) {
                const newRoles = roleIds.map( rid => [userId, rid, new Date()] );
                await connection.query( 'INSERT INTO user_roles (user_id, role_id, created_at) VALUES ?', [newRoles] );
            }

            await connection.commit(); // İşlemi onayla

            // Güncellenmiş kullanıcı rollerini getir
            return Role.findByUserId( userId ); // findByUserId artık MySQL kullanıyor
        } catch ( error ) {
            console.error( 'Kullanıcı rolleri güncellenirken hata:', error );
            if ( connection ) await connection.rollback(); // Hata durumunda işlemi geri al
            throw error;
        } finally {
            if ( connection ) connection.release(); // Bağlantıyı serbest bırak
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