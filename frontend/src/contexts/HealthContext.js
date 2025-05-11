import React, { createContext, useState, useContext, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig'; // Axios instance'ını import et

const HealthContext = createContext();

export function HealthProvider( { children } ) {
    const [healthRecords, setHealthRecords] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );

    // Tüm sağlık kayıtlarını getir
    const fetchHealthRecords = useCallback( async ( filters = {} ) => {
        setLoading( true );
        setError( null );
        try {
            // Filtreleri query string'e çevir (örnek)
            const params = new URLSearchParams( filters ).toString();
            const response = await axiosInstance.get( `/health${params ? `?${params}` : ''}` ); // API endpoint'i varsayımsal
            setHealthRecords( response.data || [] );
        } catch ( err ) {
            console.error( "Error fetching health records:", err );
            setError( err.response?.data?.message || 'Sağlık kayıtları getirilemedi.' );
            setHealthRecords( [] ); // Hata durumunda listeyi temizle
        } finally {
            setLoading( false );
        }
    }, [] );

    // ID ile sağlık kaydı getir
    const getHealthRecordById = useCallback( async ( id ) => {
        setLoading( true );
        setError( null );
        try {
            const response = await axiosInstance.get( `/health/${id}` ); // API endpoint'i varsayımsal
            return response.data;
        } catch ( err ) {
            console.error( `Error fetching health record ${id}:`, err );
            setError( err.response?.data?.message || 'Sağlık kaydı getirilemedi.' );
            return null;
        } finally {
            setLoading( false );
        }
    }, [] );

    // Yeni sağlık kaydı oluştur
    const createHealthRecord = useCallback( async ( recordData ) => {
        setLoading( true );
        setError( null );
        try {
            const response = await axiosInstance.post( '/health', recordData ); // API endpoint'i varsayımsal
            // Başarılı olursa listeyi yenilemek iyi olabilir
            // fetchHealthRecords(); // Veya sadece eklenen kaydı state'e ekle
            setHealthRecords( prev => [...prev, response.data] );
            return response.data;
        } catch ( err ) {
            console.error( "Error creating health record:", err );
            setError( err.response?.data?.message || 'Sağlık kaydı oluşturulamadı.' );
            return null;
        } finally {
            setLoading( false );
        }
    }, [/* fetchHealthRecords */] );

    // Sağlık kaydını güncelle
    const updateHealthRecord = useCallback( async ( id, recordData ) => {
        setLoading( true );
        setError( null );
        try {
            const response = await axiosInstance.put( `/health/${id}`, recordData ); // API endpoint'i varsayımsal
            // Başarılı olursa listeyi güncelle
            setHealthRecords( prev =>
                prev.map( record => ( record.id === id ? response.data : record ) )
            );
            return response.data;
        } catch ( err ) {
            console.error( `Error updating health record ${id}:`, err );
            setError( err.response?.data?.message || 'Sağlık kaydı güncellenemedi.' );
            return null;
        } finally {
            setLoading( false );
        }
    }, [] );

    // Sağlık kaydını sil
    const deleteHealthRecord = useCallback( async ( id ) => {
        setLoading( true );
        setError( null );
        try {
            await axiosInstance.delete( `/health/${id}` ); // API endpoint'i varsayımsal
            // Başarılı olursa listeden kaldır
            setHealthRecords( prev => prev.filter( record => record.id !== id ) );
            return true;
        } catch ( err ) {
            console.error( `Error deleting health record ${id}:`, err );
            setError( err.response?.data?.message || 'Sağlık kaydı silinemedi.' );
            return false;
        } finally {
            setLoading( false );
        }
    }, [] );


    const value = {
        healthRecords,
        loading,
        error,
        fetchHealthRecords,
        getHealthRecordById,
        createHealthRecord,
        updateHealthRecord,
        deleteHealthRecord,
    };

    return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

// Hook to use the Health context
export function useHealth() {
    const context = useContext( HealthContext );
    if ( context === undefined ) {
        throw new Error( 'useHealth must be used within a HealthProvider' );
    }
    return context;
}
