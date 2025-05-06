import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardActionArea, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment'; // Genel rapor ikonu
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman'; // Gebe ikonu
import PetsIcon from '@mui/icons-material/Pets'; // Hayvan ikonu
import ScienceIcon from '@mui/icons-material/Science'; // Test ikonu
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // Satış/Kesim ikonu
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Sevk ikonu
import StarIcon from '@mui/icons-material/Star'; // Damızlık ikonu
import ListAltIcon from '@mui/icons-material/ListAlt'; // Liste ikonu

const reportLinks = [
  { title: 'Gebe İnekler Listesi', path: '/reports/pregnant-cows', icon: <PregnantWomanIcon fontSize="large" color="primary" /> },
  { title: 'Gebe Düveler Listesi', path: '/reports/pregnant-heifers', icon: <PregnantWomanIcon fontSize="large" color="secondary" /> },
  { title: 'Kuru İnekler Listesi', path: '/reports/dry-cows', icon: <PetsIcon fontSize="large" color="action" /> },
  { title: 'Erkek Buzağı Listesi', path: '/reports/male-calves', icon: <PetsIcon fontSize="large" color="success" /> },
  { title: 'Test Yapılan Hayvanlar', path: '/reports/tested-animals', icon: <ScienceIcon fontSize="large" color="warning" /> },
  { title: 'Test Yapılmamış Hayvanlar', path: '/reports/untested-animals', icon: <ScienceIcon fontSize="large" color="disabled" /> },
  { title: 'Satılan Hayvanlar Listesi', path: '/reports/sold-animals', icon: <TrendingDownIcon fontSize="large" color="info" /> },
  { title: 'Kesilen Hayvanlar Listesi', path: '/reports/slaughtered-animals', icon: <TrendingDownIcon fontSize="large" color="error" /> },
  { title: 'Kesime Sevk Edilenler', path: '/reports/slaughter-referral', icon: <LocalShippingIcon fontSize="large" color="error" /> },
  { title: 'Damızlık Olarak Ayrılanlar', path: '/reports/breeding-stock', icon: <StarIcon fontSize="large" color="warning" /> },
  { title: 'Tüm İnekler Listesi', path: '/reports/all-cows', icon: <ListAltIcon fontSize="large" color="primary" /> },
  // İhtiyaç halinde diğer raporlar buraya eklenebilir
];

const ReportsPage = () => {
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
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 1 }}>{report.icon}</Box>
                  <Typography variant="h6" component="div">
                    {report.title}
                  </Typography>
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