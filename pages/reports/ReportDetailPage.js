import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Box
} from '@mui/material';
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const ReportDetailPage = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { reportType } = useParams();
  const location = useLocation();

  // Rapor başlığını belirle
  const getReportTitle = () => {
    const pathSegments = location.pathname.split('/');
    const reportPath = `/${pathSegments[1]}/${pathSegments[2]}`;
    
    const reportConfig = {
      '/reports/pregnant-cows': 'Gebe İnekler Listesi',
      '/reports/pregnant-heifers': 'Gebe Düveler Listesi',
      '/reports/dry-cows': 'Kuru İnekler Listesi',
      '/reports/male-calves': 'Erkek Buzağı Listesi',
      '/reports/tested-animals': 'Test Yapılan Hayvanlar',
      '/reports/untested-animals': 'Test Yapılmamış Hayvanlar',
      '/reports/sold-animals': 'Satılan Hayvanlar Listesi',
      '/reports/slaughtered-animals': 'Kesilen Hayvanlar Listesi',
      '/reports/slaughter-referral': 'Kesime Sevk Edilenler',
      '/reports/breeding-stock': 'Damızlık Olarak Ayrılanlar',
      '/reports/all-cows': 'Tüm İnekler Listesi'
    };

    return reportConfig[reportPath] || 'Rapor Detayı';
  };

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/animals/reports/${reportType}`);
        
        if (response.data && response.data.success) {
          setAnimals(response.data.data);
        } else {
          throw new Error('Hayvan listesi alınamadı');
        }
      } catch (error) {
        console.error('Hayvan listesi alınırken hata:', error);
        toast.error('Hayvan listesi alınamadı. Lütfen sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    };

    if (reportType) {
      fetchAnimals();
    }
  }, [reportType]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {getReportTitle()}
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Küpe No</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Yaş</TableCell>
              <TableCell>Son Test Tarihi</TableCell>
              <TableCell>Oluşturma Tarihi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {animals.map((animal) => (
              <TableRow key={animal.id}>
                <TableCell>{animal.kupe_no}</TableCell>
                <TableCell>{animal.kategori}</TableCell>
                <TableCell>{animal.durum}</TableCell>
                <TableCell>{animal.yas}</TableCell>
                <TableCell>{animal.son_test_tarihi ? new Date(animal.son_test_tarihi).toLocaleDateString('tr-TR') : '-'}</TableCell>
                <TableCell>{new Date(animal.olusturma_tarihi).toLocaleDateString('tr-TR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ReportDetailPage; 