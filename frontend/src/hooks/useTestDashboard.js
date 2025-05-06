import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

const useTestDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/tests/dashboard');
            
            if (response.data?.success) {
                setDashboardData(response.data.data);
                setError(null);
            } else {
                throw new Error('Veriler alınamadı');
            }
        } catch (error) {
            console.error('Dashboard verileri alınırken hata:', error);
            setError('Dashboard verileri alınırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Her 5 dakikada bir güncelle
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    return {
        dashboardData,
        loading,
        error,
        refetch: fetchDashboardData
    };
};

export default useTestDashboard; 