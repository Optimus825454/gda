/**
 * Dashboard.js - Lojistik operasyonları kontrol paneli
 */

import React, { useEffect } from 'react';
import { useLogistics } from '../../hooks/useLogistics';
import { Card, CardContent, Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Dashboard = () => {
    const {
        loading,
        error,
        stats,
        getActiveOperations,
        getActiveShipments,
        checkTemperatureAlerts,
        checkHumidityAlerts,
        loadStats
    } = useLogistics();

    useEffect( () => {
        loadStats();
    }, [] );

    if ( loading ) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if ( error ) {
        return (
            <Alert severity="error">
                Veri yüklenirken bir hata oluştu: {error}
            </Alert>
        );
    }

    const activeOperations = getActiveOperations();
    const activeShipments = getActiveShipments();
    const temperatureAlerts = checkTemperatureAlerts();
    const humidityAlerts = checkHumidityAlerts();

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                GDA FlowSystems Operasyon Paneli
            </Typography>

            <Grid container spacing={3}>
                {/* Aktif Operasyonlar */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                <WarehouseIcon sx={{ mr: 1 }} />
                                Aktif Operasyonlar
                            </Typography>
                            <Typography variant="h3">
                                {activeOperations.length}
                            </Typography>
                            <Box mt={2}>
                                {activeOperations.map( op => (
                                    <Box key={op.id} my={1}>
                                        <Typography variant="body2">
                                            Parti No: {op.batchNumber} - {op.processType}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Sıcaklık: {op.temperature}°C
                                        </Typography>
                                    </Box>
                                ) )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Aktif Sevkiyatlar */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                <LocalShippingIcon sx={{ mr: 1 }} />
                                Aktif Sevkiyatlar
                            </Typography>
                            <Typography variant="h3">
                                {activeShipments.length}
                            </Typography>
                            <Box mt={2}>
                                {activeShipments.map( ship => (
                                    <Box key={ship.id} my={1}>
                                        <Typography variant="body2">
                                            Sevkiyat No: {ship.shipmentNumber} - {ship.status}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Sıcaklık: {ship.temperature}°C | Nem: %{ship.humidity}
                                        </Typography>
                                    </Box>
                                ) )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Uyarılar */}
                <Grid item xs={12}>
                    <Card sx={{ bgcolor: temperatureAlerts.length || humidityAlerts.length ? '#fff3e0' : 'white' }}>
                        <CardContent>
                            <Typography variant="h6" color="warning" gutterBottom>
                                <WarningIcon sx={{ mr: 1, color: '#f57c00' }} />
                                Uyarılar
                            </Typography>
                            {temperatureAlerts.length === 0 && humidityAlerts.length === 0 ? (
                                <Box display="flex" alignItems="center" mt={1}>
                                    <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                                    <Typography>
                                        Tüm sistemler normal çalışıyor
                                    </Typography>
                                </Box>
                            ) : (
                                <Box>
                                    {temperatureAlerts.map( ( alert, index ) => (
                                        <Typography key={`temp-${index}`} color="error" variant="body2" gutterBottom>
                                            {alert.type === 'operation' ? 'Operasyon' : 'Sevkiyat'} #{alert.id}:
                                            Sıcaklık ({alert.temperature}°C) normal aralığın dışında!
                                        </Typography>
                                    ) )}
                                    {humidityAlerts.map( ( alert, index ) => (
                                        <Typography key={`hum-${index}`} color="error" variant="body2" gutterBottom>
                                            Sevkiyat #{alert.id}: Nem oranı (%{alert.humidity}) normal aralığın dışında!
                                        </Typography>
                                    ) )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* İstatistikler */}
                {stats && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Genel İstatistikler
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1" color="primary">
                                            Operasyonlar
                                        </Typography>
                                        {Object.entries( stats.operations ).map( ( [key, value] ) => (
                                            <Typography key={key} variant="body2">
                                                {key}: {value}
                                            </Typography>
                                        ) )}
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1" color="primary">
                                            Sevkiyatlar
                                        </Typography>
                                        {Object.entries( stats.shipments ).map( ( [key, value] ) => (
                                            <Typography key={key} variant="body2">
                                                {key}: {value}
                                            </Typography>
                                        ) )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default Dashboard;