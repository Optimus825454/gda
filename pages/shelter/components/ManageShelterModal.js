import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import { FaTimes } from 'react-icons/fa';
import ShelterModal from './ShelterModal';
import PaddockModal from './PaddockModal';

// Tab paneli içeriği
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

const ManageShelterModal = ({ 
  isOpen, 
  onClose, 
  shelter, 
  onSaveShelter,
  onSavePaddock,
  paddock = null
}) => {
  const [tabValue, setTabValue] = useState(paddock ? 1 : 0);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleShelterSave = (shelterData) => {
    onSaveShelter(shelterData, shelter?.id);
  };

  const handlePaddockSave = (paddockData) => {
    onSavePaddock(paddockData, paddock?.id);
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {shelter ? 'Barınak Yönetimi' : 'Yeni Barınak Ekle'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <FaTimes />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {shelter && (
          <>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Barınak Bilgileri" />
              <Tab label="Padok Yönetimi" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <ShelterModal 
                isOpen={true}
                onClose={() => {}}
                onSave={handleShelterSave}
                shelter={shelter}
                mode="edit"
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <PaddockModal 
                isOpen={true}
                onClose={() => {}}
                onSave={handlePaddockSave}
                paddock={paddock}
                mode={paddock ? 'edit' : 'create'}
              />
            </TabPanel>
          </>
        )}
        
        {!shelter && (
          <ShelterModal 
            isOpen={true}
            onClose={() => {}}
            onSave={handleShelterSave}
            mode="create"
          />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ManageShelterModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shelter: PropTypes.object,
  onSaveShelter: PropTypes.func.isRequired,
  onSavePaddock: PropTypes.func.isRequired,
  paddock: PropTypes.object
};

export default ManageShelterModal; 