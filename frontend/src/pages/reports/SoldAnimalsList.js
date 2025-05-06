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
  // Backend yanıtına göre düzenlenecek
  { field: 'id', headerName: 'ID', width: 90 }, // Genellikle satış ID'si olur
  { field: 'animal_id', headerName: 'Hayvan ID', width: 120 },
  { field: 'ear_tag', headerName: 'Küpe No', width: 150 },
  { field: 'animal_name', headerName: 'Adı', width: 150 },
  { field: 'sale_date', headerName: 'Satış Tarihi', width: 180 },
  { field: 'sale_price', headerName: 'Satış Fiyatı', width: 150, type: 'number' },
  { field: 'buyer', headerName: 'Alıcı', width: 200 },
  // ... diğer gerekli kolonlar
];

const SoldAnimalsList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchSoldAnimals = async () => {
      setLoading(true);
      try {
        // Doğru API endpoint'ini kullan
        const response = await axios.get('/api/animals/reports/sold-animals');
        console.log('Satılan hayvanlar:', response.data);
        
        // Backend'den gelen veriyi uygun formata dönüştür
        let processedData = [];
        if (response.data && response.data.data) {
          processedData = response.data.data.map((animal, index) => ({
            id: animal.id || index,
            ...animal
          }));
        }
        
        setRows(processedData);
        toast.success('Satılan hayvan verileri başarıyla yüklendi.');
      } catch (error) {
        console.error('Satılan hayvan verileri alınırken hata oluştu:', error);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchSoldAnimals();
  }, []);

  const handleExportPDF = () => {
    if (exporting) return;
    setExporting(true);
    toast.info('PDF dışa aktarma işlemi başlatıldı...');
    try {
      const doc = new jsPDF();
      doc.text('Satılan Hayvanlar Listesi', 14, 16);
      doc.autoTable({
        startY: 20,
        head: [columns.map(col => col.headerName)],
        body: rows.map(row => columns.map(col => row[col.field] ?? '-')),
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] }, // Mavi başlık
      });
      doc.save('satilan_hayvanlar_listesi.pdf');
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Satılan Hayvanlar');
      const colsWidths = columns.map(col => ({ wch: col.headerName.length + 5 }));
      worksheet['!cols'] = colsWidths;
      XLSX.writeFile(workbook, 'satilan_hayvanlar_listesi.xlsx');
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
        Satılan Hayvanlar Listesi Raporu
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
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
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

export default SoldAnimalsList; 