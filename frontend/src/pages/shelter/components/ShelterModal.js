import React, { useState, useEffect } from 'react';
import {
  TextField,
  Grid,
  InputAdornment,
  Box
} from '@mui/material';
import Modal from '../../../components/common/Modal';

const initialFormData = {
  name: '',
  location: '',
  totalCapacity: '',
  description: ''
};

const ShelterModal = ({ isOpen, onClose, onSave, shelter, mode = 'create' }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (shelter && mode === 'edit') {
      setFormData({
        name: shelter.name || '',
        location: shelter.location || '',
        totalCapacity: shelter.totalCapacity || '',
        description: shelter.description || ''
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [shelter, mode, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Hata temizleme
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Barınak adı gereklidir';
    }
    
    if (formData.totalCapacity && (isNaN(formData.totalCapacity) || parseInt(formData.totalCapacity) <= 0)) {
      newErrors.totalCapacity = 'Geçerli bir kapasite giriniz';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const dataToSubmit = {
        ...formData,
        totalCapacity: formData.totalCapacity ? parseInt(formData.totalCapacity) : null
      };
      
      onSave(dataToSubmit);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Yeni Barınak Ekle' : 'Barınak Düzenle'}
      onConfirm={handleSubmit}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Barınak Adı"
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
            label="Konum"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Şehir, ilçe veya bölge..."
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Toplam Kapasite"
            name="totalCapacity"
            type="number"
            value={formData.totalCapacity}
            onChange={handleChange}
            error={!!errors.totalCapacity}
            helperText={errors.totalCapacity}
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: <InputAdornment position="end">hayvan</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Açıklama"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            placeholder="Barınak hakkında ek bilgi..."
          />
        </Grid>
      </Grid>
    </Modal>
  );
};

export default ShelterModal;