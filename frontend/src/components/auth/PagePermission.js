/**
 * PagePermission.js - Sayfa görüntüleme izinlerini kontrol eden bileşen * ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Belirli bir izne sahip kullanıcıların sayfayı görüntülemesini sağlar
 * ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
 * 
 * @param {Object} props
 * @param {string} props.permissionCode - Gerekli izin kodu (ör. VIEW_ANIMALS_PAGE)
 * @param {React.ReactNode} props.children - Korunan içerik
 * @param {string} [props.fallbackPath='/dashboard'] - İzin yoksa yönlendirilecek sayfa
 */
const PagePermission = ({ permissionCode, children, fallbackPath = '/dashboard' }) => {
    const { user, loading } = useAuth();
    
    // Yükleme durumunda bekletme ekranı göster
    if (loading) {
        return <div className="loading-container">Yükleniyor...</div>;
    }
    
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // ROL BAZLI KONTROL DEVRE DIŞI - TÜM KULLANICILAR TAM YETKİLİ
    // Kullanıcı giriş yapmışsa her zaman erişim izni var
    return <>{children}</>;
};

export default PagePermission;