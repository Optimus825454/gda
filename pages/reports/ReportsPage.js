import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardActionArea, CardContent, Badge, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment'; // Genel rapor ikonu
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman'; // Gebe ikonu
import PetsIcon from '@mui/icons-material/Pets'; // Hayvan ikonu
import ScienceIcon from '@mui/icons-material/Science'; // Test ikonu
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // Satış/Kesim ikonu
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Sevk ikonu
import StarIcon from '@mui/icons-material/Star'; // Damızlık ikonu
import ListAltIcon from '@mui/icons-material/ListAlt'; // Liste ikonu
import axiosInstance from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const reportLinks = [
  { 
    title: 'Gebe İnekler Listesi', 
    path: '/reports/pregnant-cows', 
    countKey: 'pregnant_cows_count',
    detailEndpoint: '/animals/reports/pregnant-cows', 
    icon: <PregnantWomanIcon fontSize="large" color="primary" /> 
  },
  { 
    title: 'Gebe Düveler Listesi', 
    path: '/reports/pregnant-heifers', 
    countKey: 'pregnant_heifers_count',
    detailEndpoint: '/animals/reports/pregnant-heifers', 
    icon: <PregnantWomanIcon fontSize="large" color="secondary" /> 
  },
  { 
    title: 'Kuru İnekler Listesi', 
    path: '/reports/dry-cows', 
    countKey: 'dry_cows_count',
    detailEndpoint: '/animals/reports/dry-cows', 
    icon: <PetsIcon fontSize="large" color="action" /> 
  },
  { 
    title: 'Erkek Buzağı Listesi', 
    path: '/reports/male-calves', 
    countKey: 'male_calves_count',
    detailEndpoint: '/animals/reports/male-calves', 
    icon: <PetsIcon fontSize="large" color="success" /> 
  },
  { 
    title: 'Test Yapılan Hayvanlar', 
    path: '/reports/tested-animals', 
    countKey: 'tested_animals_count',
    detailEndpoint: '/animals/reports/tested-animals', 
    icon: <ScienceIcon fontSize="large" color="warning" /> 
  },
  { 
    title: 'Test Yapılmamış Hayvanlar', 
    path: '/reports/untested-animals', 
    countKey: 'untested_animals_count',
    detailEndpoint: '/animals/reports/untested-animals', 
    icon: <ScienceIcon fontSize="large" color="disabled" /> 
  },
  { 
    title: 'Satılan Hayvanlar Listesi', 
    path: '/reports/sold-animals', 
    countKey: 'sold_animals_count',
    detailEndpoint: '/animals/reports/sold-animals', 
    icon: <TrendingDownIcon fontSize="large" color="info" /> 
  },
  { 
    title: 'Kesilen Hayvanlar Listesi', 
    path: '/reports/slaughtered-animals', 
    countKey: 'slaughtered_animals_count',
    detailEndpoint: '/animals/reports/slaughtered-animals', 
    icon: <TrendingDownIcon fontSize="large" color="error" /> 
  },
  { 
    title: 'Kesime Sevk Edilenler', 
    path: '/reports/slaughter-referral', 
    countKey: 'slaughter_referral_count',
    detailEndpoint: '/animals/reports/slaughter-referral', 
    icon: <LocalShippingIcon fontSize="large" color="error" /> 
  },
  { 
    title: 'Damızlık Olarak Ayrılanlar', 
    path: '/reports/breeding-stock', 
    countKey: 'breeding_stock_count',
    detailEndpoint: '/animals/reports/breeding-stock', 
    icon: <StarIcon fontSize="large" color="warning" /> 
  },
  { 
    title: 'Tüm İnekler Listesi', 
    path: '/reports/all-cows', 
    countKey: 'all_cows_count',
    detailEndpoint: '/animals/reports/all-cows', 
    icon: <ListAltIcon fontSize="large" color="primary" /> 
  }
];

const ReportsPage = () => {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        console.log('[DEBUG] Rapor sayıları alınıyor...');
        const response = await axiosInstance.get('/dashboard/animal-report-counts');
        
        if (response.data) {
          console.log('[DEBUG] Alınan rapor sayıları:', response.data);
          setCounts(response.data);
        } else {
          throw new Error('Rapor sayıları alınamadı: Geçersiz yanıt formatı');
        }
      } catch (error) {
        console.error('Rapor sayıları alınırken hata:', error);
        toast.error('Rapor sayıları alınamadı. Lütfen sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <AssessmentIcon sx={{ mr: 1 }} /> Hayvan Raporları
      </Typography>
      <Grid container spacing={3}>
        {reportLinks.map((report, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea component={RouterLink} to={report.path} sx={{ flexGrow: 1 }}>
                <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                  <Box sx={{ mb: 1 }}>
                    {loading ? (
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        {report.icon}
                        <CircularProgress 
                          size={20} 
                          sx={{ 
                            position: 'absolute', 
                            top: -10, 
                            right: -10 
                          }} 
                        />
                      </Box>
                    ) : (
                      <Badge 
                        badgeContent={counts[report.countKey] || 0} 
                        color="primary"
                        max={999}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.8rem',
                            padding: '0 6px',
                            height: 20,
                            minWidth: 20,
                          }
                        }}
                      >
                        {report.icon}
                      </Badge>
                    )}
                  </Box>
                  <Typography variant="h6" component="div">
                    {report.title}
                  </Typography>
                  {!loading && (
                    <Typography variant="body2" color="text.secondary">
                      Toplam: {counts[report.countKey] || 0} hayvan
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default ReportsPage; 