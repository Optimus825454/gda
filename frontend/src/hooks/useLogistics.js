/**
 * useLogistics.js - Lojistik operasyonları için özel hook
 */

import { useContext } from 'react';
import LogisticsContext from '../contexts/LogisticsContext';

const useLogistics = () => {
    const context = useContext( LogisticsContext );

    if ( !context ) {
        throw new Error( 'useLogistics hook\'u LogisticsProvider içinde kullanılmalıdır' );
    }

    const {
        operations,
        shipments,
        loading,
        error,
        stats,
        createOperation,
        createShipment,
        updateOperationStatus,
        updateShipmentStatus,
        updateEnvironmentalData,
        loadOperations,
        loadShipments,
        loadStats
    } = context;

    // Operasyon yardımcı fonksiyonları
    const getActiveOperations = () => {
        return operations.filter( op => op.status === 'ISLEMDE' );
    };

    const getPendingOperations = () => {
        return operations.filter( op => op.status === 'BEKLEMEDE' );
    };

    const getCompletedOperations = () => {
        return operations.filter( op => op.status === 'TAMAMLANDI' );
    };

    const getOperationsByType = ( type ) => {
        return operations.filter( op => op.processType === type );
    };

    // Sevkiyat yardımcı fonksiyonları
    const getActiveShipments = () => {
        return shipments.filter( ship =>
            ship.status === 'YUKLENIYOR' || ship.status === 'YOLDA'
        );
    };

    const getPendingShipments = () => {
        return shipments.filter( ship => ship.status === 'PLANLANMIS' );
    };

    const getCompletedShipments = () => {
        return shipments.filter( ship => ship.status === 'TESLIM_EDILDI' );
    };

    const getShipmentsByVehicleType = ( type ) => {
        return shipments.filter( ship => ship.vehicleType === type );
    };

    // İstatistik yardımcı fonksiyonları
    const getOperationStats = () => {
        if ( !stats ) return null;
        return stats.operations;
    };

    const getShipmentStats = () => {
        if ( !stats ) return null;
        return stats.shipments;
    };

    // Sıralama yardımcı fonksiyonları
    const sortOperationsByPriority = ( operationList ) => {
        return [...operationList].sort( ( a, b ) => b.priority - a.priority );
    };

    const sortShipmentsByPriority = ( shipmentList ) => {
        return [...shipmentList].sort( ( a, b ) => b.priority - a.priority );
    };

    // Filtreleme yardımcı fonksiyonları
    const filterOperationsByDateRange = ( startDate, endDate ) => {
        return operations.filter( op => {
            const opDate = new Date( op.startDate );
            return opDate >= startDate && opDate <= endDate;
        } );
    };

    const filterShipmentsByDateRange = ( startDate, endDate ) => {
        return shipments.filter( ship => {
            const shipDate = new Date( ship.plannedDepartureTime );
            return shipDate >= startDate && shipDate <= endDate;
        } );
    };

    // Çevresel veri yardımcı fonksiyonları
    const checkTemperatureAlerts = () => {
        const alerts = [];

        operations.forEach( op => {
            if ( op.temperature < -5 || op.temperature > 5 ) {
                alerts.push( {
                    type: 'operation',
                    id: op.id,
                    temperature: op.temperature,
                    message: 'Sıcaklık limitlerin dışında'
                } );
            }
        } );

        shipments.forEach( ship => {
            if ( ship.temperature < -5 || ship.temperature > 5 ) {
                alerts.push( {
                    type: 'shipment',
                    id: ship.id,
                    temperature: ship.temperature,
                    message: 'Sıcaklık limitlerin dışında'
                } );
            }
        } );

        return alerts;
    };

    const checkHumidityAlerts = () => {
        return shipments.filter( ship =>
            ship.humidity < 0 || ship.humidity > 100
        ).map( ship => ( {
            id: ship.id,
            humidity: ship.humidity,
            message: 'Nem oranı limitlerin dışında'
        } ) );
    };

    return {
        // Context state ve ana fonksiyonlar
        operations,
        shipments,
        loading,
        error,
        stats,
        createOperation,
        createShipment,
        updateOperationStatus,
        updateShipmentStatus,
        updateEnvironmentalData,
        loadOperations,
        loadShipments,
        loadStats,

        // Operasyon yardımcı fonksiyonları
        getActiveOperations,
        getPendingOperations,
        getCompletedOperations,
        getOperationsByType,

        // Sevkiyat yardımcı fonksiyonları
        getActiveShipments,
        getPendingShipments,
        getCompletedShipments,
        getShipmentsByVehicleType,

        // İstatistik yardımcı fonksiyonları
        getOperationStats,
        getShipmentStats,

        // Sıralama yardımcı fonksiyonları
        sortOperationsByPriority,
        sortShipmentsByPriority,

        // Filtreleme yardımcı fonksiyonları
        filterOperationsByDateRange,
        filterShipmentsByDateRange,

        // Çevresel veri yardımcı fonksiyonları
        checkTemperatureAlerts,
        checkHumidityAlerts
    };
};

export default useLogistics;