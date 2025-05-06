import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Typography,
  Divider,
  Paper,
  Box,
  Chip,
  Stack
} from '@mui/material';
import Modal from '../../../components/common/Modal';

const TestDetailModal = ({ isOpen, onClose, test }) => {
  if (!test) return null;

  // Tarih formatlarını çevir
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Sonuç durumu rengini belirle
  const getResultColor = (result) => {
    if (!result) return 'warning';
    switch (result) {
      case 'POZITIF': return 'error';
      case 'NEGATIF': return 'success';
      case 'SONUÇ BEKLENIYOR': return 'info';
      case 'İŞLEM YAPILMADI': return 'default';
      default: return 'default';
    }
  };

  // Sonuç metni formatla
  const formatResult = (result) => {
    if (!result) return 'BEKLİYOR';
    switch (result) {
      case 'POZITIF': return 'POZİTİF';
      case 'NEGATIF': return 'NEGATİF';
      default: return result;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Detayları"
      maxWidth="md"
      hideConfirmButton
    >
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {/* Hayvan Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Hayvan Bilgileri
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Küpe No
            </Typography>
            <Typography variant="body1" fontWeight="500">
              {test.animal_id || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Hayvan Adı
            </Typography>
            <Typography variant="body1" fontWeight="500">
              {test.animal_name || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Tespit Küpesi
            </Typography>
            <Typography variant="body1" fontWeight="500">
              {test.detection_tag || '-'}
            </Typography>
          </Grid>

          {/* Test Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Test Bilgileri
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Kan Alma Tarihi
            </Typography>
            <Typography variant="body1" fontWeight="500">
              {formatDate(test.sample_date)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Sonuç
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip 
                label={formatResult(test.result)} 
                color={getResultColor(test.result)} 
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Sonuç Tarihi
            </Typography>
            <Typography variant="body1" fontWeight="500">
              {formatDate(test.result_date)}
            </Typography>
          </Grid>

          {/* Notlar */}
          {test.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Notlar
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2">
                  {test.notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Modal>
  );
};

TestDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  test: PropTypes.object
};

export default TestDetailModal; 