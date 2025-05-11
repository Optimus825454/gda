import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import { FaCalendarAlt, FaVial } from 'react-icons/fa';
import Modal from '../../../components/common/Modal';
import axiosInstance from '../../../utils/axiosConfig';

// Test sonuç seçenekleri
const resultOptions = [
  { value: "İŞLEM YAPILMADI", label: "İŞLEM YAPILMADI" },
  { value: "SONUÇ BEKLENIYOR", label: "SONUÇ BEKLENIYOR" },
  { value: "POZITIF", label: "POZİTİF" },
  { value: "NEGATIF", label: "NEGATİF" }
];

const initialFormData = {
  animal_id: '',
  sample_date: null,
  result: '',
  result_date: null,
  notes: '',
  detection_tag: ''  // Tespit küpesi numarası
};

const TestResultModal = ({ isOpen, onClose, onSave, test, mode = 'edit' }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Test verisi değiştiğinde form verilerini güncelle
  useEffect(() => {
    if (test) {
      const testData = {
        ...test,
        sample_date: test.sample_date ? new Date(test.sample_date) : null,
        result_date: test.result_date ? new Date(test.result_date) : null
      };
      setFormData(testData);
    } else {
      setFormData(initialFormData);
    }
    setErrors({});

    // Modal açıldığında hayvanları getir
    if (isOpen && !test) {
      fetchAnimals();
    }
  }, [test, isOpen]);

  // Hayvanları getir
  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/animals');
      if (response.data?.data) {
        setAnimals(response.data.data);
      } else {
        console.warn('Hayvan listesi boş veya yanlış formatta');
        setAnimals([]);
      }
    } catch (error) {
      console.error('Hayvanlar yüklenirken hata:', error);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  // Form alanı değişikliğini işle
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Tarih değişikliğini işle
  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form doğrulama
  const validate = () => {
    const newErrors = {};
    
    if (!formData.animal_id) {
      newErrors.animal_id = 'Hayvan seçimi zorunludur';
    }
    
    if (!formData.sample_date) {
      newErrors.sample_date = 'Kan alma tarihi zorunludur';
    }
    
    if (formData.result && !formData.result_date) {
      newErrors.result_date = 'Sonuç tarihi zorunludur';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formu gönder
  const handleSubmit = () => {
    if (validate()) {
      // API için tarihleri formatlama
      const formattedData = {
        ...formData,
        sample_date: formData.sample_date ? formData.sample_date.toISOString() : null,
        result_date: formData.result_date ? formData.result_date.toISOString() : null
      };
      
      onSave(formattedData);
    }
  };

  // Modal başlığını belirle
  const getModalTitle = () => {
    if (test) return 'Test Sonucunu Düzenle';
    if (mode === 'add') return 'Yeni Kan Testi Ekle';
    if (mode === 'result') return 'Test Sonucu Girişi';
    return 'Test Kaydı';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      onConfirm={handleSubmit}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
        <Grid container spacing={2}>
          {/* Hayvan Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Hayvan Bilgileri
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Hayvan (Küpe No)"
              name="animal_id"
              value={formData.animal_id}
              onChange={handleChange}
              error={!!errors.animal_id}
              helperText={errors.animal_id || (loading ? 'Yükleniyor...' : '')}
              disabled={!!test || loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaVial />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {animals.map((animal) => (
                <MenuItem key={animal.id} value={animal.animal_id}>
                  {animal.animal_id} 
                  {animal.name && ` - ${animal.name}`}
                  {animal.testpit_no && ` (Mevcut Tespit No: ${animal.testpit_no})`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tespit Küpesi No"
              name="detection_tag"
              value={formData.detection_tag || ''}
              onChange={handleChange}
              placeholder="Kan tüpüne yazılan tespit küpesi numarası..."
              helperText={
                animals.find(a => a.animal_id === formData.animal_id)?.testpit_no 
                  ? `Mevcut Tespit No: ${animals.find(a => a.animal_id === formData.animal_id).testpit_no}`
                  : "Test sonucunun takibi için kullanılan numara"
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Kan Alma Tarihi"
              value={formData.sample_date}
              onChange={(date) => handleDateChange('sample_date', date)}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  error: !!errors.sample_date,
                  helperText: errors.sample_date,
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
          </Grid>

          {/* Test Sonuç Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Test Sonuç Bilgileri
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Sonuç"
              name="result"
              value={formData.result || ''}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaVial />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {resultOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {formData.result && (
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Sonuç Tarihi"
                value={formData.result_date}
                onChange={(date) => handleDateChange('result_date', date)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!errors.result_date,
                    helperText: errors.result_date,
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
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notlar"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Test ile ilgili notlar..."
            />
          </Grid>
        </Grid>
      </LocalizationProvider>
    </Modal>
  );
};

TestResultModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  test: PropTypes.object,
  mode: PropTypes.oneOf(['add', 'edit', 'result'])
};

export default TestResultModal; 