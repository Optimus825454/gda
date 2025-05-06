import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';

// withPermission HOC, rol veya izin bazlı erişim kontrolü sağlar
// ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
export const withPermission = (Component, requiredRoles) => {
    // Component wrapper
    const WithPermissionComponent = (props) => {
        const { user, isAuthenticated } = useAuth();
        
        // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }
        
        // Gerekli izin varsa komponenti render et
        return <Component {...props} />;
    };

    WithPermissionComponent.displayName = `WithPermission(${Component.displayName || Component.name || 'Component'})`;
    return WithPermissionComponent;
};

// Birden fazla rol veya izinle korunan route'lar için
export const withMultiplePermissions = (Component, requiredRolesOrPermissions) => {
    return withPermission(Component, requiredRolesOrPermissions);
};