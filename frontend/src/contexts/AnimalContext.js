import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { supabase } from '../supabaseClient'; // Supabase import'u eklendi
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// API_BASE_URL'yi kaldırıyoruz, axiosInstance zaten baseURL ayarını içeriyor

const AnimalContext = createContext();

export function AnimalProvider( { children } ) {
    const [animals, setAnimals] = useState( [] );
    const [constants, setConstants] = useState( null );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );
    const { token } = useAuth();

    // Tüm hayvanları getir
    const fetchAnimals = useCallback( async () => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( '/animals' );
            console.log('API yanıtı - hayvanlar:', response.data);
            
            if (response.data.success === false) {
                throw new Error(response.data.message || 'Hayvanlar getirilemedi');
            }
            
            // Veri formatını kontrol et ve işle
            const animalData = response.data.data || response.data || [];
            setAnimals(Array.isArray(animalData) ? animalData : []);
            setError( null );
        } catch ( err ) {
            const errorMessage = err.response?.data?.message || err.message || 'Hayvanlar yüklenirken hata oluştu';
            setError(errorMessage);
            console.error('Hayvanlar yüklenirken hata:', err);
            setAnimals([]);
        } finally {
            setLoading( false );
        }
    }, [] );

    // Kategoriye göre hayvanları getir
    const fetchAnimalsByCategory = useCallback( async ( category ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( `/animals/category/${category}` );
            console.log('Kategori yanıtı:', response.data);
            const animalData = response.data.data || response.data || [];
            setAnimals(Array.isArray(animalData) ? animalData : []);
            setError( null );
        } catch ( err ) {
            setError( 'Kategoriye göre hayvanlar yüklenirken hata oluştu' );
            console.error( 'Kategoriye göre hayvanlar yüklenirken hata:', err );
            setAnimals([]);
        } finally {
            setLoading( false );
        }
    }, [] );

    // Test sonucuna göre hayvanları getir
    const fetchAnimalsByTestResult = useCallback( async ( result ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( `/animals/test-result/${result}` );
            setAnimals( response.data );
            setError( null );
        } catch ( err ) {
            setError( 'Test sonucuna göre hayvanlar yüklenirken hata oluştu' );
            console.error( 'Test sonucuna göre hayvanlar yüklenirken hata:', err );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Hedef şirkete göre hayvanları listeler
    const fetchAnimalsByDestination = useCallback( async ( company ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( `/animals/destination/${company}` );
            setAnimals( response.data.data || response.data );
            setError( null );
        } catch ( err ) {
            setError( 'Hedef şirkete göre hayvanlar yüklenirken hata oluştu' );
            console.error( 'Hedef şirkete göre hayvanlar yüklenirken hata:', err );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Satış durumuna göre hayvanları listeler
    const fetchAnimalsBySaleStatus = useCallback( async ( status ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( `/animals/sale-status/${status}` );
            setAnimals( response.data.data || response.data );
            setError( null );
        } catch ( err ) {
            setError( 'Satış durumuna göre hayvanlar yüklenirken hata oluştu' );
            console.error( 'Satış durumuna göre hayvanlar yüklenirken hata:', err );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Test sonucu kaydet
    const recordTestResult = useCallback( async ( animalId, testData ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.post(
                `/animals/${animalId}/test-result`,
                testData
            );
            await fetchAnimals(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            setError( 'Test sonucu kaydedilirken hata oluştu' );
            console.error( 'Test sonucu kaydedilirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchAnimals] );

    // Satış işlemini tamamla
    const completeSale = useCallback( async ( animalId, price ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.post(
                `/animals/${animalId}/complete-sale`,
                { price }
            );
            await fetchAnimals(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            setError( 'Satış işlemi tamamlanırken hata oluştu' );
            console.error( 'Satış işlemi tamamlanırken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchAnimals] );

    // Raporları getir
    const fetchReports = useCallback( async () => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( '/animals/reports' );
            console.log('Raporlar yanıtı:', response.data);
            setError( null );
            return response.data.data || response.data;
        } catch ( err ) {
            const errorMessage = err.response?.data?.error || 'Raporlar yüklenirken hata oluştu';
            setError( errorMessage );
            console.error( 'Raporlar yüklenirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [] );

    // İstatistik alma fonksiyonu
    const getAnimalStats = useCallback( async () => {
        try {
            // Tüm hayvanları çek
            const { data: animals, error } = await supabase
                .from( 'animals' )
                .select( `
                    *,
                    tests (
                        id,
                        status,
                        result
                    ),
                    sales (
                        id,
                        sale_type,
                        status
                    )
                `);

            if ( error ) throw error;

            // İstatistikleri hesapla
            const stats = {
                total: animals.length,
                kesimlik: {
                    bekleyen: animals.filter( a => a.purpose === 'KESIMLIK' && !a.sales?.length ).length,
                    sevkEdilen: animals.filter( a => a.purpose === 'KESIMLIK' && a.sales?.[0]?.status === 'SEVK_EDILDI' ).length,
                    tamamlanan: animals.filter( a => a.purpose === 'KESIMLIK' && a.sales?.[0]?.status === 'TAMAMLANDI' ).length
                },
                damizlik: {
                    hazir: animals.filter( a => a.purpose === 'DAMIZLIK' && !a.sales?.length ).length,
                    satilan: animals.filter( a => a.purpose === 'DAMIZLIK' && a.sales?.[0]?.status === 'TAMAMLANDI' ).length
                },
                testDurumu: {
                    bekleyen: animals.filter( a => a.tests?.some( t => t.status === 'BEKLIYOR' ) ).length,
                    tamamlanan: animals.filter( a => a.tests?.every( t => t.status === 'TAMAMLANDI' ) ).length
                }
            };

            setError( null );
            return stats;

        } catch ( error ) {
            console.error( 'İstatistik alma hatası:', error.message );
            throw error;
        } finally {
            setLoading( false );
        }
    }, [] );

    // Toplu hayvan ekleme
    const bulkCreateAnimals = async (animalsData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/v1/animals/bulk-import`,
                { animals: animalsData },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Hayvan listesini yenile
            fetchAnimals();
            
            return {
                success: response.data.success || 0,
                failed: response.data.failed || 0,
                messages: response.data.messages || []
            };
        } catch (err) {
            console.error('Toplu hayvan içe aktarma hatası:', err);
            setError('Hayvanlar içe aktarılırken bir hata oluştu');
            
            // API hatası durumunda daha detaylı hata mesajı
            const errorMessage = err.response?.data?.error || 'İçe aktarma işlemi başarısız oldu';
            toast.error(errorMessage);
            
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const contextValue = {
        animals,
        constants,
        loading,
        error,
        fetchAnimals,
        fetchAnimalsByCategory,
        fetchAnimalsByTestResult,
        fetchAnimalsByDestination,
        fetchAnimalsBySaleStatus,
        recordTestResult,
        completeSale,
        fetchReports,
        getAnimalStats,
        bulkCreateAnimals
    };

    return (
        <AnimalContext.Provider value={contextValue}>
            {children}
        </AnimalContext.Provider>
    );
}

export function useAnimal() {
    const context = useContext(AnimalContext);
    if (!context) {
        throw new Error('useAnimal must be used within a AnimalProvider');
    }
    return context;
}

export default AnimalContext;