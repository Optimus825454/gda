import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Button
} from '@mui/material';
import { FaSearch, FaFilter } from 'react-icons/fa';
import AssignAnimalsModal from './AssignAnimalsModal';

const UnassignedAnimalsTable = ({ animals, paddocks, onAssignAnimals, isLoading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Sayfa değişimi
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Sayfa başına gösterilen hayvan sayısı değişimi
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Hayvan seçimi işlemleri
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredAnimals.map((animal) => animal.id);
      setSelectedAnimals(newSelected);
      return;
    }
    setSelectedAnimals([]);
  };

  const handleSelectAnimal = (event, id) => {
    const selectedIndex = selectedAnimals.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedAnimals, id];
    } else {
      newSelected = selectedAnimals.filter(animalId => animalId !== id);
    }

    setSelectedAnimals(newSelected);
  };

  const isSelected = (id) => selectedAnimals.indexOf(id) !== -1;

  // Arama işlemi
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Filtreleme
  const filteredAnimals = animals.filter(animal => {
    const searchFields = [
      animal.earringNumber || '',
      animal.name || '',
      animal.breed || '',
      animal.gender || '',
      animal.status || ''
    ].map(field => field.toLowerCase());
    
    return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
  });

  // Atama modal işlemleri
  const handleOpenAssignModal = () => {
    if (selectedAnimals.length > 0) {
      setIsAssignModalOpen(true);
    }
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  const handleAssignAnimals = (paddockId) => {
    onAssignAnimals(paddockId, selectedAnimals);
    setSelectedAnimals([]);
    setIsAssignModalOpen(false);
  };

  // Tabloda görüntülenecek hayvanlar
  const displayedAnimals = filteredAnimals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Padoksuz Hayvanlar</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Ara..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={selectedAnimals.length === 0}
            onClick={handleOpenAssignModal}
          >
            {`${selectedAnimals.length} Hayvanı Padoğa Ata`}
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedAnimals.length > 0 && selectedAnimals.length < filteredAnimals.length}
                  checked={filteredAnimals.length > 0 && selectedAnimals.length === filteredAnimals.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>Küpe No</TableCell>
              <TableCell>İsim</TableCell>
              <TableCell>Cins</TableCell>
              <TableCell>Cinsiyet</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Ağırlık (kg)</TableCell>
              <TableCell>Yaş</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedAnimals.length > 0 ? (
              displayedAnimals.map((animal) => {
                const isItemSelected = isSelected(animal.id);
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={animal.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={(event) => handleSelectAnimal(event, animal.id)}
                      />
                    </TableCell>
                    <TableCell>{animal.earringNumber}</TableCell>
                    <TableCell>{animal.name || '-'}</TableCell>
                    <TableCell>{animal.breed || '-'}</TableCell>
                    <TableCell>{animal.gender || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={animal.status || 'Bilinmiyor'} 
                        size="small" 
                        color={animal.status === 'Sağlıklı' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{animal.weight || '-'}</TableCell>
                    <TableCell>{animal.age ? `${animal.age} ay` : '-'}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {isLoading ? 'Yükleniyor...' : 'Atanmamış hayvan bulunmuyor'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredAnimals.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Sayfa başına hayvan:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

      <AssignAnimalsModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        onAssign={handleAssignAnimals}
        selectedAnimalCount={selectedAnimals.length}
        paddocks={paddocks}
      />
    </>
  );
};

export default UnassignedAnimalsTable; 