import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { Box, Typography, Card, CardContent, Button, Modal } from '@mui/material';
import { toast } from 'react-toastify';

const AnimalGroups = () => {
    const [counts, setCounts] = useState( {
        breeding: 0,
        negativeTest: 0,
        pendingTest: 0,
        slaughtered: 0,
        sold: 0
    } );
    const [isModalOpen, setIsModalOpen] = useState( false );
    const [modalAnimals, setModalAnimals] = useState( [] );
    const [modalTitle, setModalTitle] = useState( '' );

    useEffect( () => {
        fetchCounts();
    }, [] );

    const fetchCounts = async () => {
        try {
            // Hayvan gruplarını ve bekleyen testleri eş zamanlı olarak çek
            const [animalsGroupsResponse, pendingTestsResponse] = await Promise.all([
                axiosInstance.get('/animals/groups'),
                axiosInstance.get('/blood-samples?status=SONUÇ BEKLENİYOR')
            ]);

            const hayvanlar = animalsGroupsResponse.data?.data || animalsGroupsResponse.data || [];
            const pendingTests = pendingTestsResponse.data?.data || pendingTestsResponse.data || [];

            setCounts({
                breeding: hayvanlar.filter(a => a.amac === 'Damızlık').length,
                negativeTest: hayvanlar.filter(a => a.testResult === 'Negatif').length,
                pendingTest: pendingTests.length, // Bekleyen testlerin sayısını kullan
                slaughtered: hayvanlar.filter(a => a.amac === 'Kesim').length,
                sold: hayvanlar.filter(a => a.akibet === 'Satıldı').length
            });
        } catch (error) {
            console.error('Veriler yüklenirken hata:', error);
            toast.error('Veriler yüklenirken bir hata oluştu.');
            // Hata durumunda tüm sayıları 0 olarak ayarla
            setCounts({
                breeding: 0,
                negativeTest: 0,
                pendingTest: 0,
                slaughtered: 0,
                sold: 0
            });
        }
    };

    const handleShowAnimals = async ( type ) => {
        try {
            let response;
            switch ( type ) {
                case 'Damızlık':
                    response = await axiosInstance.get( '/animals/groups?purpose=damızlık' );
                    break;
                case 'Test Sonucu Negatif':
                    response = await axiosInstance.get( '/animals/groups?test_result=NEGATIF' );
                    break;
                case 'Test Sonucu Bekleyenler':
                    response = await axiosInstance.get( '/blood-samples?status=SONUÇ BEKLENİYOR' );
                    break;
                case 'Kesilenler':
                    response = await axiosInstance.get( '/animals/groups?processing_status=KESILDI' );
                    break;
                case 'Satılanlar':
                    response = await axiosInstance.get( '/animals/groups?sale_status=SATILDI' );
                    break;
                default:
                    return;
            }

            setModalTitle( type );
            setModalAnimals( response.data.data || [] );
            setIsModalOpen( true );
        } catch ( error ) {
            console.error( 'Hayvanlar yüklenirken hata:', error );
            toast.error( 'Hayvanlar yüklenirken bir hata oluştu.' );
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen( false );
        setModalAnimals( [] );
        setModalTitle( '' );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 3, mb: 4 }}>
                {/* Damızlık Card */}
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary" gutterBottom>
                            Damızlık
                        </Typography>
                        <Typography variant="h3" color="primary.main">
                            {counts.breeding}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleShowAnimals( 'Damızlık' )}
                            sx={{ mt: 2 }}
                            fullWidth
                        >
                            Hayvanları Göster
                        </Button>
                    </CardContent>
                </Card>

                {/* Test Sonucu Negatif Card */}
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success" gutterBottom>
                            Test Sonucu Negatif
                        </Typography>
                        <Typography variant="h3" color="success.main">
                            {counts.negativeTest}
                        </Typography>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleShowAnimals( 'Test Sonucu Negatif' )}
                            sx={{ mt: 2 }}
                            fullWidth
                        >
                            Hayvanları Göster
                        </Button>
                    </CardContent>
                </Card>

                {/* Test Sonucu Bekleyenler Card */}
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning" gutterBottom>
                            Test Sonucu Bekleyenler
                        </Typography>
                        <Typography variant="h3" color="warning.main">
                            {counts.pendingTest}
                        </Typography>
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={() => handleShowAnimals( 'Test Sonucu Bekleyenler' )}
                            sx={{ mt: 2 }}
                            fullWidth
                        >
                            Hayvanları Göster
                        </Button>
                    </CardContent>
                </Card>

                {/* Kesilenler Card */}
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="error" gutterBottom>
                            Kesilenler
                        </Typography>
                        <Typography variant="h3" color="error.main">
                            {counts.slaughtered}
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleShowAnimals( 'Kesilenler' )}
                            sx={{ mt: 2 }}
                            fullWidth
                        >
                            Hayvanları Göster
                        </Button>
                    </CardContent>
                </Card>

                {/* Satılanlar Card */}
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'secondary.main' }} gutterBottom>
                            Satılanlar
                        </Typography>
                        <Typography variant="h3" color="secondary.main">
                            {counts.sold}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleShowAnimals( 'Satılanlar' )}
                            sx={{ mt: 2 }}
                            fullWidth
                        >
                            Hayvanları Göster
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                aria-labelledby="animal-list-modal"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    width: '90%',
                    maxWidth: 1200,
                    maxHeight: '90vh',
                    overflow: 'auto',
                    borderRadius: 1,
                }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        {modalTitle} Hayvanları
                    </Typography>
                    <Box sx={{ overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'rgba(0, 0, 0, 0.87)' }}>Küpe No</th>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'rgba(0, 0, 0, 0.87)' }}>Durum</th>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'rgba(0, 0, 0, 0.87)' }}>Alınma Tarihi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalAnimals.map( ( sample ) => (
                                    <tr key={sample.id} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '12px', color: 'rgba(0, 0, 0, 0.87)' }}>{sample.animal_id || sample.tag_number || '-'}</td> {/* animal_id veya tag_number gösterilebilir */}
                                        <td style={{ padding: '12px', color: 'rgba(0, 0, 0, 0.87)' }}>{sample.status || '-'}</td>
                                        <td style={{ padding: '12px', color: 'rgba(0, 0, 0, 0.87)' }}>{sample.sample_date ? new Date( sample.sample_date ).toLocaleDateString() : ( sample.created_at ? new Date( sample.created_at ).toLocaleDateString() : '-' )}</td> {/* sample_date veya created_at kullanılabilir */}
                                    </tr>
                                ) )}
                            </tbody>
                        </table>
                    </Box>
                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                        <Button variant="contained" onClick={handleCloseModal}>
                            Kapat
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default AnimalGroups;