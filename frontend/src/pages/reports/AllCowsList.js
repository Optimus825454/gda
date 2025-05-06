import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

const columns = [
  // Backend yanıtına göre düzenlenecek ve genişletilecek
  { field: 'id', headerName: 'ID', width: 90 }, // Hayvan ID'si?
  { field: 'ear_tag', headerName: 'Küpe No', width: 150 },
  { field: 'animal_name', headerName: 'Adı', width: 150 },
  { field: 'breed', headerName: 'Irkı', width: 150 },
  { field: 'birth_date', headerName: 'Doğum Tarihi', width: 180 },
  { field: 'age', headerName: 'Yaşı', width: 100 },
  { field: 'status', headerName: 'Durumu', width: 150 }, // (Örn: Laktasyonda, Kuru, Gebe, Düve)
  { field: 'lactation_number', headerName: 'Laktasyon No', width: 130 },
  { field: 'last_insemination_date', headerName: 'Son Tohumlama', width: 180 },
  { field: 'last_birth_date', headerName: 'Son Doğum', width: 180 },
  // ... diğer genel bilgiler (backend'den gelenlere göre)
];

const AllCowsList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAllCows = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/reports/all-cows'); // Gerçek endpoint ile değiştirin
        const processedData = response.data.map((row, index) => ({
          id: row.id || row.animal_id || index, // Backend'de unique ID varsa onu kullan
          ...row,
        }));
        setRows(processedData);
        toast.success('Tüm inek verileri başarıyla yüklendi.');
      } catch (error) {
        console.error('Tüm inek verileri alınırken hata oluştu:', error);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllCows();
  }, []);

  const handleExportPDF = () => {
    if (exporting) return;
    setExporting(true);
    toast.info('PDF dışa aktarma işlemi başlatıldı...');
    try {
      const doc = new jsPDF('landscape'); // Geniş tablo için yatay mod
      doc.text('Tüm İnekler Listesi', 14, 16);
      doc.autoTable({
        startY: 20,
        head: [columns.map(col => col.headerName)],
        body: rows.map(row => columns.map(col => row[col.field] ?? '-')),
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] }, // Koyu Gri/Mavi başlık
        // Tablo genişliğini ayarlamak için ek seçenekler (ihtiyaç olursa)
        // tableWidth: 'auto', 
        // styles: { cellWidth: 'wrap' },
        // columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 20 }, ... } // Sütun bazlı genişlik
      });
      doc.save('tum_inekler_listesi.pdf');
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
      const dataToExport = rows.map(row => {
        let mappedRow = {};
        columns.forEach(col => {
          mappedRow[col.headerName] = row[col.field] ?? '-';
        });
        return mappedRow;
      });
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tüm İnekler');
      const colsWidths = columns.map(col => ({ wch: col.headerName.length + 5 }));
      worksheet['!cols'] = colsWidths;
      XLSX.writeFile(workbook, 'tum_inekler_listesi.xlsx');
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
        Tüm İnekler Listesi Raporu
      </Typography>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportPDF}
          disabled={loading || exporting || rows.length === 0}
        >
          {exporting ? 'PDF Aktarılıyor...' : 'PDF İndir'}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportExcel}
          disabled={loading || exporting || rows.length === 0}
        >
          {exporting ? 'Excel Aktarılıyor...' : 'Excel İndir'}
        </Button>
      </Box>
      <Box sx={{ height: 700, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
          }}
          getRowId={(row) => row.id}
           sx={{ 
            '& .MuiDataGrid-root': { border: 'none' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid rgba(224, 224, 224, 1)' },
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', borderBottom: '1px solid rgba(224, 224, 224, 1)' },
            '& .MuiDataGrid-footerContainer': { borderTop: '1px solid rgba(224, 224, 224, 1)' }
          }}
        />
      </Box>
    </Paper>
  );
};

export default AllCowsList; 