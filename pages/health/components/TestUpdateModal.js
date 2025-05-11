import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';

const TestUpdateModal = ({ open, onClose, test, onUpdate }) => {
  const [result, setResult] = useState(test?.result || '');
  const [notes, setNotes] = useState(test?.notes || '');

  const handleSubmit = () => {
    onUpdate({
      ...test,
      result,
      notes
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Test Güncelle</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Sonuç</InputLabel>
          <Select
            value={result}
            onChange={(e) => setResult(e.target.value)}
            label="Sonuç"
          >
            <MenuItem value="">Seçiniz</MenuItem>
            <MenuItem value="POZİTİF">POZİTİF</MenuItem>
            <MenuItem value="NEGATİF">NEGATİF</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Notlar"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Güncelle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestUpdateModal; 