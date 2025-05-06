import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  TextField,
  IconButton,
  InputAdornment,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  Autocomplete,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { 
  DataGrid, 
  GridToolbar,
  trTR
} from '@mui/x-data-grid';
import { 
  FaPlus, 
  FaFileImport, 
  FaFilter, 
  FaSearch,
  FaCalendarAlt,
  FaEllipsisV,
  FaEdit,
  FaVial,
  FaEye,
  FaTint
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import trLocale from 'date-fns/locale/tr';
import axiosInstance from '../../utils/axiosConfig';
import TestResultModal from './components/TestResultModal';
import BulkTestResultModal from './components/BulkTestResultModal';
import TestDetailModal from './components/TestDetailModal';
import { useAnimal } from '../../contexts/AnimalContext';
import Modal from '../../components/common/Modal';

// Yeni kan alma modalı bileşeni
const BloodSampleModal = ({ isOpen, onClose, onSave, animal }) => {
  const [detectionTag, setDetectionTag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDetectionTag('');
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!detectionTag.trim()) {
      setError('Tespit no alanı zorunludur');
      return;
    }
    
    onSave({
      animal_id: animal.animal_id,
      detection_tag: detectionTag,
      sample_date: new Date().toISOString(),
      result: 'SONUÇ BEKLENIYOR'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kan Numunesi Al"
      onConfirm={handleSave}
      confirmText="Kaydet"
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body1" gutterBottom>
          <strong>{animal?.animal_id}</strong> numaralı hayvandan kan numunesi alınıyor. 
          Lütfen tüp üzerine yazılacak tespit numarasını giriniz.
        </Typography>
        
        <TextField
          fullWidth
          label="Tespit No"
          value={detectionTag}
          onChange={(e) => {
            setDetectionTag(e.target.value);
            if (e.target.value.trim()) setError('');
          }}
          error={!!error}
          helperText={error}
          placeholder="Tüp üzerine yazılan tespit numarası"
          margin="normal"
          required
        />
      </Box>
    </Modal>
  );
};

const TestList = () => {
  // Orijinal state tanımlamaları
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTest, setSelectedTest] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResultModalOpen, setIsResultModalOpen] = useState({open: false, mode: 'edit'});
  const [isBulkModalOpen, setIsBulkModalOpen] = useState({open: false, mode: 'add'});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Yeni state tanımlamaları - Hayvanlar için
  const { animals, fetchAnimals, loading: animalsLoading } = useAnimal();
  const [animalSearchTerm, setAnimalSearchTerm] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isAnimalDetailOpen, setIsAnimalDetailOpen] = useState(false);
  const [isBloodSampleModalOpen, setIsBloodSampleModalOpen] = useState(false);
  
  // Yeni state tanımlamaları - Snackbar için
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Verileri yükle
  useEffect(() => {
    fetchTests();
    fetchAnimals();
  }, [fetchAnimals]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/tests');
      setTests(response.data.data || []);
    } catch (error) {
      console.error('Test verileri yüklenirken hata:', error);
      toast.error('Test verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Test sonuçlarını filtrele
  const filteredTests = tests.filter(test => {
    // Arama terimine göre filtrele
    const matchesSearch = searchTerm === '' || 
      test.animal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.animal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.detection_tag?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tarih aralığına göre filtrele
    const testDate = test.sample_date ? new Date(test.sample_date) : null;
    const matchesDateFrom = fromDate ? (testDate && testDate >= fromDate) : true;
    const matchesDateTo = toDate ? (testDate && testDate <= toDate) : true;
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Hayvanları filtrele
  const filteredAnimals = animals.filter(animal => {
    if (animalSearchTerm.length < 2) return false; // En az 2 karakter girildiğinde filtrelemeye başla
    
    return animal.animal_id?.toLowerCase().includes(animalSearchTerm.toLowerCase()) ||
           (animal.name && animal.name.toLowerCase().includes(animalSearchTerm.toLowerCase())) ||
           (animal.breed && animal.breed.toLowerCase().includes(animalSearchTerm.toLowerCase()));
  });

  // Yaş hesaplama fonksiyonu
  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return '-';
    
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    const ageInMs = today - birthDate;
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) {
      return `${ageInDays} gün`;
    } else if (ageInDays < 365) {
      const ageInMonths = Math.floor(ageInDays / 30);
      return `${ageInMonths} ay`;
    } else {
      const ageInYears = Math.floor(ageInDays / 365);
      return `${ageInYears} yıl`;
    }
  };

  // Menü işlemleri
  const handleMenuOpen = (event, test) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTest(test);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTest(null);
  };

  // Modal işlemleri
  const handleOpenResultModal = (test = null, mode = 'edit') => {
    setSelectedTest(test);
    setIsResultModalOpen({open: true, mode: mode});
    handleMenuClose();
  };

  const handleOpenBulkModal = (mode = 'add') => {
    setIsBulkModalOpen({open: true, mode: mode});
  };

  const handleOpenDetailModal = () => {
    setIsDetailModalOpen(true);
    handleMenuClose();
  };

  const handleCloseModals = () => {
    setIsResultModalOpen({open: false, mode: 'edit'});
    setIsBulkModalOpen({open: false, mode: 'add'});
    setIsDetailModalOpen(false);
    setSelectedTest(null);
    setIsAnimalDetailOpen(false);
    setIsBloodSampleModalOpen(false);
  };

  // Test sonucu kaydetme
  const handleSaveTestResult = async (testData) => {
    try {
      if (selectedTest?.id) {
        // Güncelleme
        await axiosInstance.put(`/tests/${selectedTest.id}/result`, testData);
        toast.success('Test sonucu başarıyla güncellendi');
      } else {
        // Yeni kayıt
        await axiosInstance.post('/tests/result', testData);
        toast.success('Test sonucu başarıyla kaydedildi');
      }
      
      fetchTests();
      handleCloseModals();
    } catch (error) {
      console.error('Test sonucu kaydedilirken hata:', error);
      toast.error('Test sonucu kaydedilirken bir hata oluştu');
    }
  };

  // Toplu test sonucu kaydetme
  const handleSaveBulkTestResults = async (testResults) => {
    try {
      await axiosInstance.post('/tests/bulk-results', { results: testResults });
      toast.success(`${testResults.length} test sonucu başarıyla kaydedildi`);
      fetchTests();
      handleCloseModals();
    } catch (error) {
      console.error('Toplu test sonuçları kaydedilirken hata:', error);
      toast.error('Toplu test sonuçları kaydedilirken bir hata oluştu');
    }
  };

  // Kan numunesi alma işlemi
  const handleTakeBloodSample = (animal) => {
    setSelectedAnimal(animal);
    setIsBloodSampleModalOpen(true);
  };

  // Kan numunesi kaydetme
  const handleSaveBloodSample = async (sampleData) => {
    try {
      await axiosInstance.post('/tests/blood-sample', sampleData);
      
      // Snackbar göster
      setSnackbar({
        open: true,
        message: `${sampleData.animal_id} numaralı hayvandan alınan kan numunesi başarıyla kaydedildi`,
        severity: 'success'
      });
      
      fetchTests();
      handleCloseModals();
    } catch (error) {
      console.error('Kan numunesi kaydedilirken hata:', error);
      
      // Hata durumunda snackbar göster
      setSnackbar({
        open: true,
        message: 'Kan numunesi kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Hayvan detay görüntüleme
  const handleShowAnimalDetail = (animal) => {
    setSelectedAnimal(animal);
    setIsAnimalDetailOpen(true);
  };

  // DataGrid sütunları - Test Listesi
  const testColumns = [
    { 
      field: 'animal_id', 
      headerName: 'Küpe No', 
      width: 150,
      renderCell: (params) => (
        <Tooltip title="Detayları Görüntüle">
          <Button 
            variant="text" 
            color="primary" 
            size="small"
            onClick={() => handleOpenDetailModal(params.row)}
          >
            {params.value}
          </Button>
        </Tooltip>
      )
    },
    { field: 'animal_name', headerName: 'Hayvan Adı', width: 150 },
    { field: 'detection_tag', headerName: 'Tespit Küpesi', width: 150 },
    { 
      field: 'sample_date', 
      headerName: 'Kan Alma Tarihi', 
      width: 170,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return date.toLocaleDateString('tr-TR');
      } 
    },
    { 
      field: 'result', 
      headerName: 'Test Sonucu', 
      width: 150,
      renderCell: (params) => {
        if (!params.value) {
          return <Chip label="BEKLİYOR" color="warning" size="small" />;
        }
        
        let color = 'default';
        let label = params.value;
        
        if (params.value === 'POZITIF') {
          color = 'error';
          label = 'POZİTİF';
        } else if (params.value === 'NEGATIF') {
          color = 'success';
          label = 'NEGATİF';
        } else if (params.value === 'SONUÇ BEKLENIYOR') {
          color = 'info';
          label = 'SONUÇ BEKLENIYOR';
        } else if (params.value === 'İŞLEM YAPILMADI') {
          color = 'default';
          label = 'İŞLEM YAPILMADI';
        }
        
        return (
          <Chip 
            label={label} 
            color={color} 
            size="small" 
          />
        );
      }
    },
    { 
      field: 'result_date', 
      headerName: 'Sonuç Tarihi', 
      width: 170,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return date.toLocaleDateString('tr-TR');
      } 
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex' }}>
          <Tooltip title="Sonuç Gir/Düzenle">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleOpenResultModal(params.row, 'edit')}
            >
              <FaEdit />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="İşlemler">
            <IconButton 
              size="small"
              onClick={(event) => handleMenuOpen(event, params.row)}
            >
              <FaEllipsisV />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
  ];

  // DataGrid sütunları - Hayvan Listesi
  const animalColumns = [
    { 
      field: 'animal_id', 
      headerName: 'Küpe No', 
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="text" 
          color="primary" 
          size="small"
          onClick={() => handleShowAnimalDetail(params.row)}
        >
          {params.value}
        </Button>
      )
    },
    { 
      field: 'birth_date', 
      headerName: 'Yaş', 
      width: 120,
      valueGetter: (params) => calculateAge(params.row.birth_date)
    },
    { 
      field: 'status', 
      headerName: 'Durum', 
      width: 150,
      renderCell: (params) => {
        let color = 'default';
        let label = params.value || 'BELİRSİZ';
        
        if (params.value === 'ACTIVE') {
          color = 'success';
          label = 'AKTİF';
        } else if (params.value === 'SOLD') {
          color = 'info';
          label = 'SATILDI';
        } else if (params.value === 'DEAD') {
          color = 'error';
          label = 'ÖLÜM';
        }
        
        return <Chip label={label} color={color} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex' }}>
          <Tooltip title="Kan Al">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleTakeBloodSample(params.row)}
            >
              <FaTint />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Detaylar">
            <IconButton 
              size="small"
              color="primary"
              onClick={() => handleShowAnimalDetail(params.row)}
            >
              <FaEye />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
  ];

  // Snackbar işlemleri
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Sayfa içeriği
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Sol Sütun - Test Listesi */}
        <Grid item xs={12} md={7}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Test Listesi
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaPlus />}
                  onClick={() => handleOpenResultModal(null, 'add')}
                  size="small"
                >
                  Yeni Test
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<FaFileImport />}
                  onClick={() => handleOpenBulkModal('add')}
                  size="small"
                >
                  Toplu Giriş
                </Button>
              </Box>
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ara"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaSearch />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Küpe no, isim veya tespit küpesi..."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <DatePicker
                      label="Başlangıç Tarihi"
                      value={fromDate}
                      onChange={(newValue) => setFromDate(newValue)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      format="dd.MM.yyyy"
                    />
                    <DatePicker
                      label="Bitiş Tarihi"
                      value={toDate}
                      onChange={(newValue) => setToDate(newValue)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      format="dd.MM.yyyy"
                    />
                  </Box>
                </LocalizationProvider>
              </Grid>
            </Grid>
            
            <Box sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={filteredTests}
                columns={testColumns}
                pageSize={pageSize}
                onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                rowsPerPageOptions={[5, 10, 20, 50]}
                disableSelectionOnClick
                loading={loading}
                components={{
                  Toolbar: GridToolbar,
                }}
                localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Sağ Sütun - Hayvan Listesi */}
        <Grid item xs={12} md={5}>
          <Paper 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              height: '100%'
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Hayvan Listesi
              </Typography>
              
              <Autocomplete
                freeSolo
                options={filteredAnimals}
                getOptionLabel={(option) => option.animal_id || ''}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleShowAnimalDetail(newValue);
                  }
                }}
                inputValue={animalSearchTerm}
                onInputChange={(event, newInputValue) => {
                  setAnimalSearchTerm(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Hayvan Ara"
                    margin="normal"
                    variant="outlined"
                    fullWidth
                    placeholder="En az 2 karakter girin..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaSearch />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Küpe no, isim veya ırk ile arama yapabilirsiniz"
                  />
                )}
                renderOption={(props, option) => {
                  // props'tan key özelliğini ayırıyoruz
                  const { key, ...otherProps } = props;
                  
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.animal_id}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {calculateAge(option.birth_date)} - {option.breed || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                noOptionsText="Sonuç bulunamadı"
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 450, width: '100%', display: 'flex', flexDirection: 'column' }}>
              {animalSearchTerm.length < 2 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <Typography variant="body1" color="text.secondary">
                    Hayvan listesini görüntülemek için arama yapın (en az 2 karakter)
                  </Typography>
                </Box>
              ) : (
                filteredAnimals.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <Typography variant="body1" color="text.secondary">
                      Arama kriterine uygun hayvan bulunamadı
                    </Typography>
                  </Box>
                ) : (
                  <DataGrid
                    rows={filteredAnimals}
                    columns={animalColumns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    disableSelectionOnClick
                    loading={animalsLoading}
                    density="compact"
                  />
                )
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenDetailModal}>
          <FaEye fontSize="small" style={{ marginRight: 8 }} />
          Detayları Görüntüle
        </MenuItem>
        <MenuItem onClick={() => handleOpenResultModal(selectedTest, 'edit')}>
          <FaEdit fontSize="small" style={{ marginRight: 8 }} />
          Sonucu Düzenle
        </MenuItem>
      </Menu>
      
      {/* Modallar */}
      {isResultModalOpen.open && (
        <TestResultModal
          isOpen={isResultModalOpen.open}
          onClose={handleCloseModals}
          onSave={handleSaveTestResult}
          test={selectedTest}
          mode={isResultModalOpen.mode}
        />
      )}
      
      {isBulkModalOpen.open && (
        <BulkTestResultModal
          isOpen={isBulkModalOpen.open}
          onClose={handleCloseModals}
          onSave={handleSaveBulkTestResults}
          mode={isBulkModalOpen.mode}
        />
      )}
      
      {isDetailModalOpen && selectedTest && (
        <TestDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseModals}
          test={selectedTest}
        />
      )}
      
      {/* Yeni Modallar */}
      {isAnimalDetailOpen && selectedAnimal && (
        <Dialog
          open={isAnimalDetailOpen}
          onClose={handleCloseModals}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Hayvan Detayları
              </Typography>
              <Button onClick={handleCloseModals} color="inherit">Kapat</Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary">
                      Temel Bilgiler
                    </Typography>
                    <Typography variant="h6">
                      Küpe No: {selectedAnimal.animal_id}
                    </Typography>
                    <Typography>
                      Doğum Tarihi: {selectedAnimal.birth_date ? new Date(selectedAnimal.birth_date).toLocaleDateString('tr-TR') : '-'}
                    </Typography>
                    <Typography>
                      Yaş: {calculateAge(selectedAnimal.birth_date)}
                    </Typography>
                    <Typography>
                      Cinsiyet: {selectedAnimal.gender || '-'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="text.secondary">
                      Detay Bilgiler
                    </Typography>
                    <Typography>
                      Irk: {selectedAnimal.breed || '-'}
                    </Typography>
                    <Typography>
                      Kategori: {selectedAnimal.category || '-'}
                    </Typography>
                    <Typography>
                      Amaç: {selectedAnimal.purpose || '-'}
                    </Typography>
                    <Typography>
                      Durum: {selectedAnimal.status || '-'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined"
                onClick={handleCloseModals}
              >
                Kapat
              </Button>
              <Button 
                variant="contained" 
                color="error"
                startIcon={<FaTint />}
                onClick={() => {
                  handleCloseModals();
                  handleTakeBloodSample(selectedAnimal);
                }}
              >
                Kan Numunesi Al
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
      
      {isBloodSampleModalOpen && selectedAnimal && (
        <BloodSampleModal
          isOpen={isBloodSampleModalOpen}
          onClose={handleCloseModals}
          onSave={handleSaveBloodSample}
          animal={selectedAnimal}
        />
      )}
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
          sx={{ width: '100%', maxWidth: '600px' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default TestList;