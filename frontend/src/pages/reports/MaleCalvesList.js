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
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'animal_id', headerName: 'Hayvan ID', width: 120 },
  { field: 'ear_tag', headerName: 'Küpe No', width: 150 },
  { field: 'birth_date', headerName: 'Doğum Tarihi', width: 180 },
  { field: 'mother_ear_tag', headerName: 'Anne Küpe No', width: 150 },
  { field: 'father_ear_tag', headerName: 'Baba Küpe No', width: 150 },
  // ... diğer gerekli kolonlar
];

const MaleCalvesList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchMaleCalves = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/reports/male-calves');
        const processedData = response.data.map((row, index) => ({
          id: row.id || index,
          ...row,
        }));
        setRows(processedData);
        toast.success('Erkek buzağı verileri başarıyla yüklendi.');
      } catch (error) {
        console.error('Erkek buzağı verileri alınırken hata oluştu:', error);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaleCalves();
  }, []);

  const handleExportPDF = () => {
    if (exporting) return;
    setExporting(true);
    toast.info('PDF dışa aktarma işlemi başlatıldı...');
    try {
      const doc = new jsPDF();
      doc.text('Erkek Buzağı Listesi', 14, 16);
      doc.autoTable({
        startY: 20,
        head: [columns.map(col => col.headerName)],
        body: rows.map(row => columns.map(col => row[col.field] ?? '-')),
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] },
      });
      doc.save('erkek_buzagi_listesi.pdf');
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Erkek Buzağılar');
      const colsWidths = columns.map(col => ({ wch: col.headerName.length + 5 }));
      worksheet['!cols'] = colsWidths;
      XLSX.writeFile(workbook, 'erkek_buzagi_listesi.xlsx');
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
        Erkek Buzağı Listesi Raporu
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

export default MaleCalvesList; 