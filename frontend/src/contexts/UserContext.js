import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig'; // Axios instance'ını import et

const UserContext = createContext();

export function UserProvider( { children } ) {
    const [users, setUsers] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );

    // Tüm kullanıcıları getir (profil bilgileriyle birlikte)
    const fetchUsers = useCallback( async () => {
        setLoading( true );
        setError( null );
        try {
            // Backend'de /users endpoint'i olduğunu varsayıyoruz
            const response = await axiosInstance.get( '/users' );

            // API'den gelen veri yapısını esnek şekilde ele al
            let userData;
            if ( response.data?.data ) {
                userData = response.data.data;
            } else if ( Array.isArray( response.data ) ) {
                userData = response.data;
            } else {
                userData = [];
            }

            console.log( 'Backend kullanıcı yanıtı:', userData );

            if ( Array.isArray( userData ) ) {
                // Kullanıcı verilerini normalize et
                const processedUsers = userData.map( user => {
                    // Temel kullanıcı nesnesini oluştur
                    const processedUser = {
                        id: user.id || user.user_id || '',
                        email: user.email || '',
                        username: user.username || user.profile?.username || '',
                        firstName: user.firstName || user.first_name || user.profile?.first_name || '',
                        lastName: user.lastName || user.last_name || user.profile?.last_name || '',
                        fullName: user.full_name ||
                            `${user.firstName || user.first_name || user.profile?.first_name || ''} ${user.lastName || user.last_name || user.profile?.last_name || ''}`.trim(),
                        status: user.status || ( user.email_confirmed_at ? 'active' : 'pending' ),
                        profile: user.profile || {},
                        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
                        updatedAt: user.updated_at || user.updatedAt || new Date().toISOString(),
                        email_confirmed_at: user.email_confirmed_at
                    };

                    // Rol bilgisini işle
                    if ( user.roles && Array.isArray( user.roles ) ) {
                        processedUser.roles = user.roles;
                    } else if ( user.role ) {
                        processedUser.roles = [{
                            id: user.role_id || 'unknown',
                            name: user.role
                        }];
                    } else if ( user.role_id ) {
                        processedUser.roles = [{
                            id: user.role_id,
                            name: user.role_name || `Rol ${user.role_id}`
                        }];
                    } else if ( user.profile?.role ) {
                        processedUser.roles = [{
                            id: user.profile.role_id || 'unknown',
                            name: user.profile.role
                        }];
                    } else {
                        processedUser.roles = [{ id: 'default', name: 'Kullanıcı' }];
                    }

                    return processedUser;
                } );

                setUsers( processedUsers );
                console.log( 'İşlenmiş kullanıcı verileri:', processedUsers );
            } else {
                console.error( 'Beklenmeyen veri formatı:', userData );
                setUsers( [] );
            }
        } catch ( err ) {
            console.error( "Error fetching users:", err );
            // Daha detaylı hata mesajı gösterimi
            let errorMessage = 'Kullanıcılar getirilemedi.';
            
            if (err.response) {
                // Sunucudan gelen hata yanıtı
                errorMessage = `Sunucu hatası: ${err.response.status} - ${err.response.data?.message || 'Bilinmeyen hata'}`;
                console.error('Sunucu hata detayları:', err.response.data);
            } else if (err.request) {
                // İstek yapıldı ama yanıt alınamadı
                errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
            } else {
                // İstek yapılırken bir şeyler yanlış gitti
                errorMessage = `İstek hatası: ${err.message}`;
            }
            
            setError(errorMessage);
            setUsers( [] );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Yeni kullanıcı oluştur
    const createUser = useCallback( async ( userData ) => {
        setLoading( true );
        setError( null );
        try {
            // Backend'de /users endpoint'ine POST isteği
            const response = await axiosInstance.post( '/users', userData );
            // Başarılı olursa listeyi yenile
            await fetchUsers();
            return { success: true, data: response.data };
        } catch ( err ) {
            console.error( "Error creating user:", err );
            let errorMsg = 'Kullanıcı oluşturulamadı.';
            
            if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
            }
            
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading( false );
        }
    }, [fetchUsers] );

    // Kullanıcı bilgilerini güncelle (rol, durum vb.)
    const updateUser = useCallback( async ( userId, updateData ) => {
        setLoading( true );
        setError( null );
        try {
            // Backend'de /users/:id endpoint'ine PUT veya PATCH isteği
            const response = await axiosInstance.put( `/users/${userId}`, updateData );
            // Başarılı olursa listeyi yenile
            await fetchUsers();
            return { success: true, data: response.data };
        } catch ( err ) {
            console.error( "Error updating user:", err );
            let errorMsg = 'Kullanıcı güncellenemedi.';
            
            if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
            }
            
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading( false );
        }
    }, [fetchUsers] );

    // Kullanıcıyı sil (veya pasif yap)
    const deleteUser = useCallback( async ( userId ) => {
        setLoading( true );
        setError( null );
        try {
            // Backend'de /users/:id endpoint'ine DELETE isteği
            await axiosInstance.delete( `/users/${userId}` );
            // Başarılı olursa listeyi yenile
            await fetchUsers();
            return { success: true };
        } catch ( err ) {
            console.error( "Error deleting user:", err );
            let errorMsg = 'Kullanıcı silinemedi.';
            
            if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
            }
            
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading( false );
        }
    }, [fetchUsers] );

    // Kullanıcının belirli bir role sahip olup olmadığını kontrol et
    const hasUserRole = useCallback((user, roleName) => {
        if (!user || !roleName) return false;
        
        // Rol dizisini kontrol et
        if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some(role => role.name === roleName);
        }
        
        // Diğer olası rol alanlarını kontrol et
        return (
            user.role === roleName ||
            user.profile?.role === roleName
        );
    }, []);

    // Kullanıcının belirli rollerden herhangi birine sahip olup olmadığını kontrol et
    const hasAnyRole = useCallback((user, roleNames) => {
        if (!user || !roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
            return false;
        }
        
        return roleNames.some(roleName => hasUserRole(user, roleName));
    }, [hasUserRole]);

    // Context başlangıcında kullanıcıları yükle
    useEffect( () => {
        fetchUsers();
    }, [fetchUsers] );


    const value = {
        users,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        hasUserRole,
        hasAnyRole
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Hook to use the User context
export function useUser() {
    const context = useContext( UserContext );
    if ( context === undefined ) {
        throw new Error( 'useUser must be used within a UserProvider' );
    }
    return context;
}
