import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import axiosInstance, { getToken, setToken } from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { ROLES } from './RoleContext';

const AuthContext = createContext();

// Rol bazlı izin haritası
export const ROLE_PERMISSIONS = {
    [ROLES.SYSTEM_ADMIN]: [
        'READ_ALL', 'WRITE_ALL', 'MANAGE_ALL', 'ADMIN',
        // Sayfa görüntüleme izinleri
        'VIEW_ANIMALS_PAGE', 'VIEW_ANIMAL_DETAILS_PAGE', 'VIEW_ADD_ANIMAL_PAGE',
        'VIEW_SHELTERS_PAGE', 'VIEW_SHELTER_DETAILS_PAGE', 'VIEW_PADDOCKS_PAGE', 'VIEW_PADDOCK_DETAILS_PAGE',
        'VIEW_TESTS_PAGE', 'VIEW_TEST_DETAILS_PAGE', 'VIEW_HEALTH_RECORDS_PAGE',
        'VIEW_SALES_PAGE', 'VIEW_SALE_DETAILS_PAGE', 'VIEW_LOGISTICS_PAGE',
        'VIEW_USERS_PAGE', 'VIEW_USER_DETAILS_PAGE', 'VIEW_ROLES_PAGE', 'VIEW_ROLE_DETAILS_PAGE',
        'VIEW_REPORTS_PAGE', 'VIEW_SETTINGS_PAGE', 'VIEW_DASHBOARD_PAGE'
    ],
    [ROLES.GULVET_ADMIN]: [
        'READ_ANIMAL', 'WRITE_ANIMAL', 'MANAGE_ANIMAL',
        'READ_HEALTH', 'WRITE_HEALTH', 'MANAGE_HEALTH',
        'READ_FINANCE', 'WRITE_FINANCE', 'MANAGE_FINANCE',
        'READ_USER', 'WRITE_USER'
    ],
    [ROLES.DIMES_ADMIN]: [
        'READ_ANIMAL', 'WRITE_ANIMAL',
        'READ_FINANCE', 'WRITE_FINANCE',
        'READ_LOGISTICS', 'WRITE_LOGISTICS'
    ],
    [ROLES.ASYAET_ADMIN]: [
        'READ_ANIMAL', 'WRITE_ANIMAL',
        'READ_LOGISTICS', 'WRITE_LOGISTICS',
        'READ_FINANCE', 'WRITE_FINANCE'
    ],
    [ROLES.USER]: [
        'READ_ANIMAL',
        'READ_HEALTH',
        'READ_FINANCE',
        'READ_LOGISTICS'
    ]
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [dbStatus, setDbStatus] = useState({ isOnline: true, lastChecked: null });
    const [userPermissions, setUserPermissions] = useState([]);
    const authStateRef = useRef('INITIAL');
    const navigate = useNavigate();
    
    // Kullanıcı bilgilerini sunucudan almak için
    const fetchCurrentUser = useCallback(async (skipTokenCheck = false) => {
        try {
            if (!skipTokenCheck && !getToken()) {
                setUser(null);
                setIsAuthenticated(false);
                setUserPermissions([]);
                return;
            }
            
            const response = await axiosInstance.get('/auth/profile');
            const userData = response.data?.data || response.data;
            
            if (userData) {
                // Kullanıcı rollerini normalize et
                if (!userData.roles && userData.profile?.role) {
                    userData.roles = [{ name: userData.profile.role }];
                } else if (!userData.roles) {
                    userData.roles = [{ name: ROLES.USER }];
                }
                
                setUser(userData);
                setIsAuthenticated(true);
                
                // Kullanıcı izinlerini güncelle
                const userRoles = userData.roles.map(role => role.name);
                const permissions = [];
                
                userRoles.forEach(roleName => {
                    const rolePermissions = ROLE_PERMISSIONS[roleName];
                    if (rolePermissions) {
                        permissions.push(...rolePermissions);
                    }
                });
                
                setUserPermissions(permissions);
            } else {
                throw new Error('Geçersiz kullanıcı verisi');
            }
        } catch (err) {
            console.error('Error fetching current user:', err);
            setUser(null);
            setIsAuthenticated(false);
            setUserPermissions([]);
            
            if (err.response?.status === 401) {
                setToken(null);
                navigate('/login');
            }
            throw err;
        }
    }, [navigate]);

    // Auth state değişikliklerini takip et
    useEffect(() => {
        console.log('[AuthContext] Auth state changed:', authStateRef.current);
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            authStateRef.current = event;
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setUser(session.user);
                    setIsAuthenticated(true);
                    const token = session.access_token;
                    localStorage.setItem('token', token);
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('token');
                delete axiosInstance.defaults.headers.common['Authorization'];
                navigate('/login');
            }
            
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    // Giriş işlemi
    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            
            const response = await axiosInstance.post('/auth/login', { email, password });
            
            if (response.data?.success && (response.data?.access_token || response.data?.token)) {
                const token = response.data?.access_token || response.data?.token;
                setToken(token);
                await fetchCurrentUser(true);
                return { success: true };
            }
            
            throw new Error('Geçersiz yanıt formatı');
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Giriş yapılamadı.';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Çıkış işlemi
    const logout = async () => {
        try {
            setLoading(true);
            await axiosInstance.post('/auth/logout');
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setUserPermissions([]);
            setLoading(false);
            navigate('/login');
        }
    };

    // Kullanıcının belirli bir izne sahip olup olmadığını kontrol et
    const hasPermission = useCallback((requiredPermission) => {
        if (!user) return false;
        return true; // Şu an için tüm kullanıcılara tam yetki veriyoruz
    }, [user]);

    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        dbStatus,
        userPermissions,
        login,
        logout,
        fetchCurrentUser,
        hasPermission,
        signIn: useCallback(async (email, password) => {
            try {
                setError(null);
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;
                return data;
            } catch (error) {
                setError(error.message);
                throw error;
            }
        }, []),
        signOut: useCallback(async () => {
            try {
                setError(null);
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
            } catch (error) {
                setError(error.message);
                throw error;
            }
        }, [])
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
