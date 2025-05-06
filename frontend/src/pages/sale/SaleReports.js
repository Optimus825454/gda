import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  CircularProgress,
  TextField,
  Alert
} from '@mui/material';
import { useSale } from '../../contexts/SaleContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';

// Pie chart renkleri (bilgi için tutuluyor)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SaleReports = () => {
  const { sales, fetchSales, fetchSaleStatistics } = useSale();
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [reportType, setReportType] = useState('all');
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    breedingSales: 0,
    slaughterSales: 0,
    pendingSales: 0,
    completedSales: 0
  });
  const [exporting, setExporting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        await fetchSales();
        await fetchSaleStatistics();
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        toast.error('Rapor verileri yüklenirken bir hata oluştu');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  }, [fetchSales, fetchSaleStatistics]);

  // Filtre ve rapor verilerini hazırla
  useEffect(() => {
    if (!sales || sales.length === 0) return;

    // Tarih aralığına göre filtrele
    let filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Rapor türüne göre filtrele
    if (reportType === 'breeding') {
      filteredSales = filteredSales.filter(sale => sale.sale_type === 'DAMIZLIK');
    } else if (reportType === 'slaughter') {
      filteredSales = filteredSales.filter(sale => sale.sale_type === 'KESIM');
    }

    // Özet verileri hesapla
    const totalSales = filteredSales.length;
    const breedingSales = filteredSales.filter(sale => sale.sale_type === 'DAMIZLIK').length;
    const slaughterSales = filteredSales.filter(sale => sale.sale_type === 'KESIM').length;
    const pendingSales = filteredSales.filter(sale => sale.status === 'BEKLEMEDE').length;
    const completedSales = filteredSales.filter(sale => sale.status === 'TAMAMLANDI').length;
    
    setSummaryData({
      totalSales,
      breedingSales,
      slaughterSales,
      pendingSales,
      completedSales
    });

    // Çubuk grafik verileri hazırla - aylara göre
    const monthlyData = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          breeding: 0,
          slaughter: 0,
          total: 0
        };
      }
      
      monthlyData[monthYear].total += 1;
      
      if (sale.sale_type === 'DAMIZLIK') {
        monthlyData[monthYear].breeding += 1;
      } else if (sale.sale_type === 'KESIM') {
        monthlyData[monthYear].slaughter += 1;
      }
    });
    
    // Chart verileri için dönüştür ve sırala
    const chartDataArray = Object.values(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/').map(Number);
      const [bMonth, bYear] = b.month.split('/').map(Number);
      return (aYear * 100 + aMonth) - (bYear * 100 + bMonth);
    });
    
    setChartData(chartDataArray);
    
    // Pie chart için veri hazırla
    const pieChartData = [
      { name: 'Damızlık', value: breedingSales },
      { name: 'Kesim', value: slaughterSales },
      { name: 'Beklemede', value: pendingSales },
      { name: 'Tamamlandı', value: completedSales }
    ].filter(item => item.value > 0);
    
    setPieData(pieChartData);
    
  }, [sales, startDate, endDate, reportType]);

  // Rapor türü değişikliği
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  // Başlangıç tarihi değişikliği
  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
  };

  // Bitiş tarihi değişikliği
  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
  };

  // PDF formatında rapor oluştur
  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Başlık
      doc.setFontSize(16);
      doc.text('Satış Raporu', 14, 20);
      
      // Tarih aralığı
      doc.setFontSize(10);
      doc.text(`Rapor Dönemi: ${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`, 14, 30);
      
      // Rapor türü
      let reportTypeName = 'Tüm Satışlar';
      if (reportType === 'breeding') reportTypeName = 'Damızlık Satışlar';
      if (reportType === 'slaughter') reportTypeName = 'Kesim Satışlar';
      doc.text(`Rapor Türü: ${reportTypeName}`, 14, 35);
      
      // Özet veriler
      doc.setFontSize(12);
      doc.text('Özet Bilgiler', 14, 45);
      
      const summaryTableData = [
        ['Toplam Satış', summaryData.totalSales.toString()],
        ['Damızlık Satış Sayısı', summaryData.breedingSales.toString()],
        ['Kesim Satış Sayısı', summaryData.slaughterSales.toString()],
        ['Bekleyen Satış Sayısı', summaryData.pendingSales.toString()],
        ['Tamamlanan Satış Sayısı', summaryData.completedSales.toString()]
      ];
      
      doc.autoTable({
        startY: 50,
        head: [['Metrik', 'Değer']],
        body: summaryTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 50 }
      });
      
      // Aylık veriler tablosu
      doc.setFontSize(12);
      doc.text('Aylık Satış Verileri', 14, doc.autoTable.previous.finalY + 10);
      
      const monthlyTableData = chartData.map(data => [
        data.month,
        data.breeding.toString(),
        data.slaughter.toString(),
        data.total.toString()
      ]);
      
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 15,
        head: [['Ay', 'Damızlık', 'Kesim', 'Toplam']],
        body: monthlyTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      // Dosyayı kaydet
      doc.save('satis_raporu.pdf');
      
      toast.success('PDF raporu başarıyla oluşturuldu');
    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      toast.error('PDF raporu oluşturulurken bir hata oluştu');
    } finally {
      setExporting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Satış Raporları
        </Typography>
        
        {/* Filtreler */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="report-type-label">Rapor Türü</InputLabel>
                <Select
                  labelId="report-type-label"
                  id="report-type"
                  value={reportType}
                  label="Rapor Türü"
                  onChange={handleReportTypeChange}
                >
                  <MenuItem value="all">Tüm Satışlar</MenuItem>
                  <MenuItem value="breeding">Damızlık Satışlar</MenuItem>
                  <MenuItem value="slaughter">Kesim Satışlar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={startDate}
                onChange={handleStartDateChange}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Bitiş Tarihi"
                value={endDate}
                onChange={handleEndDateChange}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={exportPDF}
                disabled={exporting || loadingData}
                startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
              >
                {exporting ? 'Dışa Aktarılıyor...' : 'PDF Raporu İndir'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Özet Metrikler */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Toplam Satış Sayısı
                </Typography>
                <Typography variant="h4" color="primary">
                  {summaryData.totalSales}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Damızlık Satışlar
                </Typography>
                <Typography variant="h4" color="info.main">
                  {summaryData.breedingSales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam satışların %{summaryData.totalSales > 0 ? Math.round((summaryData.breedingSales / summaryData.totalSales) * 100) : 0}'i
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kesim Satışlar
                </Typography>
                <Typography variant="h4" color="error.main">
                  {summaryData.slaughterSales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam satışların %{summaryData.totalSales > 0 ? Math.round((summaryData.slaughterSales / summaryData.totalSales) * 100) : 0}'i
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tamamlanan Satışlar
                </Typography>
                <Typography variant="h4" color="success.main">
                  {summaryData.completedSales}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam satışların %{summaryData.totalSales > 0 ? Math.round((summaryData.completedSales / summaryData.totalSales) * 100) : 0}'i
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Grafikler */}
        <Grid container spacing={3}>
          {/* Çubuk Grafik */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Aylık Satış Analizi
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <CircularProgress />
                </Box>
              ) : chartData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <Typography variant="body1" color="text.secondary">
                    Seçili tarih aralığında veri bulunamadı
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', flexDirection: 'column' }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Grafik görüntülemek için 'recharts' paketini yüklemeniz gerekiyor.
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Verileriniz hesaplandı ancak görsel grafik için gerekli paketler yüklü değil.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Pasta Grafik */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Satış Dağılımı
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <CircularProgress />
                </Box>
              ) : pieData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <Typography variant="body1" color="text.secondary">
                    Seçili tarih aralığında veri bulunamadı
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', flexDirection: 'column' }}>
                  <Alert severity="info">
                    Grafik görüntülemek için 'recharts' paketini yüklemeniz gerekiyor.
                  </Alert>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default SaleReports; 