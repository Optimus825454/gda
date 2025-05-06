/**
* User.js - Kullanıcı veri modeli
* Bu model Supabase Auth ile entegre çalışır ve kullanıcı bilgilerini yönetir
*/

const { supabaseAdmin: supabase, adminAuthClient } = require( '../config/supabase' )
const Role = require( './Role' ); // Role modelini import et
const Permission = require( './Permission' ); // Permission modelini import et

class User {
    constructor( {
        id,
        email,
        username,
        firstName,
        lastName,
        roles = [], // Artık bir dizi rol alacak
        isActive,
        lastLogin,
        position,
        createdAt,
        updatedAt
    } ) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = roles; // Rol nesneleri dizisi
        this.isActive = isActive !== undefined ? isActive : true;
        this.lastLogin = lastLogin;
        this.position = position; // Görev pozisyonu
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Supabase veritabanı kaydından User nesnesi oluşturur
    static async fromDatabase( dbUser, userProfile ) {
        const userId = dbUser.id;
        const roles = await Role.findByUserId( userId ); // Kullanıcının rollerini getir

        return new User( {
            id: userId,
            email: dbUser.email,
            username: userProfile?.username || dbUser.email.split( '@' )[0],
            firstName: userProfile?.first_name,
            lastName: userProfile?.last_name,
            roles: roles, // Rol nesneleri dizisini ata
            isActive: userProfile?.is_active,
            lastLogin: dbUser.last_sign_in_at,
            position: userProfile?.position,
            createdAt: dbUser.created_at,
            updatedAt: userProfile?.updated_at
        } );
    }

    // Nesneyi veritabanı kaydına dönüştürür (user_profiles tablosu için)
    toDatabaseProfile() {
        return {
            user_id: this.id,
            username: this.username,
            first_name: this.firstName,
            last_name: this.lastName,
            // role alanı kaldırıldı
            is_active: this.isActive,
            position: this.position,
            updated_at: new Date()
        };
    }

    // Güncel kullanıcıyı getirir (oturum açmış)
    static async getCurrentUser() {
        const { data: session, error: sessionError } = await supabase.auth.getSession();

        if ( sessionError || !session.session ) {
            return null;
        }

        return User.findById( session.session.user.id );
    }

    // ID'ye göre kullanıcı bulma
    static async findById( userId ) {
        try {
            // Auth verisini getir
            const { data: authUser, error: authError } = await adminAuthClient.getUserById( userId );

            if ( authError || !authUser ) {
                throw new Error( `Kullanıcı bulunamadı: ${authError?.message}` );
            }

            // Profil bilgilerini getir
            const { data: profile, error: profileError } = await supabase
                .from( 'user_profiles' )
                .select( '*' )
                .eq( 'user_id', userId )
                .single();

            if ( profileError && profileError.code !== 'PGRST116' ) {
                console.error( 'Profil verisi alınırken hata:', profileError );
            }

            // Kullanıcı nesnesini oluştururken rolleri de getir
            return User.fromDatabase( authUser.user, profile );
        } catch ( error ) {
            console.error( `findById hata: ${error.message}` );
            throw error;
        }
    }

    // E-posta adresine göre kullanıcı bulma
    static async findByEmail( email ) {
        try {
            // Önce auth kaydını bul
            const { data: users, error: usersError } = await adminAuthClient.listUsers();

            if ( usersError ) {
                throw new Error( `Kullanıcılar listelenirken hata: ${usersError.message}` );
            }

            const authUser = users.users.find( user => user.email === email );

            if ( !authUser ) {
                return null;
            }

            // Profil bilgilerini getir
            const { data: profile, error: profileError } = await supabase
                .from( 'user_profiles' )
                .select( '*' )
                .eq( 'user_id', authUser.id )
                .single();

            if ( profileError && profileError.code !== 'PGRST116' ) {
                console.error( 'Profil verisi alınırken hata:', profileError );
            }

            // Kullanıcı nesnesini oluştururken rolleri de getir
            return User.fromDatabase( authUser, profile );
        } catch ( error ) {
            console.error( `findByEmail hata: ${error.message}` );
            throw error;
        }
    }

    // Tüm kullanıcıları listele
    static async findAll() {
        try {
            // Tüm kullanıcıları listele
            const { data: users, error: usersError } = await adminAuthClient.listUsers();

            if ( usersError ) {
                throw new Error( `Kullanıcılar listelenirken hata: ${usersError.message}` );
            }

            // Tüm profilleri getir
            const { data: profiles, error: profilesError } = await supabase
                .from( 'user_profiles' )
                .select( '*' );

            if ( profilesError ) {
                console.error( 'Profiller alınırken hata:', profilesError );
            }

            // Auth ve profil verilerini birleştir ve her kullanıcı için rolleri getir
            const userPromises = users.users.map( async ( authUser ) => {
                const profile = profiles?.find( p => p.user_id === authUser.id );
                return User.fromDatabase( authUser, profile );
            } );

            return Promise.all( userPromises );
        } catch ( error ) {
            console.error( `findAll hata: ${error.message}` );
            throw error;
        }
    }

    // Kullanıcı oluşturma
    static async create( {
        email,
        password,
        username,
        firstName,
        lastName,
        roleNames = [], // Rol isimleri dizisi alacak
        position
    } ) {
        try {
            // Önce auth kaydı oluştur
            const { data: authData, error: authError } = await supabase.auth.admin.createUser( {
                email,
                password,
                email_confirm: true, // E-posta onayını otomatik geç
                user_metadata: {
                    username,
                    first_name: firstName,
                    last_name: lastName
                }
            } );

            if ( authError ) {
                throw new Error( `Kullanıcı oluşturulurken hata: ${authError.message}` );
            }

            const userId = authData.user.id;

            // Sonra profil kaydı oluştur
            const { error: profileError } = await supabase
                .from( 'user_profiles' )
                .insert( {
                    user_id: userId,
                    username: username || email.split( '@' )[0],
                    first_name: firstName,
                    last_name: lastName,
                    // role alanı kaldırıldı
                    is_active: true,
                    position,
                    created_at: new Date(),
                    updated_at: new Date()
                } );

            if ( profileError ) {
                console.error( 'Profil oluşturulurken hata:', profileError );
                // Auth kaydı oluştu ama profil kaydı oluşmadı, auth kaydını silmeyi deneyebiliriz
                await adminAuthClient.deleteUser( userId );
                throw new Error( `Profil oluşturulurken hata: ${profileError.message}` );
            }

            // Kullanıcıya roller ata
            if ( roleNames && roleNames.length > 0 ) {
                // Rol isimlerini ID'lere çevir
                const { data: roles, error: rolesError } = await supabase
                    .from( 'roles' )
                    .select( 'id' )
                    .in( 'name', roleNames );

                if ( rolesError ) {
                    console.error( 'Rol ID leri alınırken hata:', rolesError );
                    // Hata durumunda kullanıcıyı silmeyelim, rol atama daha sonra yapılabilir
                } else if ( roles && roles.length > 0 ) {
                    const roleIds = roles.map( r => r.id );
                    await Role.updateUserRoles( userId, roleIds ); // Role modelindeki toplu atama metodunu kullan
                }
            }


            // Oluşturulan kullanıcıyı getir (rolleri ile birlikte)
            return User.findById( userId );
        } catch ( error ) {
            console.error( `create hata: ${error.message}` );
            throw error;
        }
    }

    // Kullanıcı bilgilerini güncelleme
    async save() {
        try {
            // Profil bilgilerini güncelle
            const { error: profileError } = await supabase
                .from( 'user_profiles' )
                .upsert( this.toDatabaseProfile() ); // toDatabaseProfile olarak değiştirildi

            if ( profileError ) {
                throw new Error( `Profil güncellenirken hata: ${profileError.message}` );
            }

            // Auth bilgilerini güncelleme (e-posta değiştiyse)
            // Bu işlemi sadece e-posta değiştiyse yapmalıyız, yoksa hata alırız
            if ( this.email ) {
                const { data: authUser } = await adminAuthClient.getUserById( this.id );

                if ( authUser && authUser.user.email !== this.email ) {
                    const { error: updateError } = await adminAuthClient.updateUserById(
                        this.id,
                        { email: this.email }
                    );

                    if ( updateError ) {
                        throw new Error( `Auth bilgileri güncellenirken hata: ${updateError.message}` );
                    }
                }
            }

            // Roller zaten updateUserRoles metodu ile yönetiliyor, burada ayrıca save etmeye gerek yok

            return this;
        } catch ( error ) {
            console.error( `save hata: ${error.message}` );
            throw error;
        }
    }

    // Kullanıcı silme
    static async deleteById( userId ) {
        try {
            // Önce user_roles ilişkilerini sil
            const { error: userRolesError } = await supabase
                .from( 'user_roles' )
                .delete()
                .eq( 'user_id', userId );

            if ( userRolesError ) {
                console.error( 'Kullanıcı rolleri silinirken hata:', userRolesError );
                // Hata olsa da devam et, diğer kayıtları silmek isteyebiliriz
            }

            // Sonra profil kaydını sil
            const { error: profileError } = await supabase
                .from( 'user_profiles' )
                .delete()
                .eq( 'user_id', userId );

            if ( profileError ) {
                console.error( 'Profil silinirken hata:', profileError );
                // Profil silinmezse de devam et, auth kaydını silmek isteyebiliriz
            }

            // Auth kaydını sil
            const { error: authError } = await supabase.auth.admin.deleteUser( userId );

            if ( authError ) {
                throw new Error( `Kullanıcı silinirken hata: ${authError.message}` );
            }

            return true; // Başarılı
        } catch ( error ) {
            console.error( `deleteById hata: ${error.message}` );
            throw error;
        }
    }

    // Parolayı güncelleme
    static async updatePassword( userId, newPassword ) {
        try {
            const { error } = await supabase.auth.admin.updateUserById(
                userId,
                { password: newPassword }
            );

            if ( error ) {
                throw new Error( `Parola güncellenirken hata: ${error.message}` );
            }

            return true;
        } catch ( error ) {
            console.error( `updatePassword hata: ${error.message}` );
            throw error;
        }
    }

    // Kullanıcıyı aktif/pasif yapma
    async setActive( isActive ) {
        this.isActive = isActive;
        // Sadece profil bilgisini güncelle
        const { error } = await supabase
            .from( 'user_profiles' )
            .update( { is_active: this.isActive, updated_at: new Date() } )
            .eq( 'user_id', this.id );

        if ( error ) {
            console.error( 'Kullanıcı aktiflik durumu güncellenirken hata:', error );
            throw error;
        }
        return this;
    }

    // Kullanıcının rollerini güncelleme (toplu)
    async updateRoles( roleIds ) {
        try {
            if ( !this.id ) {
                throw new Error( 'Rolleri güncellenecek kullanıcının ID si belirtilmemiş' );
            }
            await Role.updateUserRoles( this.id, roleIds );
            // Güncellenmiş kullanıcı nesnesini rolleri ile birlikte getir
            return User.findById( this.id );
        } catch ( error ) {
            console.error( 'Kullanıcı rolleri güncellenirken hata:', error );
            throw error;
        }
    }

    // Kullanıcının belirlenen bir izne sahip olup olmadığını kontrol etme
    async hasPermission( permissionCode ) {
        // Permission modelindeki checkUserHasPermission metodunu kullan
        return Permission.checkUserHasPermission( this.id, permissionCode );
    }

    // Kullanıcı verisini API için formatlama
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            fullName: `${this.firstName || ''} ${this.lastName || ''}`.trim(),
            roles: this.roles.map( role => role.toJSON ? role.toJSON() : role ), // Rol nesneleri dizisini döndür
            isActive: this.isActive,
            lastLogin: this.lastLogin,
            position: this.position,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = User;
