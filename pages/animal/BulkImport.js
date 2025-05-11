import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useAnimal } from '../../contexts/AnimalContext';
import axios from 'axios';

// Örnek Excel/CSV içeriği
const sampleData = [
  {
    animal_id: 'HV001',
    ear_tag: 'TR12345678',
    gender: 'DISI',
    birth_date: '2022-05-15',
    category: 'INEK',
    breed: 'HOLSTEIN',
    weight: '450',
    status: 'AKTIF',
    notes: 'Yeni gelen hayvan'
  },
  {
    animal_id: 'HV002',
    ear_tag: 'TR12345679',
    gender: 'DISI',
    birth_date: '2022-06-10',
    category: 'GEBE_DUVE',
    breed: 'SIMENTAL',
    weight: '320',
    status: 'AKTIF',
    notes: 'Gebe düve'
  }
];

// Adımlar
const steps = ['Dosya Seçimi', 'Veri Doğrulama', 'İçe Aktarma'];

// Kabul edilen hayvan kategorileri ve cinsiyetleri
const validCategories = ['INEK', 'GEBE_DUVE', 'TOHUMLU_DUVE', 'DUVE', 'BUZAGI'];
const validGenders = ['ERKEK', 'DISI'];
const validStatuses = ['AKTIF', 'PASIF', 'HASTA', 'SATISA_HAZIR'];
const validBreeds = ['HOLSTEIN', 'SIMENTAL', 'MONTOFON', 'JERSEY', 'ANGUS', 'YERLI', 'MELEZ', 'DIGER'];

const BulkImport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { bulkCreateAnimals } = useAnimal();
  
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importResults, setImportResults] = useState({
    success: 0,
    failed: 0,
    messages: []
  });
  const [loading, setLoading] = useState(false);
  const [duplicateCheckField, setDuplicateCheckField] = useState('ear_tag');

  // Dosya yükleme işlemi
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet);
        
        setParsedData(parsedData);
        validateData(parsedData);
        setActiveStep(1);
      } catch (error) {
        console.error('Dosya okuma hatası:', error);
        toast.error('Dosya okunamadı. Lütfen geçerli bir Excel/CSV dosyası seçin.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Veri doğrulama
  const validateData = (data) => {
    const validationErrors = [];
    const uniqueValues = new Set();
    
    data.forEach((row, index) => {
      const rowErrors = [];
      const rowNumber = index + 1;
      
      // Zorunlu alanlar
      if (!row.animal_id) rowErrors.push('Hayvan ID eksik');
      if (!row.ear_tag) rowErrors.push('Küpe numarası eksik');
      if (!row.gender) rowErrors.push('Cinsiyet eksik');
      if (!row.category) rowErrors.push('Kategori eksik');
      
      // Cinsiyet kontrolü
      if (row.gender && !validGenders.includes(row.gender)) {
        rowErrors.push(`Geçersiz cinsiyet. Geçerli değerler: ${validGenders.join(', ')}`);
      }
      
      // Kategori kontrolü
      if (row.category && !validCategories.includes(row.category)) {
        rowErrors.push(`Geçersiz kategori. Geçerli değerler: ${validCategories.join(', ')}`);
      }
      
      // Durum kontrolü
      if (row.status && !validStatuses.includes(row.status)) {
        rowErrors.push(`Geçersiz durum. Geçerli değerler: ${validStatuses.join(', ')}`);
      }
      
      // Irk kontrolü
      if (row.breed && !validBreeds.includes(row.breed)) {
        rowErrors.push(`Geçersiz ırk. Geçerli değerler: ${validBreeds.join(', ')}`);
      }
      
      // Tarih formatı kontrolü
      if (row.birth_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.birth_date)) {
          rowErrors.push('Doğum tarihi YYYY-AA-GG formatında olmalıdır');
        }
      }
      
      // Benzersizlik kontrolü
      const checkValue = row[duplicateCheckField];
      if (checkValue) {
        if (uniqueValues.has(checkValue)) {
          rowErrors.push(`Bu ${duplicateCheckField} değeri listede tekrar ediyor`);
        } else {
          uniqueValues.add(checkValue);
        }
      }
      
      if (rowErrors.length > 0) {
        validationErrors.push({
          row: rowNumber,
          errors: rowErrors
        });
      }
    });
    
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  // Örnek şablon indirme
  const downloadTemplate = async () => {
    try {
      toast.info('Şablon indiriliyor...');
      
      // API URL'yi oluştur
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/animals/template`;
      
      // Axios ile blob olarak dosyayı indir
      const response = await axios.get(apiUrl, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Blob'ı indirilecek dosyaya dönüştür
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hayvan_yukleme_sablonu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Şablon başarıyla indirildi');
    } catch (err) {
      console.error('Şablon indirme hatası:', err);
      toast.error(`Şablon indirilirken bir hata oluştu: ${err.message}`);
    }
  };

  // Veri içe aktarma
  const importData = async () => {
    if (errors.length > 0) {
      toast.error('Lütfen önce veri hatalarını düzeltin.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await bulkCreateAnimals(parsedData);
      setImportResults({
        success: result.success || 0,
        failed: result.failed || 0,
        messages: result.messages || []
      });
      toast.success(`${result.success} hayvan başarıyla içe aktarıldı.`);
      setActiveStep(2);
    } catch (error) {
      console.error('İçe aktarma hatası:', error);
      toast.error('İçe aktarma sırasında bir hata oluştu.');
      setImportResults({
        success: 0,
        failed: parsedData.length,
        messages: [{ type: 'error', text: 'Sistem hatası: ' + (error.message || 'Bilinmeyen hata') }]
      });
      setActiveStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Adım geçişleri
  const handleNext = () => {
    if (activeStep === 1) {
      importData();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Tekrarlanan değer alanı değişimi
  const handleDuplicateCheckFieldChange = (event) => {
    setDuplicateCheckField(event.target.value);
    if (parsedData.length > 0) {
      validateData(parsedData);
    }
  };

  // Veri satırını kaldır
  const handleRemoveRow = (rowIndex) => {
    const newData = [...parsedData];
    newData.splice(rowIndex, 1);
    setParsedData(newData);
    validateData(newData);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate('/animals')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Toplu Hayvan İçe Aktarma
            </Typography>
          </Box>
          
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
          >
            Şablon İndir
          </Button>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 4 }} />
        
        {/* Adım 1: Dosya Seçimi */}
        {activeStep === 0 && (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Dosya Yükleme
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Excel (.xlsx) veya CSV formatında hayvan listesi yükleyin.
                    </Typography>
                    
                    <Box sx={{ textAlign: 'center', py: 5, border: '2px dashed #ccc', borderRadius: 2, mb: 2 }}>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                      />
                      <Button
                        variant="contained"
                        startIcon={<UploadFileIcon />}
                        onClick={() => fileInputRef.current.click()}
                        size="large"
                      >
                        Dosya Seç
                      </Button>
                      
                      {uploadedFile && (
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Seçilen dosya: {uploadedFile.name}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Nasıl Çalışır?
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Toplu hayvan içe aktarma işlemi 3 kolay adımda tamamlanır:
                    </Typography>
                    
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" paragraph>
                        <strong>1.</strong> Excel veya CSV formatında bir dosya yükleyin.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>2.</strong> Sisteme yüklenecek verileri gözden geçirin ve doğrulayın.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>3.</strong> İçe aktarma işlemini başlatın ve sonuçları kontrol edin.
                      </Typography>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <AlertTitle>İpucu</AlertTitle>
                      Şablon dosyasını indirerek başlayabilirsiniz. Bu dosya, gerekli tüm sütunları ve örnek verileri içerir.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
        
        {/* Adım 2: Veri Doğrulama */}
        {activeStep === 1 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity={errors.length > 0 ? "warning" : "success"}
                sx={{ mb: 2 }}
              >
                <AlertTitle>
                  {errors.length > 0 
                    ? `${errors.length} satırda hata bulundu` 
                    : 'Veriler doğrulandı'}
                </AlertTitle>
                {errors.length > 0 
                  ? 'Lütfen aşağıdaki hataları düzeltin veya hatalı satırları kaldırın.' 
                  : 'Tüm veriler geçerli. İçe aktarmaya hazır.'}
              </Alert>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    Toplam {parsedData.length} hayvan verisi yüklendi.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="duplicate-check-label">Tekrar Kontrolü</InputLabel>
                    <Select
                      labelId="duplicate-check-label"
                      value={duplicateCheckField}
                      label="Tekrar Kontrolü"
                      onChange={handleDuplicateCheckFieldChange}
                    >
                      <MenuItem value="ear_tag">Küpe Numarası</MenuItem>
                      <MenuItem value="animal_id">Hayvan ID</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell padding="checkbox" sx={{ color: 'white' }}>#</TableCell>
                    <TableCell sx={{ color: 'white' }}>Hayvan ID</TableCell>
                    <TableCell sx={{ color: 'white' }}>Küpe No</TableCell>
                    <TableCell sx={{ color: 'white' }}>Cinsiyet</TableCell>
                    <TableCell sx={{ color: 'white' }}>Kategori</TableCell>
                    <TableCell sx={{ color: 'white' }}>Irk</TableCell>
                    <TableCell sx={{ color: 'white' }}>Doğum Tarihi</TableCell>
                    <TableCell sx={{ color: 'white' }}>Durum</TableCell>
                    <TableCell sx={{ color: 'white' }}>İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.map((row, index) => {
                    const rowErrors = errors.find(err => err.row === index + 1);
                    const hasError = !!rowErrors;
                    
                    return (
                      <TableRow 
                        key={index}
                        sx={{ 
                          backgroundColor: hasError ? 'error.light' : 'inherit',
                          '&:nth-of-type(odd)': {
                            backgroundColor: hasError ? 'error.light' : 'action.hover',
                          }
                        }}
                      >
                        <TableCell>
                          {hasError ? (
                            <Tooltip title={rowErrors.errors.join(', ')}>
                              <ErrorIcon color="error" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>{row.animal_id || '-'}</TableCell>
                        <TableCell>{row.ear_tag || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.gender || '-'} 
                            size="small"
                            color={!row.gender ? 'default' : 
                              validGenders.includes(row.gender) ? 'primary' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={row.category || '-'} 
                            size="small"
                            color={!row.category ? 'default' : 
                              validCategories.includes(row.category) ? 'success' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{row.breed || '-'}</TableCell>
                        <TableCell>{row.birth_date || '-'}</TableCell>
                        <TableCell>{row.status || 'AKTIF'}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveRow(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
        
        {/* Adım 3: İçe Aktarma Sonuçları */}
        {activeStep === 2 && (
          <Box>
            <Alert 
              severity={importResults.failed > 0 ? "warning" : "success"}
              sx={{ mb: 3 }}
            >
              <AlertTitle>İçe Aktarma Tamamlandı</AlertTitle>
              {importResults.success} hayvan başarıyla içe aktarıldı.
              {importResults.failed > 0 && ` ${importResults.failed} hayvan içe aktarılamadı.`}
            </Alert>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      Başarılı İşlemler: {importResults.success}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="error.main">
                      Başarısız İşlemler: {importResults.failed}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {importResults.messages && importResults.messages.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  İşlem Mesajları
                </Typography>
                
                <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  {importResults.messages.map((message, index) => (
                    <Alert 
                      key={index} 
                      severity={message.type || 'info'}
                      sx={{ mb: 1 }}
                    >
                      {message.text}
                    </Alert>
                  ))}
                </Box>
              </Paper>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/animals')}
              >
                Hayvan Listesine Dön
              </Button>
            </Box>
          </Box>
        )}
        
        {/* İlerleme Butonları */}
        {activeStep < 2 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            {activeStep > 0 && (
              <Button 
                variant="outlined" 
                onClick={handleBack} 
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Geri
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !uploadedFile) || 
                (activeStep === 1 && (loading || parsedData.length === 0))
              }
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'İşleniyor...' : 
                activeStep === 1 ? 'İçe Aktarmayı Başlat' : 'Devam Et'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BulkImport; 