import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig'; // Axios instance'ını import et

const SettingContext = createContext();

export function SettingProvider( { children } ) {
    const [settings, setSettings] = useState( [] ); // Tüm ayarlar
    const [settingsByKey, setSettingsByKey] = useState( {} ); // Anahtara göre hızlı erişim için
    const [groups, setGroups] = useState( [] ); // Ayar grupları
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState( false ); // Yeni durum

    // Tüm ayarları ve grupları getir
    const fetchSettings = useCallback( async () => {
        setLoading( true );
        setError( null );
        try {
            const [settingsResponse, groupsResponse] = await Promise.all( [
                axiosInstance.get( '/settings' ), // API endpoint'i varsayımsal
                axiosInstance.get( '/settings/groups' ) // API endpoint'i varsayımsal
            ] );

            const fetchedSettings = settingsResponse.data?.data || settingsResponse.data || [];
            setSettings( fetchedSettings );

            // Ayarları anahtara göre map'le
            const byKey = fetchedSettings.reduce( ( acc, setting ) => {
                acc[setting.key] = setting;
                return acc;
            }, {} );
            setSettingsByKey( byKey );

            setGroups( groupsResponse.data?.data || groupsResponse.data || [] );

        } catch ( err ) {
            console.error( "Error fetching settings:", err );
            if ( err.response && err.response.status === 403 ) {
                setError( 'Ayarları görüntüleme izniniz yok.' );
            } else if ( err.code === 'ECONNABORTED' ) { // Zaman aşımı hatası kontrolü eklendi
                setError( 'Ayarlar alınırken zaman aşımı oluştu. Lütfen ağ bağlantınızı kontrol edin veya daha sonra tekrar deneyin.' );
            }
            else {
                setError( err.response?.data?.message || 'Ayarlar getirilemedi.' );
            }
            setSettings( [] );
            setSettingsByKey( {} );
            setGroups( [] );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Ayarları toplu güncelle
    const bulkUpdateSettings = useCallback( async ( updatedSettings ) => {
        setLoading( true );
        setError( null );
        try {
            // Sadece değişen ayarları gönder
            const changes = updatedSettings.filter( updated => {
                const original = settingsByKey[updated.key];
                return original && original.value !== updated.value;
            } ).map( s => ( { key: s.key, value: s.value } ) ); // Sadece key ve value gönder

            if ( changes.length === 0 ) {
                setLoading( false );
                return true; // Değişiklik yok
            }

            const response = await axiosInstance.post( '/settings/bulk-update', { settings: changes } ); // API endpoint'i varsayımsal

            // Başarılı olursa state'i güncelle (veya yeniden fetch et)
            await fetchSettings(); // En güncel hali almak için yeniden fetch etmek daha güvenli
            return response.data;

        } catch ( err ) {
            console.error( "Error bulk updating settings:", err );
            setError( err.response?.data?.message || 'Ayarlar güncellenemedi.' );
            return false;
        } finally {
            setLoading( false );
        }
    }, [settingsByKey, fetchSettings] );

    // Belirli bir ayarın değerini al
    const getSettingValue = useCallback( ( key, defaultValue = null ) => {
        return settingsByKey[key]?.value ?? defaultValue;
    }, [settingsByKey] );

    // Context başlangıcında ayarları yükle
    useEffect( () => {
        if ( !isInitialLoadComplete ) { // Yalnızca ilk yüklemede çalıştır
            console.log( '[SettingContext] Initial fetch started.' );
            // Her iki işlemi paralel başlat
            fetchSettings().then( () => {
                setIsInitialLoadComplete( true ); // Yükleme tamamlandı olarak işaretle
                console.log( '[SettingContext] Initial fetch completed.' );
            } ).catch( ( err ) => {
                setIsInitialLoadComplete( true ); // Hata olsa bile tekrar denememek için tamamlandı say
                console.error( '[SettingContext] Initial fetch failed:', err );
            } );
        } else {
            console.log( '[SettingContext] Data already loaded, skipping initial fetch.' );
        }
    }, [fetchSettings, isInitialLoadComplete] ); // isInitialLoadComplete dependency olarak eklendi

    const value = {
        settings,
        settingsByKey,
        groups,
        loading,
        error,
        fetchSettings,
        bulkUpdateSettings,
        getSettingValue,
    };

    return <SettingContext.Provider value={value}>{children}</SettingContext.Provider>;
}

// Hook to use the Setting context
export function useSetting() {
    const context = useContext( SettingContext );
    if ( context === undefined ) {
        throw new Error( 'useSetting must be used within a SettingProvider' );
    }
    return context;
}
