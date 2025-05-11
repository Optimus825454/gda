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
  Alert as MuiAlert,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress
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
  FaTint,
  FaTrash
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
import { format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { tr } from 'date-fns/locale';
import LoadingCow from '../../components/common/LoadingCow';

// Yaş hesaplama fonksiyonu
const calculateAge = ( birthDateStr ) => {
  if ( !birthDateStr ) return '-';

  const birthDate = new Date( birthDateStr );
  const today = new Date();

  const years = differenceInYears( today, birthDate );
  if ( years > 0 ) return `${years} yaş`;

  const months = differenceInMonths( today, birthDate );
  if ( months > 0 ) return `${months} ay`;

  const days = differenceInDays( today, birthDate );
  return `${days} gün`;
};

// Yeni kan alma modalı bileşeni
const BloodSampleModal = ( { isOpen, onClose, onSave, animal } ) => {
  const [detectionTag, setDetectionTag] = useState( '' );
  const [error, setError] = useState( '' );

  useEffect( () => {
    if ( isOpen ) {
      setDetectionTag( '' );
      setError( '' );
    }
  }, [isOpen] );

  const handleSave = () => {
    if ( !detectionTag.trim() ) {
      setError( 'Tespit no alanı zorunludur' );
      return;
    }

    onSave( {
      animal_id: animal.animal_id,
      detection_tag: detectionTag,
      sample_date: new Date().toISOString(),
      result: 'SONUÇ BEKLENIYOR'
    } );
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
          onChange={( e ) => {
            setDetectionTag( e.target.value );
            if ( e.target.value.trim() ) setError( '' );
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
  // State tanımlamaları
  const [tests, setTests] = useState( [] );
  const [animals, setAnimals] = useState( [] );
  const [loading, setLoading] = useState( false );
  const [searchLoading, setSearchLoading] = useState( false );
  const [animalSearchTerm, setAnimalSearchTerm] = useState( '' );
  const [selectedAnimal, setSelectedAnimal] = useState( null );
  const [selectedTest, setSelectedTest] = useState( null );
  const [suggestions, setSuggestions] = useState( [] );
  const [isDialogOpen, setIsDialogOpen] = useState( false );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState( false );
  const [testFormData, setTestFormData] = useState( {
    sampleDate: format( new Date(), 'yyyy-MM-dd' ),
    detectionTag: '',
    status: 'SONUÇ BEKLENİYOR',
    result: ''
  } );

  // Yeni state tanımlamaları - Hayvanlar için
  const { fetchAnimals, loading: animalsLoading } = useAnimal();
  const [isAnimalDetailOpen, setIsAnimalDetailOpen] = useState( false );
  const [isBloodSampleModalOpen, setIsBloodSampleModalOpen] = useState( false );

  // Yeni state tanımlamaları - Snackbar için
  const [snackbar, setSnackbar] = useState( {
    open: false,
    message: '',
    severity: 'success'
  } );

  // Verileri yükle
  useEffect( () => {
    fetchTests();
    fetchAnimals();
  }, [fetchAnimals] );

  const fetchTests = async () => {
    setLoading( true );
    try {
      const response = await axiosInstance.get( '/blood-samples' );
      if ( response.data && Array.isArray( response.data.data ) ) {
        console.log( 'Gelen test verileri:', response.data.data );
        setTests( response.data.data );
      } else {
        console.error( 'Geçersiz veri formatı:', response.data );
        toast.error( 'Test verileri geçersiz formatta.' );
      }
    } catch ( error ) {
      console.error( 'Test verileri yüklenirken hata:', error );
      toast.error( 'Test verileri yüklenirken bir hata oluştu.' );
    } finally {
      setLoading( false );
    }
  };

  // Hayvanları filtrele
  const filteredAnimals = animals.filter( animal => {
    if ( animalSearchTerm.length < 2 ) return false; // En az 2 karakter girildiğinde filtrelemeye başla

    const searchTermLower = animalSearchTerm.toLowerCase();
    return animal.animal_id?.toLowerCase().includes( searchTermLower ) ||
      ( animal.kupeno && animal.kupeno.toLowerCase().includes( searchTermLower ) ) ||
      ( animal.name && animal.name.toLowerCase().includes( searchTermLower ) );
  } );

  // Hayvan arama değiştiğinde
  useEffect( () => {
    const timer = setTimeout( () => {
      loadAnimals( animalSearchTerm );
    }, 300 );

    return () => clearTimeout( timer );
  }, [animalSearchTerm] );

  // Hayvanları yükle
  const loadAnimals = async ( searchTerm ) => {
    if ( searchTerm.length < 2 ) {
      setSuggestions( [] );
      return;
    }

    try {
      setSearchLoading( true );
      const response = await axiosInstance.get( '/animals/search', { // Endpoint /animals/search olarak güncellendi
        params: {
          query: searchTerm, // Parametre adı 'query' olarak güncellendi (AnimalController.searchAnimals'a göre)
          limit: 5
          // 'exact' parametresi kaldırıldı, searchAnimals fonksiyonu bunu beklemiyor
        }
      } );

      // Gelen sonuçları tam eşleşme için filtrele (GEÇİCİ OLARAK DEVRE DIŞI BIRAKILDI)
      // const exactMatches = (response.data.data || []).filter(animal => {
      //   const animalId = (animal.kupeno || '').toLowerCase();
      //   const searchLower = searchTerm.toLowerCase();
      //   return animalId.includes(searchLower);
      // });

      setSuggestions( response.data.data || [] );
    } catch ( error ) {
      console.error( 'Hayvanlar yüklenirken hata:', error );
      toast.error( 'Hayvanlar yüklenemedi' );
    } finally {
      setSearchLoading( false );
    }
  };

  // Test silme işlevi
  const handleDeleteTest = async ( testId ) => {
    try {
      const response = await axiosInstance.delete( `/blood-samples/${testId}` );

      let message = 'Test kaydı başarıyla silindi';
      if ( response.data?.data?.tespitnoTemizlendi ) {
        message += `. ${response.data.data.kupeno} küpe numaralı hayvanın tespit numarası temizlendi.`;
      }

      setSnackbar( {
        open: true,
        message,
        severity: 'success'
      } );

      fetchTests(); // Listeyi yenile
    } catch ( error ) {
      console.error( 'Test silinirken hata:', error );
      setSnackbar( {
        open: true,
        message: error.response?.data?.message || 'Test silinirken bir hata oluştu',
        severity: 'error'
      } );
    }
  };

  // Test güncelleme işlevi güncellendi
  const handleUpdateTest = async ( testId ) => {
    try {
      const response = await axiosInstance.put( `/blood-samples/${testId}`, testFormData );

      let message = 'Test kaydı başarıyla güncellendi';
      let severity = 'success';

      if ( testFormData.status === 'SONUÇLANDI' && testFormData.result ) {
        const amac = testFormData.result === 'POZİTİF' ? 'Kesim' : 'Damızlık';
        message = `Test kaydı güncellendi. Hayvanın amacı "${amac}" olarak değiştirildi.`;
      }

      setSnackbar( {
        open: true,
        message,
        severity
      } );

      fetchTests();
      setIsDialogOpen( false );
    } catch ( error ) {
      console.error( 'Test güncellenirken hata:', error );
      setSnackbar( {
        open: true,
        message: error.response?.data?.message || 'Test güncellenirken bir hata oluştu',
        severity: 'error'
      } );
    }
  };

  // Test kaydetme işlemi güncellendi
  const handleSaveTest = async () => {
    if ( !selectedAnimal || !testFormData.sampleDate || !testFormData.detectionTag ) {
      setSnackbar( {
        open: true,
        message: 'Lütfen tüm zorunlu alanları doldurun',
        severity: 'warning'
      } );
      return;
    }

    try {
      setLoading( true );

      const testData = {
        animal_id: selectedAnimal.id,
        tag_number: selectedAnimal.kupeno,
        sample_date: testFormData.sampleDate,
        status: testFormData.status,
        result: testFormData.result || null,
        detection_tag: testFormData.detectionTag
      };

      const response = await axiosInstance.post( '/blood-samples', testData );

      setSnackbar( {
        open: true,
        message: 'Test kaydı başarıyla oluşturuldu',
        severity: 'success'
      } );

      fetchTests();
      setIsDialogOpen( false );
      setSelectedAnimal( null );
      setTestFormData( {
        sampleDate: format( new Date(), 'yyyy-MM-dd' ),
        detectionTag: '',
        status: 'SONUÇ BEKLENİYOR',
        result: ''
      } );
    } catch ( error ) {
      console.error( 'Test kaydedilirken hata:', error );
      setSnackbar( {
        open: true,
        message: error.response?.data?.message || 'Test kaydedilemedi',
        severity: 'error'
      } );
    } finally {
      setLoading( false );
    }
  };

  // Test görüntüleme işlevi
  const handleViewTest = ( test ) => {
    setSelectedTest( test );
    setIsViewDialogOpen( true );
  };

  // Test düzenleme işlevi güncellendi
  const handleEditTest = ( test ) => {
    setSelectedTest( test );
    setTestFormData( {
      ...test,
      sampleDate: format( new Date( test.sample_date ), 'yyyy-MM-dd' ),
      detectionTag: test.detection_tag || '',
      status: test.status || 'SONUÇ BEKLENİYOR',
      result: test.result || ''
    } );
    setIsDialogOpen( true );
  };

  // Sütun tanımlamaları güncellendi
  const testColumns = [
    {
      field: 'tag_number',
      headerName: 'Küpe No',
      width: 130,
      renderCell: ( params ) => (
        <Tooltip title="Detayları görüntülemek için tıklayın">
          <Box
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => handleViewTest( params.row )}
          >
            {params.value}
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'detection_tag',
      headerName: 'Tespit No',
      width: 130
    },
    {
      field: 'sample_date',
      headerName: 'Numune Tarihi',
      width: 130,
      valueFormatter: ( params ) => {
        if ( !params.value ) return '-';
        try {
          return format( new Date( params.value ), 'dd.MM.yyyy', { locale: tr } );
        } catch ( error ) {
          return '-';
        }
      }
    },
    {
      field: 'result',
      headerName: 'Durum',
      width: 130,
      renderCell: ( params ) => {
        if ( !params.value ) {
          return (
            <Chip
              label="Sonuç Bekleniyor"
              color="warning"
              size="small"
            />
          );
        }
        return (
          <Chip
            label={params.value}
            color={params.value === 'POZİTİF' ? 'error' : 'success'}
            size="small"
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 130,
      sortable: false,
      renderCell: ( params ) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEditTest( params.row )}
            title="Düzenle"
          >
            <FaEdit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              if ( window.confirm( 'Bu test kaydını silmek istediğinize emin misiniz?' ) ) {
                handleDeleteTest( params.row.id );
              }
            }}
            title="Sil"
            color="error"
          >
            <FaTrash />
          </IconButton>
        </Box>
      )
    }
  ];

  // Hayvan detay görüntüleme
  const handleShowAnimalDetail = ( animal ) => {
    setSelectedAnimal( animal );
    setIsAnimalDetailOpen( true );
  };

  // Snackbar işlemleri
  const handleCloseSnackbar = () => {
    setSnackbar( prev => ( { ...prev, open: false } ) );
  };

  // Sayfa içeriği
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Sol Taraf - Hayvan Arama ve Seçim */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Hayvan Seçimi
            </Typography>

            <TextField
              fullWidth
              label="Hayvan Ara (Küpe No, İsim)"
              value={animalSearchTerm}
              onChange={( e ) => setAnimalSearchTerm( e.target.value )}
              sx={{ mb: 2 }}
              helperText="En az 2 karakter girin"
              InputProps={{
                endAdornment: searchLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />

            {suggestions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {suggestions.map( ( animal ) => (
                  <Button
                    key={animal.id}
                    fullWidth
                    variant="outlined"
                    sx={{
                      mb: 1,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5
                    }}
                    onClick={() => {
                      setSelectedAnimal( animal );
                      setSuggestions( [] );
                      setIsDialogOpen( true );
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          minWidth: '120px',
                          fontWeight: 'bold'
                        }}
                      >
                        {animal.kupeno}
                      </Typography>

                      <Chip
                        label={animal.durum || '-'}
                        size="small"
                        color={
                          animal.durum === 'AKTİF' ? 'success' :
                            animal.durum === 'SATILDI' ? 'info' :
                              animal.durum === 'ÖLÜM' ? 'error' : 'default'
                        }
                        sx={{ minWidth: '80px' }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          minWidth: '100px',
                          color: 'text.secondary'
                        }}
                      >
                        {animal.kategori || '-'}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          ml: 'auto'
                        }}
                      >
                        {calculateAge( animal.dogtar )}
                      </Typography>
                    </Box>
                  </Button>
                ) )}
              </Box>
            )}

            {searchLoading && suggestions.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <LoadingCow size={48} color="#1976d2" />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sağ Taraf - Test Listesi */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Test Listesi
            </Typography>

            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={tests}
                columns={testColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                loading={loading}
                components={{
                  Toolbar: GridToolbar,
                  LoadingOverlay: () => (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      width: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      zIndex: 1
                    }}>
                      <LoadingCow size={64} color="#1976d2" />
                    </Box>
                  )
                }}
                localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Test Ekleme/Düzenleme Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen( false )} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTest ? 'Test Sonucunu Güncelle' : 'Yeni Test Kaydı'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedTest ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Sonuç</InputLabel>
                <Select
                  value={testFormData.result || ''}
                  onChange={( e ) => handleTestResultChange( e.target.value )}
                  label="Sonuç"
                >
                  <MenuItem value="">Sonuç Bekleniyor</MenuItem>
                  <MenuItem value="POZİTİF">Pozitif</MenuItem>
                  <MenuItem value="NEGATİF">Negatif</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Numune Tarihi"
                  type="date"
                  value={testFormData.sampleDate}
                  onChange={( e ) => setTestFormData( { ...testFormData, sampleDate: e.target.value } )}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Tespit No"
                  value={testFormData.detectionTag}
                  onChange={( e ) => setTestFormData( { ...testFormData, detectionTag: e.target.value } )}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen( false )}>İptal</Button>
          <Button
            onClick={() => selectedTest ? handleUpdateTest( selectedTest.id ) : handleSaveTest()}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Görüntüleme Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen( false )}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FaVial size={20} />
            Test Detayları
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTest && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Hayvan Bilgileri
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Küpe No
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {selectedTest.tag_number}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Tespit No
                        </Typography>
                        <Typography variant="body1">
                          {selectedTest.detection_tag || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Test Bilgileri
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Numune Tarihi
                        </Typography>
                        <Typography variant="body1">
                          {format( new Date( selectedTest.sample_date ), 'dd.MM.yyyy', { locale: tr } )}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Durum
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={selectedTest.status === 'SONUÇ BEKLENİYOR' ? 'Sonuç Bekleniyor' : 'Sonuçlandı'}
                            color={selectedTest.status === 'SONUÇ BEKLENİYOR' ? 'warning' : 'success'}
                            size="small"
                          />
                        </Box>
                      </Box>
                      {selectedTest.result && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Sonuç
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={selectedTest.result}
                              color={selectedTest.result === 'POZİTİF' ? 'error' : 'success'}
                              size="small"
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Kayıt Bilgileri
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Oluşturulma Tarihi
                        </Typography>
                        <Typography variant="body1">
                          {format( new Date( selectedTest.created_at ), 'dd.MM.yyyy HH:mm', { locale: tr } )}
                        </Typography>
                      </Box>
                      {selectedTest.updated_at && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Son Güncelleme
                          </Typography>
                          <Typography variant="body1">
                            {format( new Date( selectedTest.updated_at ), 'dd.MM.yyyy HH:mm', { locale: tr } )}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen( false )}>Kapat</Button>
          <Button
            variant="contained"
            startIcon={<FaEdit />}
            onClick={() => {
              setIsViewDialogOpen( false );
              handleEditTest( selectedTest );
            }}
          >
            Düzenle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modallar */}
      {isAnimalDetailOpen && selectedAnimal && (
        <Dialog
          open={isAnimalDetailOpen}
          onClose={() => {
            setIsAnimalDetailOpen( false );
            setSelectedAnimal( null );
          }}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Hayvan Detayları
              </Typography>
              <Button onClick={() => {
                setIsAnimalDetailOpen( false );
                setSelectedAnimal( null );
              }} color="inherit">Kapat</Button>
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
                      Doğum Tarihi: {selectedAnimal.birth_date ? new Date( selectedAnimal.birth_date ).toLocaleDateString( 'tr-TR' ) : '-'}
                    </Typography>
                    <Typography>
                      Yaş: {calculateAge( selectedAnimal.birth_date )}
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
                onClick={() => {
                  setIsAnimalDetailOpen( false );
                  setSelectedAnimal( null );
                }}
              >
                Kapat
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<FaTint />}
                onClick={() => {
                  setIsAnimalDetailOpen( false );
                  setSelectedAnimal( null );
                  setIsBloodSampleModalOpen( true );
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
          onClose={() => {
            setIsBloodSampleModalOpen( false );
            setSelectedAnimal( null );
          }}
          onSave={handleSaveTest}
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
          sx={{ width: '100%', maxWidth: '600px', fontSize: '1rem' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default TestList;