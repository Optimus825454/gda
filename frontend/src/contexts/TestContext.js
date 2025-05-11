import { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';

// API_BASE_URL'yi doğrudan '/api' olarak değiştirdim
// axiosInstance zaten baseURL ayarlanmış olduğu için buna gerek yok
const API_BASE_URL = '/api';

const TestContext = createContext();

export function TestProvider( { children } ) {
    const [tests, setTests] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );

    // Test kayıtlarını getir
    const fetchTests = useCallback( async ( filters = {} ) => {
        setLoading( true );
        try {
            const params = new URLSearchParams( filters ).toString();
            const response = await axiosInstance.get( `${API_BASE_URL}/tests${params ? `?${params}` : ''}` );
            console.log( 'Test yanıtı:', response.data );

            const testData = response.data.data || response.data || [];
            setTests( Array.isArray( testData ) ? testData : [] );
            setError( null );
        } catch ( err ) {
            const errorMessage = err.response?.data?.message || err.message || 'Test kayıtları yüklenirken hata oluştu';
            setError( errorMessage );
            console.error( 'Test kayıtları yüklenirken hata:', err );
            setTests( [] );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Bekleyen testleri getir
    const fetchPendingTests = useCallback( async () => {
        try {
            // Pending endpoint kaldırıldı, yerine başka bir endpoint eklenebilir
            // const response = await axiosInstance.get( `${API_BASE_URL}/tests/pending` );
            // const pendingTests = response.data.data || response.data || [];
            // setTests( Array.isArray( pendingTests ) ? pendingTests : [] );
            setTests( [] ); // Şimdilik boş liste döndürüyoruz
        } catch ( err ) {
            console.error( 'Bekleyen testler yüklenirken hata:', err );
            setError( err.message || 'Bekleyen testler yüklenemedi' );
            setTests( [] );
        }
    }, [] );

    // Test sonucu kaydet
    const createTest = useCallback( async ( testData ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.post( `${API_BASE_URL}/tests`, testData );
            console.log( 'Test oluşturma yanıtı:', response.data );
            await fetchTests(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            const errorMessage = err.response?.data?.message || err.message || 'Test sonucu kaydedilirken hata oluştu';
            setError( errorMessage );
            console.error( 'Test sonucu kaydedilirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchTests] );

    // Toplu test sonucu kaydet
    const bulkCreateTests = useCallback( async ( testResults ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.post( `${API_BASE_URL}/tests/bulk`, testResults );
            console.log( 'Toplu test oluşturma yanıtı:', response.data );
            await fetchTests(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            const errorMessage = err.response?.data?.message || err.message || 'Toplu test sonuçları kaydedilirken hata oluştu';
            setError( errorMessage );
            console.error( 'Toplu test sonuçları kaydedilirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchTests] );

    // Test istatistiklerini getir
    const fetchTestStatistics = useCallback( async () => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( `${API_BASE_URL}/tests/statistics` );
            console.log( 'Test istatistikleri yanıtı:', response.data );
            setError( null );
            return response.data.data || response.data;
        } catch ( err ) {
            const errorMessage = err.response?.data?.message || err.message || 'Test istatistikleri yüklenirken hata oluştu';
            setError( errorMessage );
            console.error( 'Test istatistikleri yüklenirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [] );

    // Test durumunu güncelle
    const updateTestStatus = useCallback( async ( testId, status ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.put( `${API_BASE_URL}/tests/${testId}/status`, { status } );
            console.log( 'Test durumu güncelleme yanıtı:', response.data );
            await fetchTests(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            const errorMessage = err.response?.data?.message || err.message || 'Test durumu güncellenirken hata oluştu';
            setError( errorMessage );
            console.error( 'Test durumu güncellenirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchTests] );

    const contextValue = {
        tests,
        loading,
        error,
        fetchTests,
        fetchPendingTests,
        createTest,
        bulkCreateTests,
        fetchTestStatistics,
        updateTestStatus
    };

    return (
        <TestContext.Provider value={contextValue}>
            {children}
        </TestContext.Provider>
    );
}

export function useTest() {
    const context = useContext( TestContext );
    if ( !context ) {
        throw new Error( 'useTest must be used within a TestProvider' );
    }
    return context;
}

export default TestContext;