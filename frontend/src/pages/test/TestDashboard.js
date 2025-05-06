import React from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { FaVial, FaExclamationTriangle, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import useTestDashboard from '../../hooks/useTestDashboard';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const TestDashboard = () => {
    const { dashboardData, loading, error } = useTestDashboard();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!dashboardData) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="info">Veri bulunamadı</Alert>
            </Container>
        );
    }

    const { animalTestGroups, locationSummary, pendingTests, lastUpdated } = dashboardData;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom>
                    Test İşlemleri Özeti
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Son güncelleme: {format(new Date(lastUpdated), 'dd MMMM yyyy HH:mm', { locale: tr })}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Test Durumu Kartları */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <FaQuestionCircle size={24} style={{ marginRight: 8, color: '#ff9800' }} />
                                <Typography variant="h6">Bekleyen Testler</Typography>
                            </Box>
                            <Typography variant="h3" color="warning.main">
                                {pendingTests}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <FaCheckCircle size={24} style={{ marginRight: 8, color: '#4caf50' }} />
                                <Typography variant="h6">Negatif Sonuçlar</Typography>
                            </Box>
                            <Typography variant="h3" color="success.main">
                                {animalTestGroups.temizGrup || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <FaExclamationTriangle size={24} style={{ marginRight: 8, color: '#f44336' }} />
                                <Typography variant="h6">Pozitif Sonuçlar</Typography>
                            </Box>
                            <Typography variant="h3" color="error.main">
                                {animalTestGroups.izoleGrup || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Lokasyon Özeti */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Lokasyon Bazlı Test Durumu
                        </Typography>
                        <Grid container spacing={2}>
                            {locationSummary.map((location, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                                        <Typography variant="subtitle1">
                                            {location.current_location_id || 'Belirtilmemiş'}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography>
                                            Pozitif: <strong>{location.test_result === 'POZITIF' ? location.count : 0}</strong>
                                        </Typography>
                                        <Typography>
                                            Negatif: <strong>{location.test_result === 'NEGATIF' ? location.count : 0}</strong>
                                        </Typography>
                                        <Typography>
                                            Bekleyen: <strong>{!location.test_result ? location.count : 0}</strong>
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TestDashboard; 