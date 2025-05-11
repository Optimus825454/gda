import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// withPermission için Auth Context'i Kullanacak Bir Wrapper Bileşen
const AuthenticatedComponent = ({ Component, requiredRoles, ...props }) => {
    // useAuth hook'unu burada güvenli bir şekilde kullan
    const auth = useAuth();
    const { user, isAuthenticated } = auth || { user: null, isAuthenticated: false };
    
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Gerekli izin varsa komponenti render et
    return <Component {...props} />;
};

// withPermission HOC, rol veya izin bazlı erişim kontrolü sağlar
// ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
export const withPermission = ( Component, requiredRoles ) => {
    // Wrapper fonksiyon - Props'ları AuthenticatedComponent'e aktar
    const WithPermissionComponent = (props) => {
        return <AuthenticatedComponent Component={Component} requiredRoles={requiredRoles} {...props} />;
    };

    // Debugging için displayName ekle
    const wrappedComponentName = Component.displayName || Component.name || 'Component';
    WithPermissionComponent.displayName = `withPermission(${wrappedComponentName})`;

    return WithPermissionComponent;
};

// Birden fazla rol veya izinle korunan route'lar için
export const withMultiplePermissions = ( Component, requiredRolesOrPermissions ) => {
    return withPermission( Component, requiredRolesOrPermissions );
};