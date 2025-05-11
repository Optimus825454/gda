import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  IconButton, 
  Tabs, 
  Tab,
  TextField,
  InputAdornment,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useSale } from '../../contexts/SaleContext';
import { toast } from 'react-toastify';

// Tarih formatı
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const SaleList = () => {
  const navigate = useNavigate();
  const { sales, loading, fetchSales, fetchSaleStatistics } = useSale();
  const [tabValue, setTabValue] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchSales();
        await fetchSaleStatistics();
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        toast.error('Satış verileri yüklenirken bir hata oluştu.');
      }
    };
    
    loadData();
  }, [fetchSales, fetchSaleStatistics]);

  // Filtreleme işlemi
  useEffect(() => {
    if (!sales) return;
    
    const filtered = sales.filter(sale => {
      const searchText = filterText.toLowerCase();
      const statusMatch = tabValue === 0 || 
        (tabValue === 1 && sale.status === 'BEKLEMEDE') || 
        (tabValue === 2 && sale.status === 'TAMAMLANDI');
      
      // Filtre metni boşsa sadece duruma göre filtrele
      if (!searchText) return statusMatch;
      
      // Metin filtresi uygula
      return statusMatch && (
        (sale.animal_id && sale.animal_id.toLowerCase().includes(searchText)) ||
        (sale.ear_tag && sale.ear_tag.toLowerCase().includes(searchText)) ||
        (sale.buyer && sale.buyer.toLowerCase().includes(searchText))
      );
    });
    
    setFilteredSales(filtered);
  }, [sales, filterText, tabValue]);

  // Veri yenileme
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSales();
      await fetchSaleStatistics();
      toast.success('Veriler güncellendi');
    } catch (error) {
      toast.error('Veriler güncellenirken hata oluştu');
    } finally {
      setRefreshing(false);
    }
  };

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Grid sütunları
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'animal_id', headerName: 'Hayvan ID', width: 120 },
    { field: 'ear_tag', headerName: 'Küpe No', width: 120 },
    { 
      field: 'sale_type', 
      headerName: 'Satış Türü', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'DAMIZLIK' ? 'Damızlık' : 'Kesim'} 
          color={params.value === 'DAMIZLIK' ? 'primary' : 'error'} 
          size="small" 
        />
      )
    },
    { field: 'buyer', headerName: 'Alıcı', width: 150 },
    { 
      field: 'sale_date', 
      headerName: 'Satış Tarihi', 
      width: 130,
      valueFormatter: (params) => formatDate(params.value)
    },
    { 
      field: 'status', 
      headerName: 'Durum', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'BEKLEMEDE' ? 'Beklemede' : 'Tamamlandı'} 
          color={params.value === 'BEKLEMEDE' ? 'warning' : 'success'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Düzenle">
            <IconButton 
              size="small" 
              onClick={() => navigate(`/sales/${params.row.id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Detay">
            <IconButton 
              size="small" 
              onClick={() => navigate(`/sales/${params.row.id}`)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Satış Yönetimi
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/sales/new"
            sx={{ mr: 1 }}
          >
            Yeni Satış
          </Button>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Yenileniyor...' : 'Yenile'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Satış Sayısı
              </Typography>
              <Typography variant="h4" color="success.main">
                {sales?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam satış kaydı sayısı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="sale-tabs">
            <Tab label="Tüm Satışlar" />
            <Tab label="Bekleyen Satışlar" />
            <Tab label="Tamamlanan Satışlar" />
          </Tabs>
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            label="Arama"
            variant="outlined"
            size="small"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Hayvan ID, Küpe No veya Alıcı..."
            sx={{ width: 300 }}
          />
          
          <Button
            variant="outlined"
            color="secondary"
            component={Link}
            to="/sales/reports"
            startIcon={<AssessmentIcon />}
          >
            Satış Raporları
          </Button>
        </Box>
        
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={filteredSales}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            loading={loading}
            density="standard"
            getRowId={(row) => row.id}
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none'
              }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SaleList;