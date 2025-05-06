import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Alert,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSale } from '../../contexts/SaleContext';
import { useAnimal } from '../../contexts/AnimalContext';
import { toast } from 'react-toastify';

const SaleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { createSale, updateSaleDetails, sales, fetchSales, loading: saleLoading } = useSale();
  const { animals, fetchAnimals, loading: animalLoading } = useAnimal();
  
  // Form state
  const [formData, setFormData] = useState({
    animal_id: '',
    buyer: '',
    sale_type: 'DAMIZLIK',
    sale_date: new Date(),
    status: 'BEKLEMEDE',
    notes: ''
  });
  
  // Errors state
  const [errors, setErrors] = useState({});
  
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableAnimals, setAvailableAnimals] = useState([]);

  // Veri yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        // Hayvanları yükle
        await fetchAnimals();
        
        // Düzenleme modundaysa satış verilerini getir
        if (isEditMode) {
          await fetchSales();
        }
      } catch (err) {
        console.error('Veri yüklenirken hata:', err);
        setError('Veriler yüklenirken bir hata oluştu.');
      }
    };
    
    loadData();
  }, [fetchAnimals, fetchSales, isEditMode]);

  // Satışa uygun hayvanları filtrele
  useEffect(() => {
    if (animals) {
      // Sadece satışa uygun hayvanları (SATISA_HAZIR olanlar) listeye ekle
      // veya düzenleme modundaysa mevcut hayvanı da dahil et
      const filtered = animals.filter(animal => 
        animal.sale_status === 'SATISA_HAZIR' || 
        (isEditMode && selectedAnimal && animal.id === selectedAnimal.id)
      );
      setAvailableAnimals(filtered);
    }
  }, [animals, isEditMode, selectedAnimal]);

  // Düzenleme modunda verileri doldur
  useEffect(() => {
    if (isEditMode && sales && sales.length > 0) {
      const currentSale = sales.find(sale => sale.id === parseInt(id) || sale.id === id);
      
      if (currentSale) {
        // Formu doldur
        setFormData({
          animal_id: currentSale.animal_id || '',
          buyer: currentSale.buyer || '',
          sale_type: currentSale.sale_type || 'DAMIZLIK',
          sale_date: currentSale.sale_date ? new Date(currentSale.sale_date) : new Date(),
          status: currentSale.status || 'BEKLEMEDE',
          notes: currentSale.notes || ''
        });
        
        // Seçili hayvanı ayarla
        if (currentSale.animal_id && animals) {
          const animal = animals.find(a => a.id === currentSale.animal_id);
          setSelectedAnimal(animal || null);
        }
      }
    }
  }, [isEditMode, id, sales, animals]);

  // Form alanlarında değişiklik
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Tarih değişikliği
  const handleDateChange = (newDate) => {
    setFormData(prevData => ({
      ...prevData,
      sale_date: newDate
    }));
  };

  // Hayvan seçiminde değişiklik
  const handleAnimalChange = (event, newValue) => {
    setSelectedAnimal(newValue);
    setFormData(prevData => ({
      ...prevData,
      animal_id: newValue?.id || ''
    }));
  };
  
  // Form doğrulama
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.animal_id) {
      newErrors.animal_id = 'Hayvan seçimi zorunludur';
    }
    
    if (!formData.buyer) {
      newErrors.buyer = 'Alıcı bilgisi zorunludur';
    }
    
    if (!formData.sale_date) {
      newErrors.sale_date = 'Satış tarihi zorunludur';
    } else if (formData.sale_date > new Date()) {
      newErrors.sale_date = 'Satış tarihi gelecekte olamaz';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formu gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setFormSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode) {
        // Mevcut satışı güncelle
        await updateSaleDetails(id, formData);
        toast.success('Satış bilgileri başarıyla güncellendi');
      } else {
        // Yeni satış oluştur
        await createSale(formData);
        toast.success('Yeni satış kaydı başarıyla oluşturuldu');
      }
      
      // Satış listesine dön
      navigate('/sales');
    } catch (err) {
      console.error('Form gönderilirken hata:', err);
      setError(err.response?.data?.error || 'İşlem sırasında bir hata oluştu');
      toast.error(err.response?.data?.error || 'Satış kaydedilemedi');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Form iptal
  const handleCancel = () => {
    navigate('/sales');
  };

  // Yükleniyor durum kontrolü
  const isLoading = saleLoading || animalLoading || formSubmitting;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {isEditMode ? 'Satış Düzenle' : 'Yeni Satış Kaydı'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Hayvan Seçimi */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  id="animal-select"
                  options={availableAnimals}
                  getOptionLabel={(option) => 
                    `${option.ear_tag || 'Küpe No Yok'} - ${option.animal_id || 'ID Yok'}`
                  }
                  value={selectedAnimal}
                  onChange={handleAnimalChange}
                  loading={animalLoading}
                  disabled={isLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Hayvan Seçimi"
                      variant="outlined"
                      error={!!errors.animal_id}
                      helperText={errors.animal_id}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {animalLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              
              {/* Alıcı Bilgisi */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="buyer"
                  name="buyer"
                  label="Alıcı"
                  variant="outlined"
                  value={formData.buyer}
                  onChange={handleChange}
                  error={!!errors.buyer}
                  helperText={errors.buyer}
                  disabled={isLoading}
                />
              </Grid>
              
              {/* Satış Türü */}
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <Typography variant="subtitle2" gutterBottom>
                    Satış Türü
                  </Typography>
                  <RadioGroup
                    row
                    name="sale_type"
                    value={formData.sale_type}
                    onChange={handleChange}
                  >
                    <FormControlLabel 
                      value="DAMIZLIK" 
                      control={<Radio disabled={isLoading} />} 
                      label="Damızlık" 
                    />
                    <FormControlLabel 
                      value="KESIM" 
                      control={<Radio disabled={isLoading} />} 
                      label="Kesim" 
                    />
                  </RadioGroup>
                  {errors.sale_type && (
                    <FormHelperText error>{errors.sale_type}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              {/* Satış Tarihi */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Satış Tarihi"
                  value={formData.sale_date}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      error={!!errors.sale_date}
                      helperText={errors.sale_date}
                    />
                  )}
                  disabled={isLoading}
                />
              </Grid>
              
              {/* Durum (Sadece düzenleme modunda) */}
              {isEditMode && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="status-label">Durum</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Durum"
                      disabled={isLoading}
                    >
                      <MenuItem value="BEKLEMEDE">Beklemede</MenuItem>
                      <MenuItem value="TAMAMLANDI">Tamamlandı</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {/* Notlar */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Notlar"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={formData.notes}
                  onChange={handleChange}
                  error={!!errors.notes}
                  helperText={errors.notes}
                  disabled={isLoading}
                />
              </Grid>
              
              {/* Seçili Hayvanın Detayları (Eğer varsa) */}
              {selectedAnimal && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Seçili Hayvan Bilgileri
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Hayvan ID
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.animal_id || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Küpe No
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.ear_tag || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Cinsiyet
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.gender === 'ERKEK' ? 'Erkek' : 'Dişi'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Kategori
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.category || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {/* Form Butonları */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    disabled={isLoading}
                    startIcon={<CancelIcon />}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={24} /> : <SaveIcon />}
                  >
                    {isLoading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default SaleForm;