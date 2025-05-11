import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Slide,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Fade,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Science as ScienceIcon, AssignmentTurnedIn as AssignmentTurnedInIcon, ListAlt as ListAltIcon } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosConfig';
import { debounce } from 'lodash';
import { format, parseISO } from 'date-fns';

// Özel Alert Bileşeni (TestList.js içine geri eklendi)
const CustomAlert = ({ open, message, severity, onClose }) => {
  return (
    <Fade in={open}>
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          minWidth: 300,
          maxWidth: 500
        }}
      >
        <Paper elevation={24} sx={{ borderRadius: 2}}>
          <Alert
            severity={severity}
            variant="filled"
            onClose={onClose}
            sx={{
              width: '100%',
              '& .MuiAlert-message': {
                fontSize: '1.1rem',
                py: 1
              }
            }}
          >
            {message}
          </Alert>
        </Paper>
      </Box>
    </Fade>
  );
};

// Test Detay Modalı
const TestDetailModal = ({ open, onClose, test }) => {
  if (!test) return null;

  const getStatusChipColor = (status) => {
    if (status === 'POZİTİF') return 'error';
    if (status === 'NEGATİF') return 'success';
    if (status === 'BELİRSİZ') return 'warning';
    return 'default';
  };
  
  // Bu fonksiyon TestList component scope'unda olmalı veya props olarak geçirilmeli
  // Şimdilik doğrudan burada tanımlıyorum ama en iyi pratik bu değil.
  const calculateAgeForDetail = (birthDate) => {
    if (!birthDate) return '-';
    try {
      const birth = parseISO(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      const years = age;
      const months = (today.getMonth() - birth.getMonth() + 12) % 12;
      return `${years} yıl ${months} ay`;
    } catch (error) {
      console.error("Yaş hesaplama hatası (Detail Modal):", error);
      return "Geçersiz tarih";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 2, minWidth: 450, bgcolor: 'background.paper' } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ScienceIcon />
          <Typography variant="h6">Test Detayları</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{pt: 1}}>
          <Grid item xs={6}><Typography variant="subtitle2">Küpe No:</Typography></Grid>
          <Grid item xs={6}><Typography variant="body1">{test.tag_number}</Typography></Grid>
          
          <Grid item xs={6}><Typography variant="subtitle2">Tespit No:</Typography></Grid>
          <Grid item xs={6}><Typography variant="body1">{test.detection_tag || '-'}</Typography></Grid>

          <Grid item xs={6}><Typography variant="subtitle2">Numune Tarihi:</Typography></Grid>
          <Grid item xs={6}><Typography variant="body1">{test.sample_date ? format(parseISO(test.sample_date), 'dd/MM/yyyy') : '-'}</Typography></Grid>
          
          <Grid item xs={6}><Typography variant="subtitle2">Durum:</Typography></Grid>
          <Grid item xs={6}>
            <Chip label={test.status || '-'} color={getStatusChipColor(test.status)} size="small" />
          </Grid>

          {test.status !== 'SONUÇ BEKLENİYOR' && (
            <>
              <Grid item xs={6}><Typography variant="subtitle2">Sonuç Tarihi:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body1">{test.result_date ? format(parseISO(test.result_date), 'dd/MM/yyyy') : '-'}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="subtitle2">Notlar:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{test.notes || '-'}</Typography></Grid>
            </>
          )}
          
          <Grid item xs={6}><Typography variant="subtitle2">Hayvan Kategorisi:</Typography></Grid>
          <Grid item xs={6}><Typography variant="body1">{test.animal_info?.kategori || '-'}</Typography></Grid>
          
          <Grid item xs={6}><Typography variant="subtitle2">Hayvan Durumu:</Typography></Grid>
          <Grid item xs={6}><Typography variant="body1">{test.animal_info?.durum || '-'}</Typography></Grid>
          
          <Grid item xs={6}><Typography variant="subtitle2">Hayvan Yaşı:</Typography></Grid>
          <Grid item xs={6}><Typography variant="body1">{test.animal_info?.dogtar ? `${calculateAgeForDetail(test.animal_info.dogtar)}` : '-'}</Typography></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

// Test Sonucu Giriş/Güncelleme Modalı
const TestResultModal = ({ open, onClose, test, onUpdate }) => {
  const [resultStatus, setResultStatus] = useState(''); // 'POZİTİF', 'NEGATİF', 'BELİRSİZ'
  const [resultDate, setResultDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (test) {
      setResultStatus(test.status !== 'SONUÇ BEKLENİYOR' ? test.status : '');
      setResultDate(test.result_date ? format(parseISO(test.result_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
      setNotes(test.notes || '');
    } else {
      setResultStatus('');
      setResultDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
    }
  }, [test]);

  const handleSubmit = () => {
    if (!resultStatus || !resultDate) {
      return;
    }
    onUpdate({
      id: test.id,
      status: resultStatus, 
      result_date: resultDate,
      notes,
    });
    onClose(); 
  };

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Slide} TransitionProps={{ direction: "up" }} PaperProps={{ sx: { borderRadius: 2, minWidth: 450, bgcolor: 'background.paper'} }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AssignmentTurnedInIcon />
          <Typography variant="h6">Test Sonucu Girişi</Typography>
        </Stack>
        {test && <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>Küpe No: {test.tag_number}</Typography>}
      </DialogTitle>
      <DialogContent dividers sx={{pt: 2}}>
        <Stack spacing={3}>
          <FormControl fullWidth required>
            <InputLabel>Sonuç Durumu</InputLabel>
            <Select
              value={resultStatus}
              label="Sonuç Durumu"
              onChange={(e) => setResultStatus(e.target.value)}
            >
              <MenuItem value="POZİTİF">POZİTİF</MenuItem>
              <MenuItem value="NEGATİF">NEGATİF</MenuItem>
              <MenuItem value="BELİRSİZ">BELİRSİZ</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            required
            label="Sonuç Tarihi"
            type="date"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Notlar"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">İptal</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={!resultStatus || !resultDate}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  );
};

// Ana TestList Bileşeni
const TestList = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]); 
  
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAnimalForTest, setSelectedAnimalForTest] = useState(null);
  const [newTestDetectionTag, setNewTestDetectionTag] = useState('');
  const [newTestSampleDate, setNewTestSampleDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedTestForUpdate, setSelectedTestForUpdate] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTestForDetail, setSelectedTestForDetail] = useState(null);
  
  const [customAlert, setCustomAlert] = useState({ open: false, message: '', severity: 'info' });
  const [generalLoading, setGeneralLoading] = useState(false); 

  // Sonuç Girişi sekmesi için filtre state'leri
  const [sonucGirisKupeNoFilter, setSonucGirisKupeNoFilter] = useState('');
  const [sonucGirisTespitNoFilter, setSonucGirisTespitNoFilter] = useState('');

  // calculateAge fonksiyonu TestList scope'una taşındı.
  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    try {
      const birth = parseISO(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      const years = age;
      const months = (today.getMonth() - birth.getMonth() + 12) % 12;
      return `${years} yıl ${months} ay`;
    } catch (error) {
      console.error("Yaş hesaplama hatası:", error);
      return "Geçersiz tarih";
    }
  };

  const showCustomAlert = (message, severity = 'info', duration = 3000) => {
    setCustomAlert({ open: true, message, severity });
    setTimeout(() => {
      setCustomAlert(prev => ({ ...prev, open: false }));
    }, duration);
  };

  const fetchAllTests = useCallback(async () => {
    setGeneralLoading(true);
    try {
      const response = await axiosInstance.get('/blood-samples');
      if (response.data?.success) {
        setAllTests(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Test verileri alınamadı');
      }
    } catch (error) {
      console.error('Tüm test listesi alınırken hata:', error);
      showCustomAlert(`Test listesi alınırken bir hata oluştu: ${error.message}`, 'error');
      setAllTests([]); 
    } finally {
      setGeneralLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTests();
  }, [fetchAllTests]);

  useEffect(() => {
    if (activeTab === 0) { 
      setTests([]); 
    } else if (activeTab === 1) { 
      setTests(allTests.filter(t => t.status === 'SONUÇ BEKLENİYOR'));
    } else if (activeTab === 2) { 
      setTests(allTests.filter(t => t.status !== 'SONUÇ BEKLENİYOR'));
    }
  }, [activeTab, allTests]);


  const fetchAnimalSuggestions = useCallback(async (searchValue) => {
    if (!searchValue || searchValue.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await axiosInstance.get('/animals/search', { params: { query: searchValue } });
      if (response.data?.success && Array.isArray(response.data.data)) {
        const availableAnimals = response.data.data
          .filter(animal =>
            !allTests.some(test =>
              test.animal_id === animal.id &&
              test.status === 'SONUÇ BEKLENİYOR'
            )
          );
        setSuggestions(availableAnimals);
      }
    } catch (error) {
      console.error('Hayvan önerileri alınırken hata:', error);
      showCustomAlert('Hayvan önerileri alınamadı.', 'error');
    } finally {
      setSearchLoading(false);
    }
  }, [allTests, showCustomAlert]);

  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchAnimalSuggestions, 400),
    [fetchAnimalSuggestions]
  );

  const handleAnimalSelectForTest = (event, value) => {
    setSelectedAnimalForTest(value);
    if (value) {
    } else {
      setNewTestDetectionTag('');
    }
  };

  const handleCreateNewTest = async () => {
    if (!selectedAnimalForTest || !newTestDetectionTag || !newTestSampleDate) {
      showCustomAlert('Lütfen hayvan seçin, tespit numarası ve numune tarihi girin.', 'warning');
      return;
    }
    setGeneralLoading(true);
    try {
      const payload = {
        animal_id: selectedAnimalForTest.id,
        tag_number: selectedAnimalForTest.kupeno, 
        sample_date: newTestSampleDate,
        detection_tag: newTestDetectionTag,
        status: 'SONUÇ BEKLENİYOR' 
      };
      const response = await axiosInstance.post('/blood-samples', payload);
      if (response.data?.success) {
        showCustomAlert('Yeni test başarıyla oluşturuldu!', 'success');
        fetchAllTests(); 
        setSelectedAnimalForTest(null);
        setNewTestDetectionTag('');
        setNewTestSampleDate(format(new Date(), 'yyyy-MM-dd'));
        setSuggestions([]); 
      } else {
        // Bu durum normalde backend success:false ama 2xx olmayan bir status ile dönmeli
        // Ancak backend 2xx status ve success:false dönerse burası tetiklenebilir.
        showCustomAlert(response.data?.message || 'Test oluşturulamadı (sunucudan beklenmeyen yanıt).', 'error');
      }
    } catch (error) {
      console.error('Yeni test oluşturulurken hata:', error);
      const backendMessage = error.response?.data?.message;
      const specificKnownError = "Bu hayvan için zaten bekleyen bir test kaydı bulunmaktadır. Yeni test kaydı yapabilmek için mevcut testin sonuçlanmasını bekleyiniz.";

      if (backendMessage && backendMessage === specificKnownError) {
        showCustomAlert(backendMessage, 'warning');
      } else if (backendMessage) {
        showCustomAlert(backendMessage, 'error');
      } else {
        showCustomAlert(`Test oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen bir sorun.'}`, 'error');
      }
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleOpenResultModal = (test) => {
    setSelectedTestForUpdate(test);
    setResultModalOpen(true);
  };

  const handleUpdateTestResult = async (updatedData) => {
    setGeneralLoading(true);
    try {
      const response = await axiosInstance.put(`/blood-samples/${updatedData.id}`, {
        status: updatedData.status,
        result_date: updatedData.result_date,
        notes: updatedData.notes
      });
      if (response.data?.success) {
        showCustomAlert('Test sonucu başarıyla güncellendi!', 'success');
        fetchAllTests(); 
        setResultModalOpen(false);
        setSelectedTestForUpdate(null);
      } else {
        throw new Error(response.data?.message || 'Test sonucu güncellenemedi');
      }
    } catch (error) {
      console.error('Test sonucu güncellenirken hata:', error);
      showCustomAlert(`Test sonucu güncellenirken hata: ${error.message || 'Bilinmeyen bir sorun oluştu.'}`, 'error');
    } finally {
      setGeneralLoading(false);
    }
  };
  
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Bu test kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    setGeneralLoading(true);
    try {
      const response = await axiosInstance.delete(`/blood-samples/${testId}`);
      if (response.data?.success) {
        showCustomAlert('Test başarıyla silindi!', 'success');
        fetchAllTests(); 
      } else {
        throw new Error(response.data?.message || 'Test silinemedi');
      }
    } catch (error) {
      console.error('Test silinirken hata:', error);
      showCustomAlert(`Test silinirken hata: ${error.response?.data?.message || error.message || 'Bilinmeyen bir sorun oluştu.'}`, 'error');
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleOpenDetailModal = (test) => {
    setSelectedTestForDetail(test);
    setDetailModalOpen(true);
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getChipColorByResult = (result) => {
    if (result === 'POZİTİF') return 'error';
    if (result === 'NEGATİF') return 'success';
    if (result === 'BELİRSİZ') return 'warning';
    return 'default'; // Diğer durumlar için (örn: null, boş string)
  };

  const getStatusChipColor = (status) => {
    if (status === 'POZİTİF') return 'error';
    if (status === 'NEGATİF') return 'success';
    if (status === 'BELİRSİZ') return 'warning';
    if (status === 'SONUÇ BEKLENİYOR') return 'info';
    return 'default';
  };

  const renderTestGirisTab = () => (
    <Paper elevation={3} sx={{ p: 3, mt: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScienceIcon /> Yeni Test Kaydı
      </Typography>
      <Grid container spacing={3} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={5}>
        <Autocomplete
            fullWidth
          options={suggestions}
            getOptionLabel={(option) => `${option.kupeno}`}
            value={selectedAnimalForTest}
            onChange={handleAnimalSelectForTest}
            onInputChange={(event, newInputValue) => {
              debouncedFetchSuggestions(newInputValue);
            }}
            loading={searchLoading}
          renderInput={(params) => (
            <TextField
              {...params}
                label="Hayvan Ara (Küpe No)"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>{option.kupeno}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip label={`Yaş: ${calculateAge(option.dogtar)}`} size="small" variant="outlined" />
                  <Chip label={option.kategori || '-'} size="small" variant="outlined" color="secondary" />
                  {option.tespitno && 
                    <Chip label={`Tes.No: ${option.tespitno}`} size="small" color="info" variant="filled"/>
                  }
                  {allTests.find(t=>t.animal_id === option.id && t.status === 'SONUÇ BEKLENİYOR') && 
                    <Chip label="Bekleyen Test" color="warning" size="small" variant="filled"/>
                  }
                </Stack>
              </Box>
            )}
            noOptionsText="Hayvan bulunamadı."
            loadingText="Yükleniyor..."
            disabled={generalLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Tespit Numarası"
            value={newTestDetectionTag}
            onChange={(e) => setNewTestDetectionTag(e.target.value)}
            variant="outlined"
            required
            disabled={!selectedAnimalForTest || generalLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            label="Numune Tarihi"
            type="date"
            value={newTestSampleDate}
            onChange={(e) => setNewTestSampleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            required
            disabled={!selectedAnimalForTest || generalLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreateNewTest}
            disabled={!selectedAnimalForTest || !newTestDetectionTag || !newTestSampleDate || generalLoading}
            sx={{ height: '56px' }} 
          >
            Test Kaydet
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderSonucGirisTab = () => {
    // Mevcut 'tests' state'i zaten 'SONUÇ BEKLENİYOR' olanları içeriyor (activeTab === 1 için)
    const filteredDisplayedTests = tests.filter(test => {
      const kupenoMatch = !sonucGirisKupeNoFilter || 
                          (test.tag_number && test.tag_number.toLowerCase().includes(sonucGirisKupeNoFilter.toLowerCase()));
      const tespitnoMatch = !sonucGirisTespitNoFilter || 
                            (test.detection_tag && test.detection_tag.toLowerCase().includes(sonucGirisTespitNoFilter.toLowerCase()));
      return kupenoMatch && tespitnoMatch;
    });

    return (
      <Paper elevation={3} sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Küpe No ile Filtrele"
            variant="outlined"
            size="small"
            value={sonucGirisKupeNoFilter}
            onChange={(e) => setSonucGirisKupeNoFilter(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            label="Tespit No ile Filtrele"
            variant="outlined"
            size="small"
            value={sonucGirisTespitNoFilter}
            onChange={(e) => setSonucGirisTespitNoFilter(e.target.value)}
            sx={{ flexGrow: 1 }}
        />
      </Box>
        <TableContainer>
          <Table stickyHeader>
          <TableHead>
            <TableRow>
                <TableCell>Küpe No</TableCell>
                <TableCell>Tespit No</TableCell>
                <TableCell>Numune Tarihi</TableCell>
                <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {generalLoading && <TableRow><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>}
              {!generalLoading && filteredDisplayedTests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="subtitle1" sx={{p:3}}>
                      {sonucGirisKupeNoFilter || sonucGirisTespitNoFilter ? 
                        'Filtre kriterlerine uygun test bulunamadı.' : 
                        'Sonuç bekleyen test bulunmamaktadır.'
                      }
                    </Typography>
                </TableCell>
                </TableRow>
              )}
              {!generalLoading && filteredDisplayedTests.map((test) => (
                <TableRow hover key={test.id}>
                  <TableCell sx={{cursor: 'pointer'}} onClick={() => handleOpenDetailModal(test)}>{test.tag_number}</TableCell>
                  <TableCell>{test.detection_tag || '-'}</TableCell>
                  <TableCell>{test.sample_date ? format(parseISO(test.sample_date), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sonuç Gir/Güncelle">
                      <IconButton onClick={() => handleOpenResultModal(test)} color="primary" size="small">
                    <EditIcon />
                  </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton onClick={() => handleDeleteTest(test.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                    </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>
    );
  };

  const renderTestSonuclariTab = () => (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'medium', color: 'primary.main' }}>
        Sonuçlanmış Testler
      </Typography>
      {generalLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
          <Table stickyHeader aria-label="sonuçlanmış testler tablosu">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Küpe No</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Tespit No</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Numune Tarihi</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Sonuç</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Sonuç Tarihi</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Notlar</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100', textAlign: 'center' }}>Detay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">Sonuçlanmış test bulunmamaktadır.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => (
                  <TableRow 
                    key={test.id} 
                    hover 
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => handleOpenDetailModal(test)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>{test.tag_number}</TableCell>
                    <TableCell>{test.detection_tag || '-'}</TableCell>
                    <TableCell>{test.sample_date ? format(parseISO(test.sample_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={test.status || '-'}
                        size="small" 
                        variant="outlined"
                        color={test.status === 'SONUÇLANDI' ? 'info' : 'default'} 
                      />
                    </TableCell>
                    <TableCell>
                      {test.result ? (
                        <Chip 
                          label={test.result}
                          size="small" 
                          color={getChipColorByResult(test.result)} 
                        />
                      ) : (
                        <Typography variant="caption" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>{test.result_date ? format(parseISO(test.result_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {test.notes || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detayları Görüntüle">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(test); }}>
                          <VisibilityIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );


  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      <Paper elevation={0} sx={{ mb: 3, p:2, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
         <Typography variant="h5" component="h1" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Test Yönetimi
        </Typography>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '8px 8px 0 0' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="test yönetimi sekmeleri" centered variant="fullWidth">
          <Tab label={<Stack direction="row" alignItems="center" spacing={1}><ScienceIcon fontSize="small"/>Test Girişi</Stack>} />
          <Tab label={<Stack direction="row" alignItems="center" spacing={1}><AssignmentTurnedInIcon fontSize="small"/>Sonuç Girişi</Stack>} />
          <Tab label={<Stack direction="row" alignItems="center" spacing={1}><ListAltIcon fontSize="small"/>Test Sonuçları</Stack>} />
        </Tabs>
      </Box>

      {activeTab === 0 && renderTestGirisTab()}
      {activeTab === 1 && renderSonucGirisTab()}
      {activeTab === 2 && renderTestSonuclariTab()}

      <TestResultModal
        open={resultModalOpen}
        onClose={() => { setResultModalOpen(false); setSelectedTestForUpdate(null); }}
        test={selectedTestForUpdate}
        onUpdate={handleUpdateTestResult}
      />
      <TestDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedTestForDetail(null); }}
        test={selectedTestForDetail}
      />
      <CustomAlert
        open={customAlert.open}
        message={customAlert.message}
        severity={customAlert.severity}
        onClose={() => setCustomAlert(prev => ({ ...prev, open: false }))}
      />
      {generalLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default TestList; 