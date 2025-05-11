import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig'; // Axios instance'ını import et

const RoleContext = createContext();

// Sistem rolleri
export const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER'
};

// Rol isimleri ve açıklamaları
export const ROLE_DESCRIPTIONS = {
    [ROLES.ADMIN]: 'Sistem Yöneticisi - Tam yetki',
    [ROLES.USER]: 'Kullanıcı - Sınırlı okuma yetkisi'
};

// Varsayılan roller
const DEFAULT_ROLES = [
    { id: '1', name: ROLES.ADMIN, description: ROLE_DESCRIPTIONS[ROLES.ADMIN] },
    { id: '2', name: ROLES.USER, description: ROLE_DESCRIPTIONS[ROLES.USER] }
];

export function RoleProvider({ children }) {
    const [roles, setRoles] = useState(DEFAULT_ROLES);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Rol adına göre rol nesnesini bulma (yardımcı fonksiyon)
    const getRoleByName = useCallback((name) => {
        return roles.find(role => role.name === name);
    }, [roles]);

    // Rol ID'sine göre rol nesnesini bulma (yardımcı fonksiyon)
    const getRoleById = useCallback((id) => {
        return roles.find(role => role.id === id);
    }, [roles]);

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
            return requiredRolesArray.includes(roleName) || roleName === ROLES.ADMIN;
        });
    }, []);

    const value = {
        roles,
        loading,
        error,
        getRoleByName,
        getRoleById,
        hasAccess,
        ROLES
    };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// Hook to use the Role context
export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
