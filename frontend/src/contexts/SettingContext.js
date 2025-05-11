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

    // API çağrıları kaldırıldığı için fetch fonksiyonları ve ilgili state'ler kaldırıldı
    // Varsayılan boş değerler kullanılacak

    // Context başlangıcında ayarları yükleme useEffect'i kaldırıldı
    useEffect( () => {
        // API çağrıları kaldırıldığı için burada herhangi bir işlem yapmaya gerek yok
        setLoading( false ); // Yükleme durumunu false yap
        setIsInitialLoadComplete( true ); // İlk yüklemeyi tamamlandı olarak işaretle
    }, [] );

    // Belirli bir ayarın değerini alma fonksiyonu (artık settingsByKey boş olacağı için her zaman defaultValue dönecek)
    const getSettingValue = useCallback( ( key, defaultValue = null ) => {
        console.warn( `[SettingContext] getSettingValue çağrıldı ancak API çağrıları devre dışı. Anahtar: ${key}, Varsayılan Değer: ${defaultValue}` );
        return defaultValue;
    }, [] );


    const value = {
        settings: [], // API çağrıları kaldırıldığı için boş dizi
        settingsByKey: {}, // API çağrıları kaldırıldığı için boş obje
        groups: [], // API çağrıları kaldırıldığı için boş dizi
        loading,
        error: null, // API çağrıları kaldırıldığı için hata null
        // fetchSettings ve bulkUpdateSettings fonksiyonları kaldırıldı
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
