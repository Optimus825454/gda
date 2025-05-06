import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import trLocale from 'date-fns/locale/tr';
import { FaCalendarAlt, FaPlus, FaTrash, FaUpload, FaSearch } from 'react-icons/fa';
import Modal from '../../../components/common/Modal';
import axios from 'axios';

// Test sonuç seçenekleri
const resultOptions = [
  { value: "İŞLEM YAPILMADI", label: "İŞLEM YAPILMADI" },
  { value: "SONUÇ BEKLENIYOR", label: "SONUÇ BEKLENIYOR" },
  { value: "POZITIF", label: "POZİTİF" },
  { value: "NEGATIF", label: "NEGATİF" }
];

const BulkTestResultModal = ({ isOpen, onClose, onSave, mode = 'add' }) => {
  const [animals, setAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sampleDate, setSampleDate] = useState(new Date());
  const [resultDate, setResultDate] = useState(new Date());
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchAnimals();
      setTestResults([]);
      setSelectedAnimals([]);
      setSearchTerm('');
      setSampleDate(new Date());
      setResultDate(new Date());
    }
  }, [isOpen]);

  // Modal başlığını belirle
  const getModalTitle = () => {
    if (mode === 'add') return 'Toplu Test Kaydı Ekle';
    if (mode === 'result') return 'Toplu Test Sonucu Girişi';
    return 'Toplu Test İşlemi';
  };

  // Hayvanları getir
  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/animals');
      setAnimals(response.data.data || []);
    } catch (error) {
      console.error('Hayvanlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Arama terimine göre hayvanları filtrele
  const filteredAnimals = animals.filter(animal => {
    const animalIdMatch = animal.animal_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const animalNameMatch = animal.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const alreadySelected = selectedAnimals.some(selected => selected.id === animal.id);
    
    return (animalIdMatch || animalNameMatch) && !alreadySelected;
  });

  // Hayvan seçme
  const handleSelectAnimal = (animal) => {
    setSelectedAnimals([...selectedAnimals, animal]);
    setSearchTerm('');
  };

  // Hayvan kaldırma
  const handleRemoveAnimal = (animalId) => {
    setSelectedAnimals(selectedAnimals.filter(animal => animal.id !== animalId));
  };

  // Toplu test sonucu ekleme
  const handleAddBulkResults = () => {
    if (selectedAnimals.length === 0) {
      return;
    }

    const formattedSampleDate = sampleDate ? sampleDate.toISOString().split('T')[0] : null;
    const formattedResultDate = resultDate ? resultDate.toISOString().split('T')[0] : null;

    const newTestResults = selectedAnimals.map(animal => ({
      animal_id: animal.animal_id,
      animal_name: animal.name || '',
      sample_date: formattedSampleDate,
      result: '',
      result_date: formattedResultDate,
      detection_tag: '' // Tespit küpesi numarası
    }));

    setTestResults(newTestResults);
  };

  // Test sonucu değiştirme
  const handleChangeResult = (index, value) => {
    const updated = [...testResults];
    updated[index].result = value;
    setTestResults(updated);
  };

  // Tespit küpesi değiştirme
  const handleChangeDetectionTag = (index, value) => {
    const updated = [...testResults];
    updated[index].detection_tag = value;
    setTestResults(updated);
  };

  // Formu gönder
  const handleSubmit = () => {
    // Tüm sonuçların varlığını kontrol et
    const allResultsValid = testResults.every(test => !!test.animal_id && !!test.sample_date);
    
    if (!allResultsValid) {
      return;
    }
    
    // API'ye gönder
    onSave(testResults);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      maxWidth="lg"
      onConfirm={handleSubmit}
      confirmDisabled={testResults.length === 0}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
        <Grid container spacing={2}>
          {/* Hayvan Seçimi */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Hayvan Seçimi
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Hayvan Ara (Küpe No veya İsim)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Kan Alma Tarihi"
                value={sampleDate}
                onChange={setSampleDate}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaCalendarAlt />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
                format="dd.MM.yyyy"
              />
              
              <DatePicker
                label="Sonuç Tarihi"
                value={resultDate}
                onChange={setResultDate}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaCalendarAlt />
                        </InputAdornment>
                      ),
                    }
                  } 
                }}
                format="dd.MM.yyyy"
              />
            </Box>
          </Grid>

          {/* Filtrelenmiş Hayvanlar Listesi */}
          {searchTerm && filteredAnimals.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                <List>
                  {filteredAnimals.slice(0, 10).map((animal) => (
                    <ListItem 
                      key={animal.id}
                      button
                      onClick={() => handleSelectAnimal(animal)}
                    >
                      <ListItemText 
                        primary={`${animal.animal_id} - ${animal.name || 'İsimsiz'}`} 
                        secondary={animal.breed || ''}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Seçilen Hayvanlar */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Seçilen Hayvanlar ({selectedAnimals.length})
            </Typography>
            
            {selectedAnimals.length > 0 ? (
              <TableContainer component={Paper} sx={{ maxHeight: 200, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Küpe No</TableCell>
                      <TableCell>Hayvan Adı</TableCell>
                      <TableCell align="right">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedAnimals.map((animal) => (
                      <TableRow key={animal.id}>
                        <TableCell>{animal.animal_id}</TableCell>
                        <TableCell>{animal.name || 'İsimsiz'}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveAnimal(animal.id)}
                          >
                            <FaTrash />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 1 }}>
                Henüz hayvan seçilmedi. Yukarıdan hayvan arayarak ekleyebilirsiniz.
              </Alert>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<FaPlus />}
                onClick={handleAddBulkResults}
                disabled={selectedAnimals.length === 0}
              >
                Test Ekle
              </Button>
            </Box>
          </Grid>

          {/* Test Sonuçları */}
          {testResults.length > 0 && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Test Sonuçları
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Küpe No</TableCell>
                        <TableCell>Hayvan Adı</TableCell>
                        <TableCell>Tespit Küpesi</TableCell>
                        <TableCell>Kan Alma Tarihi</TableCell>
                        <TableCell>Sonuç</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {testResults.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell>{test.animal_id}</TableCell>
                          <TableCell>{test.animal_name}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={test.detection_tag || ''}
                              onChange={(e) => handleChangeDetectionTag(index, e.target.value)}
                              placeholder="Tespit küpesi no..."
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(test.sample_date).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={test.result || ''}
                              onChange={(e) => handleChangeResult(index, e.target.value)}
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="">
                                <em>Beklemede</em>
                              </MenuItem>
                              {resultOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </>
          )}
        </Grid>
      </LocalizationProvider>
    </Modal>
  );
};

BulkTestResultModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['add', 'result'])
};

export default BulkTestResultModal; 