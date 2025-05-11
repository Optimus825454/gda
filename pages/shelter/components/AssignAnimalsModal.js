import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import Modal from '../../../components/common/Modal';

const AssignAnimalsModal = ({ isOpen, onClose, onAssign, selectedAnimalCount, paddocks }) => {
  const [selectedPaddock, setSelectedPaddock] = useState('');
  const [error, setError] = useState('');

  // Padok değişimi
  const handlePaddockChange = (e) => {
    setSelectedPaddock(e.target.value);
    setError('');
    };

  // Hayvanları atama işlemi
  const handleAssign = () => {
    if (!selectedPaddock) {
      setError('Lütfen bir padok seçin');
            return;
        }

    onAssign(selectedPaddock);
  };

  // Modal kapatıldığında durumu sıfırla
  const handleClose = () => {
    setSelectedPaddock('');
    setError('');
                onClose();
  };

  // Seçilen padokun kalan kapasitesini hesapla
  const getAvailableCapacity = (paddock) => {
    const currentCount = paddock.animalCount || 0;
    return paddock.capacity - currentCount;
  };

  // Padokları kalan kapasitelerine göre filtrele
  const availablePaddocks = paddocks.filter(paddock => 
    getAvailableCapacity(paddock) >= selectedAnimalCount
  );

    return (
        <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hayvanları Padoğa Ata"
      onConfirm={handleAssign}
      disableConfirmButton={!selectedPaddock}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="body2" gutterBottom>
            {`${selectedAnimalCount} hayvanı bir padoğa atamanız gerekiyor.`}
          </Typography>
        </Grid>

                {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
                )}

        {availablePaddocks.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="warning">
              Seçilen hayvan sayısı için yeterli kapasiteye sahip padok bulunmuyor. 
              Lütfen daha az hayvan seçin veya yeni bir padok oluşturun.
            </Alert>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <FormControl fullWidth error={!!error}>
              <InputLabel>Padok Seçin</InputLabel>
              <Select
                                    value={selectedPaddock}
                onChange={handlePaddockChange}
                label="Padok Seçin"
              >
                {availablePaddocks.map((paddock) => (
                  <MenuItem key={paddock.id} value={paddock.id}>
                    <Box>
                      <Typography variant="body1">{paddock.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`Doluluk: ${paddock.animalCount || 0}/${paddock.capacity} • Kalan: ${getAvailableCapacity(paddock)}`}
                      </Typography>
                      {paddock.animalType && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {`Tür: ${paddock.animalType}`}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {selectedPaddock && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Atama Özeti:</strong>
              </Typography>
              <Typography variant="body2">
                {`${selectedAnimalCount} hayvan, `}
                <strong>
                  {paddocks.find(p => p.id === selectedPaddock)?.name || ''}
                </strong>
                {` padoğuna atanacak.`}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
        </Modal>
    );
};

export default AssignAnimalsModal;