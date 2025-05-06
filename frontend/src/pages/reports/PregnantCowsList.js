import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios'; // Aktif
import { jsPDF } from 'jspdf'; // Aktif
import 'jspdf-autotable'; // Aktif
import * as XLSX from 'xlsx'; // Aktif
import { toast } from 'react-toastify'; // Toastify eklendi

const columns = [
  // Örnek kolonlar - Gerçek verilere göre güncellenmeli
  // Backend'den gelen yanıta göre burayı ayarlamak en doğrusu olur.
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'animal_id', headerName: 'Hayvan ID', width: 120 }, // API yanıtına göre düzenle
  { field: 'ear_tag', headerName: 'Küpe No', width: 150 }, // API yanıtına göre düzenle
  { field: 'animal_name', headerName: 'Adı', width: 150 }, // API yanıtına göre düzenle
  { field: 'insemination_date', headerName: 'Tohumlama Tarihi', width: 180 }, // API yanıtına göre düzenle
  { field: 'expected_birth_date', headerName: 'Tahmini Doğum Tarihi', width: 200 }, // API yanıtına göre düzenle
  // ... diğer gerekli kolonlar (backend yanıtına göre eklenecek)
];

const PregnantCowsList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // Export durumu için state

  useEffect(() => {
    const fetchPregnantCows = async () => {
      setLoading(true);
      try {
        // Doğru API endpoint'ini kullan
        const response = await axios.get('/api/animals/reports/pregnant-cows');
        console.log('Gebe inekler:', response.data);
        
        // Backend'den gelen veriyi uygun formata dönüştür
        let processedData = [];
        if (response.data && response.data.data) {
          processedData = response.data.data.map((animal, index) => ({
            id: animal.id || index,
            ...animal
          }));
        }
        
        setRows(processedData);
        toast.success('Gebe inek verileri başarıyla yüklendi.');
      } catch (error) {
        console.error('Gebe inek verileri alınırken hata oluştu:', error);
        toast.error('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchPregnantCows();
  }, []);

  const handleExportPDF = () => {
    if (exporting) return; // Zaten export ediliyorsa tekrar başlatma
    setExporting(true);
    toast.info('PDF dışa aktarma işlemi başlatıldı...');

    try {
      const doc = new jsPDF();
      doc.text('Gebe İnekler Listesi', 14, 16);
      doc.autoTable({
        startY: 20,
        head: [columns.map(col => col.headerName)], // Sadece başlıkları al
        body: rows.map(row => columns.map(col => row[col.field] !== null && row[col.field] !== undefined ? row[col.field] : '-')), // Alanları sırayla al, null/undefined ise '-' koy
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] }, // Başlık rengi
      });
      doc.save('gebe_inekler_listesi.pdf');
      toast.success('PDF başarıyla dışa aktarıldı!');
    } catch (error) {
      console.error('PDF export sırasında hata:', error);
      toast.error('PDF dışa aktarılırken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (exporting) return;
    setExporting(true);
    toast.info('Excel dışa aktarma işlemi başlatıldı...');

    try {
      // Veriyi Excel'e uygun formata hazırla (isteğe bağlı, başlıkları vs. düzeltebilirsiniz)
      const dataToExport = rows.map(row => {
        let mappedRow = {};
        columns.forEach(col => {
          mappedRow[col.headerName] = row[col.field] !== null && row[col.field] !== undefined ? row[col.field] : '-'; // Başlıkları headerName yap
        });
        return mappedRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gebe İnekler');

      // Sütun genişliklerini ayarla (isteğe bağlı)
      const colsWidths = columns.map(col => ({ wch: col.headerName.length + 5 })); // Başlık uzunluğuna göre ayarla
      worksheet['!cols'] = colsWidths;

      XLSX.writeFile(workbook, 'gebe_inekler_listesi.xlsx');
      toast.success('Excel başarıyla dışa aktarıldı!');
    } catch (error) {
      console.error('Excel export sırasında hata:', error);
      toast.error('Excel dışa aktarılırken bir hata oluştu.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Gebe İnekler Listesi Raporu
      </Typography>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportPDF}
          disabled={loading || exporting || rows.length === 0} // Butonu yüklenirken, export ederken veya veri yokken pasif yap
        >
          {exporting ? 'PDF Aktarılıyor...' : 'PDF İndir'}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportExcel}
          disabled={loading || exporting || rows.length === 0} // Butonu yüklenirken, export ederken veya veri yokken pasif yap
        >
          {exporting ? 'Excel Aktarılıyor...' : 'Excel İndir'}
        </Button>
      </Box>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading} // DataGrid'in kendi loading göstergesi
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          getRowId={(row) => row.id} // Benzersiz ID alanını belirt
          // Diğer DataGrid ayarları eklenebilir (filtreleme, sıralama vb.)
          sx={{ 
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5', // Başlık arkaplan rengi
              borderBottom: '1px solid rgba(224, 224, 224, 1)',
            },
             '& .MuiDataGrid-footerContainer': {
               borderTop: '1px solid rgba(224, 224, 224, 1)',
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default PregnantCowsList; 