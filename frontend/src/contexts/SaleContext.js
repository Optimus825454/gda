import { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SaleContext = createContext();

export function SaleProvider( { children } ) {
    const [sales, setSales] = useState( [] );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );

    // Satış kayıtlarını getir
    const fetchSales = useCallback( async ( filters = {} ) => {
        setLoading( true );
        try {
            // Boş filtreleri gönderme
            const cleanFilters = Object.fromEntries(
                Object.entries( filters ).filter( ( [_, v] ) => v !== undefined && v !== null && v !== '' )
            );
            const params = new URLSearchParams( cleanFilters ).toString();
            const response = await axiosInstance.get( `${API_BASE_URL}/sales${params ? `?${params}` : ''}` );
            setSales( response.data.data || response.data );
            setError( null );
        } catch ( err ) {
            setError( 'Satış kayıtları yüklenirken hata oluştu' );
            console.error( 'Satış kayıtları yüklenirken hata:', err );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Bekleyen satışları getir
    const fetchPendingSales = useCallback( async () => {
        setLoading( true );
        try {
            const response = await axiosInstance.get( `${API_BASE_URL}/sales/pending` );
            setSales( response.data.data );
            setError( null );
        } catch ( err ) {
            setError( 'Bekleyen satışlar yüklenirken hata oluştu' );
            console.error( 'Bekleyen satışlar yüklenirken hata:', err );
        } finally {
            setLoading( false );
        }
    }, [] );

    // Satış kaydı oluştur
    const createSale = useCallback( async ( saleData ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.post( `${API_BASE_URL}/sales`, saleData );
            await fetchSales(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            setError( 'Satış kaydı oluşturulurken hata oluştu' );
            console.error( 'Satış kaydı oluşturulurken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchSales] );

    // Toplu satış kaydet
    const bulkCreateSales = useCallback( async ( salesData ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.post( `${API_BASE_URL}/sales/bulk`, salesData );
            await fetchSales(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            setError( 'Toplu satış kaydı oluşturulurken hata oluştu' );
            console.error( 'Toplu satış kaydı oluşturulurken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchSales] );

    // Satış istatistiklerini getir
    const fetchSaleStatistics = useCallback( async () => {
        try {
            const response = await axiosInstance.get( '/sales/statistics' );
            // Backend yanıtı: { success: true, data: [...] } formatında
            if ( response.data && response.data.success && Array.isArray( response.data.data ) ) {
                return response.data.data; // Doğrudan veri dizisini dön
            } else {
                console.error( 'Beklenmeyen API yanıt formatı:', response.data );
                // Varsayılan değerler döndür
                return [
                    {
                        sale_type: 'DAMIZLIK',
                        status: 'BEKLEMEDE',
                        count: 0,
                        sum: 0
                    },
                    {
                        sale_type: 'KESIM',
                        status: 'BEKLEMEDE',
                        count: 0,
                        sum: 0
                    },
                    {
                        sale_type: 'DAMIZLIK',
                        status: 'TAMAMLANDI',
                        count: 0,
                        sum: 0
                    },
                    {
                        sale_type: 'KESIM',
                        status: 'TAMAMLANDI',
                        count: 0,
                        sum: 0
                    }
                ];
            }
        } catch ( error ) {
            console.error( 'Satış istatistikleri yüklenirken hata:', error );
            // Hata durumunda varsayılan değerler döndür
            return [
                {
                    sale_type: 'DAMIZLIK',
                    status: 'BEKLEMEDE',
                    count: 0,
                    sum: 0
                },
                {
                    sale_type: 'KESIM',
                    status: 'BEKLEMEDE',
                    count: 0,
                    sum: 0
                },
                {
                    sale_type: 'DAMIZLIK',
                    status: 'TAMAMLANDI',
                    count: 0,
                    sum: 0
                },
                {
                    sale_type: 'KESIM',
                    status: 'TAMAMLANDI',
                    count: 0,
                    sum: 0
                }
            ];
        }
    }, [] );

    // Satış durumunu güncelle
    const updateSaleStatus = useCallback( async ( saleId, status ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.put( `${API_BASE_URL}/sales/${saleId}/status`, { status } );
            await fetchSales(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            setError( 'Satış durumu güncellenirken hata oluştu' );
            console.error( 'Satış durumu güncellenirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchSales] );

    // Satış detaylarını güncelle
    const updateSaleDetails = useCallback( async ( saleId, updates ) => {
        setLoading( true );
        try {
            const response = await axiosInstance.put( `${API_BASE_URL}/sales/${saleId}`, updates );
            await fetchSales(); // Listeyi güncelle
            setError( null );
            return response.data;
        } catch ( err ) {
            setError( 'Satış detayları güncellenirken hata oluştu' );
            console.error( 'Satış detayları güncellenirken hata:', err );
            throw err;
        } finally {
            setLoading( false );
        }
    }, [fetchSales] );

    const contextValue = {
        sales,
        loading,
        error,
        fetchSales,
        fetchPendingSales,
        createSale,
        bulkCreateSales,
        fetchSaleStatistics,
        updateSaleStatus,
        updateSaleDetails
    };

    return (
        <SaleContext.Provider value={contextValue}>
            {children}
        </SaleContext.Provider>
    );
}

export function useSale() {
    const context = useContext( SaleContext );
    if ( !context ) {
        throw new Error( 'useSale must be used within a SaleProvider' );
    }
    return context;
}

export default SaleContext;