import React, { useState, useRef, useEffect } from 'react';
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
    FaTruck
} from 'react-icons/fa';
import { PiCowBold } from 'react-icons/pi';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@mui/material';

const Header = () => {
    const { user, logout, hasPermission } = useAuth();
    const { theme } = useTheme(); // setTheme kaldırıldı
    const navigate = useNavigate();
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState( false );
    const [notificationMenuOpen, setNotificationMenuOpen] = useState( false );
    const [isMobile, setIsMobile] = useState( window.innerWidth < 768 ); // Mobil görünüm kontrolü
    const [notificationCount] = useState( 0 ); // Örnek bildirim sayısı
    const userMenuRef = useRef( null );
    const notificationMenuRef = useRef( null );
    const menuRefs = useRef( {} ); // Her menü öğesi için referanslar
    const [openMenus, setOpenMenus] = useState( {} ); // Her menü öğesi için açık/kapalı durumu
    const [openSubMenus, setOpenSubMenus] = useState({}); // Alt menülerin açık/kapalı durumu

    // Menü dışı tıklamaları izle
    useEffect( () => {
        function handleClickOutside( event ) {
            if ( userMenuRef.current && !userMenuRef.current.contains( event.target ) ) {
                setUserMenuOpen( false );
            }
            if ( notificationMenuRef.current && !notificationMenuRef.current.contains( event.target ) ) {
                setNotificationMenuOpen( false );
            }
            // Açık olan tüm menüleri kapat
            Object.keys( openMenus ).forEach( key => {
                if ( openMenus[key] && menuRefs.current[key] && !menuRefs.current[key].contains( event.target ) ) {
                    setOpenMenus( prevState => ( { ...prevState, [key]: false } ) );
                }
            } );
        }

        document.addEventListener( "mousedown", handleClickOutside );
        return () => {
            document.removeEventListener( "mousedown", handleClickOutside );
        };
    }, [userMenuRef, notificationMenuRef, openMenus] ); // Bağımlılıkları güncelle

    // Mobil görünüm boyutunu güncelle
    useEffect( () => {
        const handleResize = () => {
            setIsMobile( window.innerWidth < 768 );
        };

        window.addEventListener( 'resize', handleResize );
        return () => window.removeEventListener( 'resize', handleResize );
    }, [] );


    const handleLogout = async () => {
        await logout();
        navigate( '/login' );
    };

    // Tema değiştirme fonksiyonu kaldırıldı
    // const toggleTheme = () => {
    //     setTheme( theme === 'dark' ? 'light' : 'dark' );
    // };

    const toggleMainMenu = ( key ) => {
        setOpenMenus( prevState => ( { ...prevState, [key]: !prevState[key] } ) );
        setUserMenuOpen( false );
        setNotificationMenuOpen( false );
        // Ana menü açıldığında veya kapandığında alt menüleri kapat
        setOpenSubMenus({}); 
    };

    const handleMenuItemClick = ( path ) => {
        navigate( path );
        // Mobil görünümde menü öğesine tıklayınca tüm menüleri ve alt menüleri kapat
        if ( isMobile ) { 
            setOpenMenus( {} ); // Ana menüyü kapat
            setOpenSubMenus({}); // Tüm alt menüleri kapat
        } else {
            setOpenMenus( {} ); // Desktop görünümünde de ana menüyü kapat
        }
    };

    const handleMouseEnter = ( key ) => {
        if ( !isMobile ) {
            setOpenMenus( prevState => ( { ...prevState, [key]: true } ) );
        }
    };

    const handleMouseLeave = ( key ) => {
        if ( !isMobile ) {
            setOpenMenus( prevState => ( { ...prevState, [key]: false } ) );
        }
    };

    // Alt menü açma/kapama fonksiyonu
    const toggleSubMenu = (itemKey) => {
        setOpenSubMenus(prevState => ({
            ...prevState,
            [itemKey]: !prevState[itemKey],
        }));
    };

    // Saat ve tarih formatlama kaldırıldı
    // const formattedDateTime = currentDateTime.toLocaleTimeString( 'tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' } ) + ' ' + currentDateTime.toLocaleDateString( 'tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' } );

    const menuItems = [
        { path: '/dashboard', icon: FaHome, text: 'Dashboard', permission: null },
        {
            path: '/animals',
            icon: PiCowBold,
            text: 'Hayvan Yönetimi',
            permission: 'READ_ANIMAL',
            subItems: [
                { path: '/animals', text: 'Hayvan Listesi', permission: 'READ_ANIMAL' },
                { path: '/animals/groups', text: 'Hayvan Grupları', permission: 'READ_ANIMAL' },
           
                { path: '/tests', text: 'Test İşlemleri', permission: 'MANAGE_TESTS' }, // Test Yönetimi buraya taşındı
            ]
        },
        {
            path: '/finance',
            icon: FaMoneyBillWave,
            text: 'Finans Yönetimi',
            permission: 'VIEW_FINANCE',
            subItems: [
                { path: '/finance', text: 'Finans Genel Bakış', permission: 'VIEW_FINANCE' }, // İzin güncellendi
                { path: '/finance/invoices', text: 'Fatura Listesi', permission: 'VIEW_FINANCE' }, // İzin güncellendi
                { path: '/finance/payments', text: 'Ödeme Takibi', permission: 'VIEW_FINANCE' }, // İzin güncellendi
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
                { path: '/logistics/shipment-planner', icon: FaTruck, text: 'Sevkiyat Planlayıcı', permission: 'MANAGE_LOGISTICS' }, // Lojistik buraya taşındı
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

    const isActive = ( path ) => location.pathname.startsWith( path );

    // Temaya göre logo dosyasını seç
    const logoSrc = theme === 'dark' ? '/images/logo_light.png' : '/images/logo_dark.png';

    return (
        <header className="sticky top-0 bg-card border-b border-border z-30 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8">
                {/* Ana Başlık İçeriği - Mobil Düzenleme */}
                <div className="flex items-center justify-between h-16 md:justify-between"> {/* Desktopta justify-between koru */}
                    
                    {/* Mobil Menü Toggle (Sola Hizala) */}
                    {isMobile && (
                         <div className="flex items-center">
                             <div className="relative inline-block text-left" ref={menuRefs.current['mobile-menu']}> {/* Mobil menü için referans */}
                                 <button
                                     onClick={() => toggleMainMenu( 'mobile-menu' )} // Mobil menü için toggleMainMenu çağrısı
                                     className="inline-flex justify-center items-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus-ring-offset-background focus-ring-primary" // Stil iyileştirme
                                     id="main-menu-button"
                                     aria-expanded="true"
                                     aria-haspopup="true"
                                     aria-label="Mobil Menüyü Aç/Kapat"
                                 >
                                      {/* Hamburger Menü İkonu */}
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                      </svg>
                                      {/* Menü yazısı ve ok ikonu kaldırıldı */}
                                 </button>

                                 <AnimatePresence>
                                     {openMenus['mobile-menu'] && ( // Mobil menü açıksa göster
                                        <>
                                            {/* Overlay */}
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.5 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="fixed inset-0 bg-black z-40"
                                                onClick={() => toggleMainMenu('mobile-menu')} // Overlay'e tıklayınca menüyü kapat
                                            ></motion.div>

                                            {/* Mobil Kayar Menü */}
                                            <motion.div
                                                initial={{ x: '-100%' }}
                                                animate={{ x: 0 }}
                                                exit={{ x: '-100%' }}
                                                transition={{ duration: 0.3 }}
                                                className="fixed inset-y-0 left-0 w-64 bg-card shadow-lg z-50 overflow-y-auto"
                                                role="menu"
                                                aria-orientation="vertical"
                                                aria-labelledby="main-menu-button"
                                            >
                                                 <div className="flex justify-end p-4">
                                                    {/* Kapatma Butonu */}
                                                     <button
                                                         onClick={() => toggleMainMenu('mobile-menu')}
                                                         className="text-muted-foreground hover:text-foreground"
                                                         aria-label="Menüyü Kapat"
                                                     >
                                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                     </button>
                                                 </div>
                                                <div className="py-1" role="none">
                                                    {menuItems.map( ( item, index ) => {
                                                        if ( !item.permission || hasPermission( item.permission ) ) {
                                                            return (
                                                                <div key={index}>
                                                                    {item.subItems ? (
                                                                        <div className="relative"> {/* group class kaldırıldı */} 
                                                                            <button 
                                                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center justify-between" // Temaya uygun sınıflar 
                                                                                onClick={() => toggleSubMenu(index)} // Tıklayınca alt menüyü aç/kapat
                                                                            >
                                                                                <span className="flex items-center">
                                                                                    <item.icon className="mr-2 h-4 w-4" />
                                                                                    {item.text}
                                                                                </span>
                                                                                <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                                                </svg>
                                                                            </button>
                                                                            {/* Alt Menü Listesi */}
                                                                            {openSubMenus[index] && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                    transition={{ duration: 0.2 }}
                                                                                    className="bg-muted/50"
                                                                                >
                                                                                    <div className="py-1 border-t border-border" role="none">
                                                                                        {item.subItems.map( ( subItem, subIndex ) => (
                                                                                            ( !subItem.permission || hasPermission( subItem.permission ) ) && (
                                                                                                <Link
                                                                                                    key={subIndex}
                                                                                                    to={subItem.path}
                                                                                                    className="block px-8 py-2 text-sm text-foreground hover:bg-muted" // İçeriden girinti artırıldı
                                                                                                    role="menuitem"
                                                                                                    onClick={() => handleMenuItemClick( subItem.path )}
                                                                                                >
                                                                                                    {subItem.text}
                                                                                                </Link>
                                                                                            )
                                                                                        ) )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <Link
                                                                            key={index}
                                                                            to={item.path}
                                                                            className="block px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center" // Temaya uygun sınıflar
                                                                            role="menuitem"
                                                                            onClick={() => handleMenuItemClick( item.path )}
                                                                        >
                                                                            <item.icon className="mr-2 h-4 w-4 inline-block" /> {/* İkonlar eklendi */}
                                                                            {item.text}
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    } )}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                         </div>
                    )}

                    {/* Logo (Ortaya Hizala - Mobil) */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none flex items-center"> {/* Mobil ortalama, desktop normal */} 
                         <img src={logoSrc} alt="Logo" className="h-10 w-auto" /> {/* mr-4 kaldırıldı, ortalama için */}
                    </div>

                     {/* Desktop Menü */}
                     {!isMobile && (
                         <nav className="hidden lg:flex space-x-4 items-center"> {/* items-center eklendi */}
                             {menuItems.map( ( item, index ) => {
                                 if ( !item.permission || hasPermission( item.permission ) ) {
                                     const menuKey = `main-menu-${index}`;
                                     return (
                                         <div
                                             key={index}
                                             className="relative group"
                                             onMouseEnter={() => handleMouseEnter( menuKey )} // Mouse üzerine gelince aç
                                             onMouseLeave={() => handleMouseLeave( menuKey )} // Mouse ayrılınca kapat
                                             ref={el => menuRefs.current[menuKey] = el} // Referansı ata
                                         >
                                             {item.subItems ? (
                                                 <>
                                                     <button className={`text-sm font-medium px-3 py-2 rounded-md ${isActive( item.path ) ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                                                         {item.text}
                                                     </button>
                                                     <AnimatePresence>
                                                         {openMenus[menuKey] && ( // İlgili menü açıksa göster
                                                             <motion.div
                                                                 initial={{ opacity: 0, y: 10 }}
                                                                 animate={{ opacity: 1, y: 0 }}
                                                                 exit={{ opacity: 0, y: 10 }}
                                                                 transition={{ duration: 0.2 }}
                                                                 className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-card ring-1 ring-border focus:outline-none" // Temaya uygun sınıflar
                                                                 role="menu"
                                                                 aria-orientation="vertical"
                                                                 aria-labelledby={`main-menu-button-${index}`} // Unique ID
                                                             >
                                                                 <div className="py-1" role="none">
                                                                     {item.subItems.map( ( subItem, subIndex ) => (
                                                                         ( !subItem.permission || hasPermission( subItem.permission ) ) && (
                                                                             <Link
                                                                                 key={subIndex}
                                                                                 to={subItem.path}
                                                                                 className="block px-4 py-2 text-sm text-foreground hover:bg-muted" // Temaya uygun sınıflar
                                                                                 role="menuitem"
                                                                                 onClick={() => handleMenuItemClick( subItem.path )}
                                                                             >
                                                                                 {subItem.text}
                                                                             </Link>
                                                                         )
                                                                     ) )}
                                                                 </div>
                                                             </motion.div>
                                                         )}
                                                     </AnimatePresence>
                                                 </>
                                             ) : (
                                                 <Link
                                                     to={item.path}
                                                     className={`text-sm font-medium px-3 py-2 rounded-md ${isActive( item.path ) ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                                                     onClick={() => handleMenuItemClick( item.path )}
                                                 >
                                                     {item.text}
                                                 </Link>
                                             )}
                                         </div>
                                     );
                                 }
                                 return null;
                             } )}
                         </nav>
                     )}

                    {/* Sağ Taraf - Bildirimler ve Kullanıcı Menüsü */}
                    <div className="flex items-center space-x-4">
                        {/* Tema Değiştirici ve Saat/Tarih kaldırıldı */}

                        {/* Bildirimler */}
                        <div className="relative" ref={notificationMenuRef}>
                            <button
                                onClick={() => {
                                    setNotificationMenuOpen( !notificationMenuOpen );
                                    setUserMenuOpen( false );
                                    setOpenMenus( {} ); // Bildirim menüsünü açınca tüm ana menüleri kapat
                                }}
                                className="p-2 rounded-md hover:bg-secondary/50"
                            >
                                <Badge badgeContent={notificationCount} color="primary">
                                    <IoMdNotificationsOutline className="w-6 h-6 text-primary" />
                                </Badge>
                            </button>

                            {/* Bildirim Menüsü */}
                            <AnimatePresence>
                                {notificationMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-border"
                                    >
                                        <div className="p-3 border-b border-border">
                                            <h3 className="text-sm font-medium">Bildirimler</h3>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            <div className="p-3 hover:bg-muted flex items-start border-b border-border">
                                                <div className="mr-2 mt-0.5">
                                                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm">Yeni hayvanlar sisteme eklendi</p>
                                                    <p className="text-xs text-muted-foreground">2 saat önce</p>
                                                </div>
                                            </div>
                                            <div className="p-3 hover:bg-muted flex items-start">
                                                <div className="mr-2 mt-0.5">
                                                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm">Test sonuçları güncellendi</p>
                                                    <p className="text-xs text-muted-foreground">3 saat önce</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 text-center border-t border-border">
                                            <button className="text-xs text-primary hover:text-primary/80">
                                                Tüm bildirimleri gör
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Kullanıcı Menüsü */}
                        <div className="relative inline-flex" ref={userMenuRef}>
                            <button
                                onClick={() => {
                                    setUserMenuOpen( !userMenuOpen );
                                    setNotificationMenuOpen( false );
                                    setOpenMenus( {} ); // Kullanıcı menüsünü açınca tüm ana menüleri kapat
                                }}
                                className="flex items-center space-x-2 rounded-md hover:bg-secondary/50 p-1"
                            >
                                <FaUserCircle className="w-8 h-8 text-primary" />
                                <div className="hidden md:flex flex-col text-left">
                                    <span className="text-sm font-medium">{user?.username || user?.email}</span>
                                    <span className="text-xs text-muted-foreground">{user?.role || 'Kullanıcı'}</span>
                                </div>
                            </button>

                            {/* Kullanıcı Dropdown Menüsü */}
                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-border"
                                    >
                                        <div className="p-3 border-b border-border">
                                            <p className="text-sm font-medium">{user?.username || user?.email}</p>
                                            <p className="text-xs text-muted-foreground">{user?.role || 'Kullanıcı'}</p>
                                        </div>
                                        <div className="py-1">
                                            <button onClick={() => navigate( '/profile' )} className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center">
                                                <FaUserAlt className="mr-2 h-4 w-4" />
                                                Profilim
                                            </button>
                                            <button onClick={() => navigate( '/settings' )} className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center">
                                                <FaCog className="mr-2 h-4 w-4" />
                                                Ayarlar
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted flex items-center"
                                            >
                                                <FaSignOutAlt className="mr-2 h-4 w-4" />
                                                Çıkış Yap
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
