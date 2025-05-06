import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Chip, 
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Grid
} from '@mui/material';
import { FaEllipsisV, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import PaddockModal from './PaddockModal';

const ShelterCard = ({ 
  shelter, 
  onEdit, 
  onDelete, 
  onAddPaddock, 
  onEditPaddock, 
  onDeletePaddock, 
  onPaddockClick
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [paddockMenuAnchor, setPaddockMenuAnchor] = useState(null);
  const [selectedPaddock, setSelectedPaddock] = useState(null);
  const [isPaddockModalOpen, setIsPaddockModalOpen] = useState(false);
  const [paddockModalMode, setPaddockModalMode] = useState('create');

  // Ana menü işlemleri
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Padok menü işlemleri
  const handlePaddockMenuOpen = (event, paddock) => {
    event.stopPropagation();
    setPaddockMenuAnchor(event.currentTarget);
    setSelectedPaddock(paddock);
  };

  const handlePaddockMenuClose = () => {
    setPaddockMenuAnchor(null);
    setSelectedPaddock(null);
  };

  // Barınak işlemleri
  const handleEditShelter = () => {
    handleMenuClose();
    onEdit(shelter);
  };

  const handleDeleteShelter = () => {
    handleMenuClose();
    onDelete(shelter.id);
  };

  // Padok ekleme işlemi
  const handleAddPaddock = () => {
    setPaddockModalMode('create');
    setSelectedPaddock(null);
    setIsPaddockModalOpen(true);
  };

  // Padok düzenleme işlemi
  const handleEditPaddock = () => {
    handlePaddockMenuClose();
    setPaddockModalMode('edit');
    setIsPaddockModalOpen(true);
  };

  // Padok silme işlemi
  const handleDeletePaddock = () => {
    handlePaddockMenuClose();
    onDeletePaddock(selectedPaddock.id);
  };

  // Padok modal kapatma
  const handlePaddockModalClose = () => {
    setIsPaddockModalOpen(false);
    setSelectedPaddock(null);
  };

  // Padok modal kaydetme
  const handlePaddockModalSave = (paddockData) => {
    if (paddockModalMode === 'create') {
      onAddPaddock({ 
        ...paddockData, 
        shelterId: shelter.id 
      });
    } else {
      onEditPaddock(selectedPaddock.id, paddockData);
    }
    setIsPaddockModalOpen(false);
  };

  // Padok tıklama
  const handlePaddockClick = (paddock) => {
    onPaddockClick(paddock);
  };

  // Hayvan sayısına göre renk belirleme
  const getCapacityColor = (capacity, animalCount) => {
    const ratio = animalCount / capacity;
    if (ratio < 0.5) return 'success.main';
    if (ratio < 0.9) return 'warning.main';
    return 'error.main';
  };

  return (
    <>
      <Card 
        elevation={3} 
        sx={{ 
          margin: 2, 
          position: 'relative',
          borderRadius: 2
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8
          }}
        >
          <Typography variant="h6">{shelter.name}</Typography>
          <Box>
            <Chip 
              label={`${shelter.paddocks?.length || 0} Padok`} 
              size="small" 
              color="secondary"
              sx={{ mr: 1 }}
            />
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ color: 'white' }}
            >
              <FaEllipsisV />
            </IconButton>
          </Box>
        </Box>

        <CardContent>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Konum:</strong> {shelter.location || 'Belirtilmemiş'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Toplam Kapasite:</strong> {shelter.totalCapacity || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                <strong>Açıklama:</strong> {shelter.description || 'Açıklama yok'}
              </Typography>
            </Grid>
          </Grid>

          {/* Padoklar bölümü */}
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">Padoklar</Typography>
              <Button 
                startIcon={<FaPlus />} 
                size="small" 
                color="primary" 
                variant="outlined" 
                onClick={handleAddPaddock}
              >
                Padok Ekle
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {shelter.paddocks && shelter.paddocks.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {shelter.paddocks.map(paddock => (
                  <Card 
                    key={paddock.id} 
                    variant="outlined" 
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' } 
                    }}
                    onClick={() => handlePaddockClick(paddock)}
                  >
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">{paddock.name}</Typography>
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={`${paddock.animalCount || 0}/${paddock.capacity}`} 
                            size="small" 
                            sx={{ 
                              mr: 1,
                              bgcolor: getCapacityColor(paddock.capacity, paddock.animalCount || 0),
                              color: 'white'
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={(e) => handlePaddockMenuOpen(e, paddock)}
                          >
                            <FaEllipsisV size={12} />
                          </IconButton>
                        </Box>
                      </Box>
                      {paddock.animalType && (
                        <Typography variant="caption" color="text.secondary">
                          Hayvan Türü: {paddock.animalType}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                Bu barınakta henüz padok bulunmuyor.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Barınak menüsü */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditShelter}>
          <FaEdit style={{ marginRight: 8 }} /> Düzenle
        </MenuItem>
        <MenuItem onClick={handleDeleteShelter}>
          <FaTrash style={{ marginRight: 8 }} /> Sil
        </MenuItem>
      </Menu>
      
      {/* Padok menüsü */}
      <Menu
        anchorEl={paddockMenuAnchor}
        open={Boolean(paddockMenuAnchor)}
        onClose={handlePaddockMenuClose}
      >
        <MenuItem onClick={handleEditPaddock}>
          <FaEdit style={{ marginRight: 8 }} /> Düzenle
        </MenuItem>
        <MenuItem onClick={handleDeletePaddock}>
          <FaTrash style={{ marginRight: 8 }} /> Sil
        </MenuItem>
      </Menu>

      {/* Padok Düzenleme/Ekleme Modal */}
      <PaddockModal
        isOpen={isPaddockModalOpen}
        onClose={handlePaddockModalClose}
        onSave={handlePaddockModalSave}
        paddock={selectedPaddock}
        mode={paddockModalMode}
      />
    </>
  );
};

export default ShelterCard; 