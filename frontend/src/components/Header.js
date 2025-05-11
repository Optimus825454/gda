import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from './ui/theme-provider';
import {
    FaHome,
    FaMoneyBillWave,
    FaChartBar,
    FaUsers,
    FaSignOutAlt,
    FaCog,
    FaUserCircle,
    FaUserAlt,
    FaChevronDown
} from 'react-icons/fa';
import { PiCowBold } from 'react-icons/pi';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { Badge } from '@mui/material';
import { memo } from 'react';

const Header = () => {
    const { user, logout, hasPermission, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [notificationCount] = useState(0);
    const userMenuRef = useRef(null);
    const notificationMenuRef = useRef(null);
    const menuRefs = useRef({});
    const [openMenus, setOpenMenus] = useState({});
    const [openSubMenus, setOpenSubMenus] = useState({});

    // Tüm menüleri kapat
    const closeAllMenus = useCallback(() => {
        setOpenMenus({});
        setOpenSubMenus({});
        setUserMenuOpen(false);
        setNotificationMenuOpen(false);
    }, []);

    // Menü dışı tıklamaları izle
    useEffect(() => {
        let timeoutId;
        function handleClickOutside(event) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                    setUserMenuOpen(false);
                }
                if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
                    setNotificationMenuOpen(false);
                }
                Object.keys(menuRefs.current).forEach(key => {
                    if (openMenus[key] && menuRefs.current[key] && !menuRefs.current[key].contains(event.target)) {
                        setOpenMenus(prevState => ({ ...prevState, [key]: false }));
                    }
                });
            }, 100);
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [openMenus]);

    // Mobil görünüm boyutunu güncelle
    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                const width = window.innerWidth;
                setIsMobile(width < 768);
                if (width >= 768) {
                    closeAllMenus();
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [closeAllMenus]);

    // Menü açma/kapama işlevi
    const toggleMenu = useCallback((key) => {
        setOpenMenus(prevState => {
            const newState = { ...prevState };
            Object.keys(newState).forEach(k => {
                if (k !== key) newState[k] = false;
            });
            newState[key] = !prevState[key];
            return newState;
        });
    }, []);

    // Menü öğesine tıklama işlevi
    const handleMenuItemClick = useCallback((path) => {
        navigate(path);
        closeAllMenus();
    }, [navigate, closeAllMenus]);

    // Alt menü açma/kapama işlevi
    const toggleSubMenu = useCallback((itemKey) => {
        setOpenSubMenus(prevState => ({
            ...prevState,
            [itemKey]: !prevState[itemKey],
        }));
    }, []);

    // Çıkış yapma işlevi
    const handleLogout = useCallback(async () => {
        try {
            await logout();
            closeAllMenus();
            navigate('/login');
        } catch (error) {
            console.error('Çıkış yapılırken hata:', error);
        }
    }, [logout, navigate, closeAllMenus]);

    // Aktif menü kontrolü
    const isActive = useCallback((path) => location.pathname.startsWith(path), [location.pathname]);

    // Logo URL'si
    const logoSrc = useMemo(() => theme === 'dark' ? '/images/logo_light.png' : '/images/logo_dark.png', [theme]);

    const menuItems = [
        { path: '/dashboard', icon: FaHome, text: 'Dashboard', permission: null },
        {
            path: '/animals',
            icon: PiCowBold,
            text: 'Hayvan Yönetimi',
            permission: 'READ_ANIMAL',
            subItems: [
                { path: '/animals', text: 'Hayvan Listesi', permission: 'READ_ANIMAL' },
                { path: '/animals/birth', text: 'Doğum Girişi', permission: 'MANAGE_ANIMAL' },
                { path: '/animals/death', text: 'Ölüm Girişi', permission: 'MANAGE_ANIMAL' },
                { path: '/animals/groups', text: 'Hayvan Grupları', permission: 'READ_ANIMAL' },
                { path: '/tests', text: 'İşlemler', permission: 'MANAGE_TESTS' },
            ]
        },
        {
            path: '/finance',
            icon: FaMoneyBillWave,
            text: 'Finans Yönetimi',
            permission: 'VIEW_FINANCE',
            subItems: [
                { path: '/finance', text: 'Finans Genel Bakış', permission: 'VIEW_FINANCE' },
                { path: '/finance/invoices', text: 'Fatura Listesi', permission: 'VIEW_FINANCE' },
                { path: '/finance/payments', text: 'Ödeme Takibi', permission: 'VIEW_FINANCE' },
                { path: '/finance/dimes', text: 'Dimes Entegrasyonu', permission: 'MANAGE_FINANCE' },
            ]
        },
        {
            path: '/sales',
            icon: FaMoneyBillWave,
            text: 'Satış Yönetimi',
            permission: 'MANAGE_SALES',
            subItems: [
                { path: '/sales', text: 'Satış Listesi', permission: 'MANAGE_SALES' },
                { path: '/sales/form', text: 'Satış Formu', permission: 'MANAGE_SALES' },
                { path: '/logistics/shipment-planner', text: 'Sevkiyat Planlayıcı', permission: 'MANAGE_LOGISTICS' },
            ]
        },
        { path: '/reports', icon: FaChartBar, text: 'Raporlar', permission: 'VIEW_REPORTS' },
        {
            path: '/users',
            icon: FaUsers,
            text: 'Kullanıcı Yönetimi',
            permission: 'MANAGE_USERS',
            subItems: [
                { path: '/users', text: 'Kullanıcı Yönetimi', permission: 'MANAGE_USERS' },
                { path: '/users/audit-logs', text: 'Denetim Kayıtları', permission: 'VIEW_AUDIT_LOGS' },
            ]
        },
        { path: '/settings', icon: FaCog, text: 'Ayarlar', permission: null }
    ];

    if (!isAuthenticated) return null;

    return (
        <header className="sticky top-0 bg-card border-b border-border z-30 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo ve Başlık */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center" onClick={closeAllMenus}>
                            <img src={logoSrc} alt="Logo" className="h-8 w-auto" />
                        </Link>
                    </div>

                    {/* Mobil veya Desktop Menü */}
                    {isMobile ? (
                        <div className="flex items-center">
                            <button
                                onClick={() => toggleMenu('mobile-menu')}
                                className="inline-flex items-center p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                aria-label="Ana Menü"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <nav className="hidden md:flex items-center space-x-1">
                            {menuItems.map((item) => (
                                (!item.permission || hasPermission(item.permission)) && (
                                    <div
                                        key={item.path}
                                        className="relative inline-block"
                                        ref={el => menuRefs.current[item.path] = el}
                                    >
                                        <button
                                            onClick={() => item.subItems ? toggleMenu(item.path) : handleMenuItemClick(item.path)}
                                            className={`flex items-center px-1.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                                                isActive(item.path)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <item.icon className="w-3.5 h-3.5 mr-1" />
                                            {item.text}
                                            {item.subItems && (
                                                <FaChevronDown 
                                                    className={`ml-0.5 w-2.5 h-2.5 transition-transform ${openMenus[item.path] ? 'rotate-180' : ''}`} 
                                                />
                                            )}
                                        </button>
                                        
                                        {item.subItems && openMenus[item.path] && (
                                            <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-50">
                                                <div className="py-1" role="menu">
                                                    {item.subItems.map((subItem) => (
                                                        (!subItem.permission || hasPermission(subItem.permission)) && (
                                                            <Link
                                                                key={subItem.path}
                                                                to={subItem.path}
                                                                className={`block px-4 py-2 text-sm ${
                                                                    isActive(subItem.path)
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                                }`}
                                                                onClick={() => handleMenuItemClick(subItem.path)}
                                                            >
                                                                {subItem.text}
                                                            </Link>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </nav>
                    )}

                    {/* Sağ Taraf Menü */}
                    <div className="flex items-center space-x-4">
                        {/* Bildirimler */}
                        <div className="relative" ref={notificationMenuRef}>
                            <button
                                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                                className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                aria-label="Bildirimler"
                            >
                                <Badge badgeContent={notificationCount} color="primary">
                                    <IoMdNotificationsOutline className="h-6 w-6" />
                                </Badge>
                            </button>
                            {notificationMenuOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5">
                                    <div className="py-1" role="menu">
                                        <div className="px-4 py-2 text-sm text-muted-foreground">
                                            Bildirim bulunmuyor
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kullanıcı Menüsü */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center space-x-2 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
                                aria-label="Kullanıcı menüsü"
                            >
                                <FaUserCircle className="h-6 w-6" />
                                <span className="hidden md:block text-sm font-medium">{user?.email}</span>
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5">
                                    <div className="py-1" role="menu">
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                            role="menuitem"
                                            onClick={() => handleMenuItemClick('/profile')}
                                        >
                                            <FaUserAlt className="mr-2 h-4 w-4" />
                                            Profil
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                            role="menuitem"
                                        >
                                            <FaSignOutAlt className="mr-2 h-4 w-4" />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobil Menü Açılır Panel */}
                {isMobile && openMenus['mobile-menu'] && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => (
                                (!item.permission || hasPermission(item.permission)) && (
                                    <div key={item.path}>
                                        <button
                                            onClick={() => item.subItems ? toggleSubMenu(item.path) : handleMenuItemClick(item.path)}
                                            className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                                                isActive(item.path)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5 mr-2" />
                                            {item.text}
                                            {item.subItems && (
                                                <FaChevronDown 
                                                    className={`ml-auto h-5 w-5 transform ${openSubMenus[item.path] ? 'rotate-180' : ''}`}
                                                />
                                            )}
                                        </button>
                                        {item.subItems && openSubMenus[item.path] && (
                                            <div className="ml-4 mt-2 space-y-1">
                                                {item.subItems.map((subItem) => (
                                                    (!subItem.permission || hasPermission(subItem.permission)) && (
                                                        <Link
                                                            key={subItem.path}
                                                            to={subItem.path}
                                                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                                                                isActive(subItem.path)
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                            }`}
                                                            onClick={() => handleMenuItemClick(subItem.path)}
                                                        >
                                                            {subItem.text}
                                                        </Link>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default memo(Header);
