import React, { useState, useEffect } from 'react';
import { Container, Grid, Button, Box, Typography, Alert, Paper, Divider, CircularProgress } from '@mui/material';
import { FaPlus, FaBuilding } from 'react-icons/fa';
import ManageShelterModal from './components/ManageShelterModal';
import UnassignedAnimalsTable from './components/UnassignedAnimalsTable';
import ShelterCard from './components/ShelterCard';
import * as shelterService from '../../utils/shelterService';

const ShelterManagement = () => {
    // State tanımlamaları
    const [shelters, setShelters] = useState([]);
    const [unassignedAnimals, setUnassignedAnimals] = useState([]);
    const [selectedShelter, setSelectedShelter] = useState(null);
    const [selectedPaddock, setSelectedPaddock] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Verileri yükleme
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Barınakları yükle
            const sheltersResponse = await shelterService.getAllShelters();
            setShelters(sheltersResponse.data.data || []);
            
            // Atanmamış hayvanları yükle
            const animalsResponse = await shelterService.getUnassignedAnimals();
            setUnassignedAnimals(animalsResponse.data.data || []);
        } catch (err) {
            console.error('Veri yükleme hatası:', err);
            setError('Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    // Barınak ekleme/düzenleme
    const handleSaveShelter = async (shelterData, shelterId) => {
        try {
            if (shelterId) {
                // Mevcut barınağı güncelle
                await shelterService.updateShelter(shelterId, shelterData);
            } else {
                // Yeni barınak oluştur
                await shelterService.createShelter(shelterData);
            }
            
            await loadData();
            handleCloseModal();
        } catch (err) {
            console.error('Barınak kaydetme hatası:', err);
            setError('Barınak kaydedilirken bir hata oluştu.');
        }
    };

    // Barınak silme
    const handleDeleteShelter = async (shelterId) => {
        if (!window.confirm('Bu barınağı silmek istediğinize emin misiniz?')) return;
        
        try {
            await shelterService.deleteShelter(shelterId);
            await loadData();
        } catch (err) {
            console.error('Barınak silme hatası:', err);
            setError('Barınak silinirken bir hata oluştu.');
        }
    };

    // Padok ekleme/düzenleme
    const handleSavePaddock = async (paddockData, paddockId) => {
        try {
            if (paddockId) {
                // Mevcut padoğu güncelle
                await shelterService.updatePaddock(paddockId, paddockData);
            } else {
                // Yeni padok oluştur
                await shelterService.createPaddock(paddockData);
            }
            
            await loadData();
            handleCloseModal();
        } catch (err) {
            console.error('Padok kaydetme hatası:', err);
            setError('Padok kaydedilirken bir hata oluştu.');
        }
    };

    // Padok silme
    const handleDeletePaddock = async (paddockId) => {
        if (!window.confirm('Bu padoğu silmek istediğinize emin misiniz?')) return;
        
        try {
            await shelterService.deletePaddock(paddockId);
            await loadData();
        } catch (err) {
            console.error('Padok silme hatası:', err);
            setError('Padok silinirken bir hata oluştu.');
        }
    };

    // Hayvanları padoğa atama
    const handleAssignAnimals = async (paddockId, animalIds) => {
        try {
            await shelterService.assignAnimalsToPaddock(paddockId, animalIds);
            await loadData();
        } catch (err) {
            console.error('Hayvan atama hatası:', err);
            setError('Hayvanlar atanırken bir hata oluştu.');
        }
    };

    // Modal açma/kapama fonksiyonları
    const handleAddShelter = () => {
        setSelectedShelter(null);
        setSelectedPaddock(null);
        setIsModalOpen(true);
    };

    const handleEditShelter = (shelter) => {
        setSelectedShelter(shelter);
        setSelectedPaddock(null);
        setIsModalOpen(true);
    };

    const handleAddPaddock = (data) => {
        handleSavePaddock(data);
    };

    const handleEditPaddock = (paddockId, data) => {
        handleSavePaddock(data, paddockId);
    };

    const handlePaddockClick = (paddock) => {
        // Padok detaylarını göster veya hayvanları listele
        console.log('Padok tıklandı:', paddock);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedShelter(null);
        setSelectedPaddock(null);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box mb={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Barınak Yönetimi
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Barınakları ve padokları yönetin, hayvanlara yer tahsis edin.
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<FaPlus />} 
                        onClick={handleAddShelter}
                    >
                        Yeni Barınak Ekle
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Barınaklar Bölümü */}
                <Grid item xs={12} md={8}>
                    <Paper 
                        elevation={0} 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            minHeight: 600,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <FaBuilding style={{ marginRight: 8 }} /> Barınaklar
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                                <CircularProgress />
                            </Box>
                        ) : shelters.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                {shelters.map(shelter => (
                                    <ShelterCard
                                        key={shelter.id}
                                        shelter={shelter}
                                        onEdit={handleEditShelter}
                                        onDelete={handleDeleteShelter}
                                        onAddPaddock={handleAddPaddock}
                                        onEditPaddock={handleEditPaddock}
                                        onDeletePaddock={handleDeletePaddock}
                                        onPaddockClick={handlePaddockClick}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Box 
                                display="flex" 
                                flexDirection="column" 
                                justifyContent="center" 
                                alignItems="center" 
                                flexGrow={1}
                                p={4}
                            >
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Henüz barınak eklenmemiş
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph textAlign="center">
                                    Barınak ekleyerek hayvanlara yer tahsis edebilirsiniz.
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    color="primary" 
                                    startIcon={<FaPlus />} 
                                    onClick={handleAddShelter}
                                    sx={{ mt: 2 }}
                                >
                                    Barınak Ekle
                                </Button>
                            </Box>
            )}
                    </Paper>
                </Grid>
                
                {/* Atanmamış Hayvanlar Bölümü */}
                <Grid item xs={12} md={4}>
                    <Paper 
                        elevation={0} 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <UnassignedAnimalsTable 
                            animals={unassignedAnimals}
                            paddocks={shelters.flatMap(shelter => shelter.paddocks || [])}
                            onAssignAnimals={handleAssignAnimals}
                            isLoading={loading}
                />
                    </Paper>
                </Grid>
            </Grid>

            {/* Barınak/Padok Yönetim Modalı */}
                <ManageShelterModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                    shelter={selectedShelter}
                paddock={selectedPaddock}
                onSaveShelter={handleSaveShelter}
                onSavePaddock={handleSavePaddock}
                />
        </Container>
    );
};

export default ShelterManagement;