import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig'; // Axios instance'ını import et

const RoleContext = createContext();

// Sistem rolleri
export const ROLES = {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    GULVET_ADMIN: 'GULVET_ADMIN',
    DIMES_ADMIN: 'DIMES_ADMIN',
    ASYAET_ADMIN: 'ASYAET_ADMIN',
    USER: 'USER'
};

// Rol isimleri ve açıklamaları
export const ROLE_DESCRIPTIONS = {
    [ROLES.SYSTEM_ADMIN]: 'Sistem Yöneticisi - Tam yetki',
    [ROLES.GULVET_ADMIN]: 'Gülvet Yöneticisi - Gülvet modülleri üzerinde tam yetki',
    [ROLES.DIMES_ADMIN]: 'Dimes Yöneticisi - Dimes modülleri üzerinde tam yetki',
    [ROLES.ASYAET_ADMIN]: 'AsyaEt Yöneticisi - AsyaEt modülleri üzerinde tam yetki',
    [ROLES.USER]: 'Kullanıcı - Sınırlı okuma yetkisi'
};

export function RoleProvider( { children } ) {
    const [roles, setRoles] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );

    // Tüm rolleri getir
    const fetchRoles = useCallback( async () => {
        setLoading( true );
        setError( null );
        try {
            // URL'den '/api' kısmını kaldırıyoruz çünkü axiosInstance zaten bu base URL'i içeriyor
            const response = await axiosInstance.get( '/roles' );
            
            let rolesData = response.data?.data || response.data || [];
            
            // Eğer backend'den rol listesi alınamazsa veya boşsa, varsayılan roller kullan
            if (!rolesData || !Array.isArray(rolesData) || rolesData.length === 0) {
                rolesData = [
                    { id: '1', name: ROLES.SYSTEM_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.SYSTEM_ADMIN] },
                    { id: '2', name: ROLES.GULVET_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.GULVET_ADMIN] },
                    { id: '3', name: ROLES.DIMES_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.DIMES_ADMIN] },
                    { id: '4', name: ROLES.ASYAET_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.ASYAET_ADMIN] },
                    { id: '5', name: ROLES.USER, description: ROLE_DESCRIPTIONS[ROLES.USER] }
                ];
                console.warn('Backend\'den rol verisi alınamadı, varsayılan roller kullanılıyor');
            }
            
            // Eksik açıklama ve nitelikleri tamamla
            const processedRoles = rolesData.map(role => ({
                ...role,
                description: role.description || ROLE_DESCRIPTIONS[role.name] || `${role.name} Rolü`,
                permissions: role.permissions || []
            }));
            
            setRoles(processedRoles);
        } catch ( err ) {
            console.error( "Error fetching roles:", err );
            
            let errorMessage = 'Roller getirilemedi.';
            
            if (err.response) {
                errorMessage = `Sunucu hatası: ${err.response.status} - ${err.response.data?.message || 'Bilinmeyen hata'}`;
            } else if (err.request) {
                errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
                
                // Sunucu bağlantı hatası durumunda varsayılan rolleri kullan
                const defaultRoles = [
                    { id: '1', name: ROLES.SYSTEM_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.SYSTEM_ADMIN] },
                    { id: '2', name: ROLES.GULVET_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.GULVET_ADMIN] },
                    { id: '3', name: ROLES.DIMES_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.DIMES_ADMIN] },
                    { id: '4', name: ROLES.ASYAET_ADMIN, description: ROLE_DESCRIPTIONS[ROLES.ASYAET_ADMIN] },
                    { id: '5', name: ROLES.USER, description: ROLE_DESCRIPTIONS[ROLES.USER] }
                ];
                
                setRoles(defaultRoles);
                console.warn('Sunucu bağlantı hatası, varsayılan roller kullanılıyor');
                setError('Roller yüklenirken bağlantı hatası oluştu. Varsayılan roller kullanılıyor.');
                setLoading(false);
                return;
            } else {
                errorMessage = `İstek hatası: ${err.message}`;
            }
            
            setError(errorMessage);
            setRoles([]);
        } finally {
            setLoading( false );
        }
    }, [] );

    // Context başlangıcında rolleri yükle
    useEffect( () => {
        fetchRoles();
    }, [fetchRoles] );

    // Rol adına göre rol nesnesini bulma (yardımcı fonksiyon)
    const getRoleByName = useCallback( ( name ) => {
        return roles.find( role => role.name === name );
    }, [roles] );

    // Rol ID'sine göre rol nesnesini bulma (yardımcı fonksiyon)
    const getRoleById = useCallback( ( id ) => {
        return roles.find( role => role.id === id );
    }, [roles] );

    // Bir kullanıcının belirli bir role erişimi var mı kontrol et
    const hasAccess = useCallback((userRoles, requiredRoles) => {
        // Eğer gerekli rol yoksa, erişim ver
        if (!requiredRoles || requiredRoles.length === 0) return true;
        
        // Kullanıcının rolü yoksa erişim verme
        if (!userRoles || userRoles.length === 0) return false;
        
        // String tipinde tek bir rol gelmişse, diziye çevir
        const requiredRolesArray = typeof requiredRoles === 'string' ? [requiredRoles] : requiredRoles;
        
        // Kullanıcı rolünün gerekli rollerden birine eşleşip eşleşmediğini kontrol et
        return userRoles.some(userRole => {
            const roleName = typeof userRole === 'string' ? userRole : userRole.name;
            return requiredRolesArray.includes(roleName) || roleName === ROLES.SYSTEM_ADMIN;
        });
    }, []);


    const value = {
        roles,
        loading,
        error,
        fetchRoles,
        getRoleByName,
        getRoleById,
        hasAccess,
        ROLES
    };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// Hook to use the Role context
export function useRole() {
    const context = useContext( RoleContext );
    if ( context === undefined ) {
        throw new Error( 'useRole must be used within a RoleProvider' );
    }
    return context;
}
