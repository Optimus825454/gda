import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    // Dashboard verilerini getir
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axiosInstance.get('/dashboard/data');
            setDashboardData(response.data?.data || null);
        } catch (error) {
            console.error('Dashboard verileri alınırken hata:', error);
            setError('Dashboard verileri alınamadı');
        } finally {
            setLoading(false);
        }
    }, []);

    // Son aktiviteleri getir
    const fetchActivities = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/dashboard/activities');
            setActivities(response.data?.data || []);
        } catch (error) {
            console.error('Aktiviteler alınırken hata:', error);
        }
    }, []);

    // Sayfa yüklendiğinde verileri getir
    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData();
            fetchActivities();
        }
    }, [isAuthenticated, fetchDashboardData, fetchActivities]);

    const value = {
        dashboardData,
        activities,
        loading,
        error,
        fetchDashboardData,
        fetchActivities
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}

export default DashboardContext; 