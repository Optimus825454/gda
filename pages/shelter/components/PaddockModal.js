import React, { useState, useEffect } from 'react';
import {
  TextField,
  Grid,
  MenuItem,
  InputAdornment,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Box,
  Typography
} from '@mui/material';
import Modal from '../../../components/common/Modal';

const animalTypes = [
  { value: 'Büyükbaş', label: 'Büyükbaş' },
  { value: 'Küçükbaş', label: 'Küçükbaş' },
  { value: 'Kümes Hayvanı', label: 'Kümes Hayvanı' },
  { value: 'Diğer', label: 'Diğer' }
];

const initialFormData = {
  name: '',
  capacity: '',
  animalType: '',
  features: '',
  width: '',
  length: '',
  height: ''
};

const PaddockModal = ({ isOpen, onClose, onSave, paddock, mode = 'create' }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (paddock && mode === 'edit') {
      setFormData({
        name: paddock.name || '',
        capacity: paddock.capacity || '',
        animalType: paddock.animalType || '',
        features: paddock.features || '',
        width: paddock.width || '',
        length: paddock.length || '',
        height: paddock.height || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [paddock, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Hata doğrulama kontrolü
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Padok adı gereklidir';
    }
    
    if (!formData.capacity) {
      newErrors.capacity = 'Kapasite gereklidir';
    } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Geçerli bir kapasite giriniz';
    }
    
    if (!formData.animalType) {
      newErrors.animalType = 'Hayvan türü seçiniz';
    }
    
    // Boyut alanları sayı olmalı
    ['width', 'length', 'height'].forEach(field => {
      if (formData[field] && (isNaN(formData[field]) || parseFloat(formData[field]) <= 0)) {
        newErrors[field] = 'Geçerli bir değer giriniz';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const dataToSubmit = {
        ...formData,
        capacity: parseInt(formData.capacity),
        width: formData.width ? parseFloat(formData.width) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        height: formData.height ? parseFloat(formData.height) : null
      };
      
      onSave(dataToSubmit);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Yeni Padok Ekle' : 'Padok Düzenle'}
      onConfirm={handleSubmit}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Padok Adı"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            autoFocus
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Kapasite"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            error={!!errors.capacity}
            helperText={errors.capacity}
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: <InputAdornment position="end">hayvan</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.animalType}>
            <InputLabel id="animal-type-label">Hayvan Türü</InputLabel>
            <Select
              labelId="animal-type-label"
              name="animalType"
              value={formData.animalType}
              onChange={handleChange}
              label="Hayvan Türü"
            >
              {animalTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {errors.animalType && <FormHelperText>{errors.animalType}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider />
          <Box mt={2} mb={1}>
            <Typography variant="subtitle2">Padok Boyutları (Opsiyonel)</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Genişlik"
            name="width"
            type="number"
            value={formData.width}
            onChange={handleChange}
            error={!!errors.width}
            helperText={errors.width}
            InputProps={{
              inputProps: { min: 0, step: "0.1" },
              endAdornment: <InputAdornment position="end">m</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Uzunluk"
            name="length"
            type="number"
            value={formData.length}
            onChange={handleChange}
            error={!!errors.length}
            helperText={errors.length}
            InputProps={{
              inputProps: { min: 0, step: "0.1" },
              endAdornment: <InputAdornment position="end">m</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Yükseklik"
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            error={!!errors.height}
            helperText={errors.height}
            InputProps={{
              inputProps: { min: 0, step: "0.1" },
              endAdornment: <InputAdornment position="end">m</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Özellikler"
            name="features"
            value={formData.features}
            onChange={handleChange}
            multiline
            rows={3}
            placeholder="Padok özellikleri, ekipmanlar, notlar..."
          />
        </Grid>
      </Grid>
    </Modal>
  );
};

export default PaddockModal;