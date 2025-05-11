import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider( { children } ) {
    const [user, setUser] = useState( null );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );
    const [isAuthenticated, setIsAuthenticated] = useState( false );
    const [userPermissions, setUserPermissions] = useState( [] );
    const navigate = useNavigate();

    // Giriş işlemi (Backend'in token dönmediğini ve şifre kontrolü yaptığını varsayıyoruz)    
    const login = async (username, password) => {
        setLoading( true );
        setError( null );
        try {
            // Temel kimlik doğrulama bilgilerini sessionStorage'a kaydet
            sessionStorage.setItem( 'currentUser', username );
            sessionStorage.setItem( 'currentPassword', password );

            // Login isteği yaparken kimlik doğrulama bilgileri interceptor tarafından otomatik eklenir
            const response = await axiosInstance.post( '/auth/login', { username, password } );

            if ( response.data.success ) {
                const { user: userData, permissions } = response.data;

                setUser( userData ); // Kullanıcı bilgilerini state'e set et
                setUserPermissions( permissions || [] );
                setIsAuthenticated( true );
                setLoading( false );
                navigate( '/' ); // Ana sayfaya yönlendir
                return { success: true };
            } else {
                // Backend'den gelen hata mesajını kullan
                throw new Error( response.data.message || 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.' );
            }
        } catch ( err ) {
            console.error( 'Giriş hatası:', err );
            const errorMessage = err.response?.data?.message || err.message || 'Giriş yapılırken bir hata oluştu';
            setError( errorMessage );
            setIsAuthenticated( false );
            setUser( null );
            setUserPermissions( [] );
            setLoading( false );
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    // Çıkış işlemi (State'leri sıfırla ve kimlik bilgilerini temizle)
    const logout = () => {
        // Session storage'dan kimlik bilgilerini temizle
        sessionStorage.removeItem( 'currentUser' );
        sessionStorage.removeItem( 'currentPassword' );

        setUser( null );
        setUserPermissions( [] );
        setIsAuthenticated( false );
        setError( null );

        // Login sayfasına yönlendir
        navigate( '/login' );
    };

    // İzin kontrolü (Backend'den izinler geliyorsa bu mantık kalabilir)
    const hasPermission = ( permissionCode ) => {
        if ( !permissionCode ) return true; // İzin kodu yoksa her zaman izinli
        if ( !isAuthenticated || !user ) return false; // Kullanıcı giriş yapmamışsa izni yok
        return userPermissions.includes( permissionCode );
    };

    const value = useMemo( () => ( {
        user,
        loading,
        error,
        isAuthenticated,
        userPermissions,
        login,
        logout,
        hasPermission
    } ), [user, loading, error, isAuthenticated, userPermissions] );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext( AuthContext );
    if ( !context ) {
        throw new Error( 'useAuth must be used within an AuthProvider' );
    }
    return context;
}

export default AuthContext;
