import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Autocomplete,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import { FaTint, FaVial, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import axiosInstance from '../../utils/axiosConfig';
import BloodSampleModal from './components/BloodSampleModal';
import { toast } from 'react-toastify';

const TestOperations = () => {
  // State tanımlamaları
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isBloodSampleModalOpen, setIsBloodSampleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  // Hayvan arama
  const searchAnimals = async (term) => {
    if (term.length < 2) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/animals/search?term=${term}`);
      setSearchResults(response.data?.data || []);
    } catch (error) {
      console.error('Hayvan arama hatası:', error);
      toast.error('Hayvanlar aranırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Test arama
  const searchTests = async (term) => {
    if (term.length < 2) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/tests/search?detection_tag=${term}`);
      setTestResults(response.data?.data || []);
    } catch (error) {
      console.error('Test arama hatası:', error);
      toast.error('Testler aranırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Yaş hesaplama
  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} gün`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay`;
    return `${Math.floor(diffDays / 365)} yıl`;
  };

  // Test sonucu güncelleme
  const updateTestResult = async (testId, result) => {
    try {
      setLoading(true);
      
      const purpose = result === 'POZITIF' ? 'KESİM' : 'DAMIZLIK';
      const destination = result === 'POZITIF' ? 'Asya Et' : 'Gülvet';
      
      const response = await axiosInstance.put(`/tests/${testId}/result`, {
        result,
        result_date: new Date().toISOString(),
        animal_updates: {
          purpose,
          destination_company: destination,
          test_result: result
        }
      });

      if (response.data?.success) {
        toast.success('Test sonucu başarıyla güncellendi');
        // Listeyi yenile
        if (testSearchTerm) {
          searchTests(testSearchTerm);
        }
        setSelectedTest(null);
      }
    } catch (error) {
      console.error('Test sonucu güncelleme hatası:', error);
      toast.error('Test sonucu güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kan numunesi kaydetme
  const handleSaveBloodSample = async (sampleData) => {
    try {
      const response = await axiosInstance.post('/tests/blood-sample', sampleData);
      
      if (response.data?.success) {
        toast.success('Kan numunesi başarıyla kaydedildi');
        setIsBloodSampleModalOpen(false);
        setSelectedAnimal(null);
        setSearchTerm('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Kan numunesi kaydetme hatası:', error);
      toast.error('Kan numunesi kaydedilirken bir hata oluştu');
    }
  };

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // State'leri temizle
    setSearchTerm('');
    setTestSearchTerm('');
    setSearchResults([]);
    setTestResults([]);
    setSelectedAnimal(null);
    setSelectedTest(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Test Girişi" />
          <Tab label="Sonuç Girişi" />
        </Tabs>

        {/* Test Girişi Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kan Numunesi Alma
            </Typography>
            <Autocomplete
              freeSolo
              options={searchResults}
              getOptionLabel={(option) => option.animal_id || ''}
              inputValue={searchTerm}
              onInputChange={(event, newValue) => {
                setSearchTerm(newValue);
                searchAnimals(newValue);
              }}
              onChange={(event, newValue) => {
                setSelectedAnimal(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Hayvan Ara (Küpe No)"
                  variant="outlined"
                  fullWidth
                  placeholder="En az 2 karakter girin..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FaSearch style={{ marginRight: 8 }} />
                        {params.InputProps.startAdornment}
                      </Box>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Grid container alignItems="center">
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        {option.animal_id}
                        {option.testpit_no && 
                          <Chip 
                            size="small" 
                            label={`Tespit No: ${option.testpit_no}`}
                            sx={{ ml: 1 }}
                          />
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {calculateAge(option.birth_date)} - {option.breed || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            />

            {selectedAnimal && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Hayvan Bilgileri
                      </Typography>
                      <Typography>
                        <strong>Küpe No:</strong> {selectedAnimal.animal_id}
                      </Typography>
                      <Typography>
                        <strong>Yaş:</strong> {calculateAge(selectedAnimal.birth_date)}
                      </Typography>
                      <Typography>
                        <strong>Irk:</strong> {selectedAnimal.breed || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<FaTint />}
                        onClick={() => setIsBloodSampleModalOpen(true)}
                      >
                        Kan Numunesi Al
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Sonuç Girişi Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Sonucu Girişi
            </Typography>
            <Autocomplete
              freeSolo
              options={testResults}
              getOptionLabel={(option) => option.detection_tag || ''}
              inputValue={testSearchTerm}
              onInputChange={(event, newValue) => {
                setTestSearchTerm(newValue);
                searchTests(newValue);
              }}
              onChange={(event, newValue) => {
                setSelectedTest(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Test Ara (Tespit No)"
                  variant="outlined"
                  fullWidth
                  placeholder="En az 2 karakter girin..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FaVial style={{ marginRight: 8 }} />
                        {params.InputProps.startAdornment}
                      </Box>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Grid container alignItems="center">
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        Tespit No: {option.detection_tag}
                        <Chip 
                          size="small" 
                          label={option.result || 'SONUÇ BEKLİYOR'}
                          color={option.result === 'POZITIF' ? 'error' : option.result === 'NEGATIF' ? 'success' : 'warning'}
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Küpe No: {option.animal_id} - Tarih: {format(new Date(option.sample_date), 'dd.MM.yyyy', { locale: tr })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            />

            {selectedTest && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Test Bilgileri
                      </Typography>
                      <Typography>
                        <strong>Küpe No:</strong> {selectedTest.animal_id}
                      </Typography>
                      <Typography>
                        <strong>Tespit No:</strong> {selectedTest.detection_tag}
                      </Typography>
                      <Typography>
                        <strong>Numune Tarihi:</strong> {format(new Date(selectedTest.sample_date), 'dd.MM.yyyy', { locale: tr })}
                      </Typography>
                      <Typography>
                        <strong>Durum:</strong> {selectedTest.result || 'SONUÇ BEKLİYOR'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        disabled={loading || selectedTest.result === 'NEGATIF'}
                        onClick={() => updateTestResult(selectedTest.id, 'NEGATIF')}
                      >
                        NEGATİF
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        disabled={loading || selectedTest.result === 'POZITIF'}
                        onClick={() => updateTestResult(selectedTest.id, 'POZITIF')}
                      >
                        POZİTİF
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Paper>

      {/* Kan Numunesi Modal */}
      {isBloodSampleModalOpen && selectedAnimal && (
        <BloodSampleModal
          isOpen={isBloodSampleModalOpen}
          onClose={() => setIsBloodSampleModalOpen(false)}
          onSave={handleSaveBloodSample}
          animal={selectedAnimal}
        />
      )}
    </Container>
  );
};

export default TestOperations; 