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
  { field: 'animal_name', headerName: 'Adı', width: 150 },
  { field: 'referral_date', headerName: 'Sevk Tarihi', width: 180 },
  { field: 'destination', headerName: 'Sevk Yeri (Mezbaha)', width: 200 },
  { field: 'reason', headerName: 'Sevk Nedeni', width: 250 },
  // ... diğer gerekli kolonlar
];

const SlaughterReferralList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchSlaughterReferrals = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/v1/reports/slaughter-referral');
        const processedData = response.data.map((row, index) => ({
          id: row.id || row.referral_id || index,
          ...row,
        }));
        setRows(processedData);
        toast.success('Kesime sevk edilen hayvan verileri başarıyla yüklendi.');
      } catch (error) {
        console.error('Kesime sevk verileri alınırken hata oluştu:', error);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchSlaughterReferrals();
  }, []);

  const handleExportPDF = () => {
    if (exporting) return;
    setExporting(true);
    toast.info('PDF dışa aktarma işlemi başlatıldı...');

    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'normal'); // Font ayarı

      const tableColumnLabels = columns.map(col => col.headerName);
      const activeColumns = columns.filter(col => tableColumnLabels.includes(col.headerName)); 

      const tableRows = rows.map(row => {
        return activeColumns.map(col => {
          if (col.format && col.getValue) {
            return col.format(col.getValue(row));
          } else if (col.format) {
            return col.format(row[col.field]);
          } else if (col.getValue) {
            return col.getValue(row);
          } else {
            return row[col.field] !== null && row[col.field] !== undefined ? row[col.field] : '-';
          }
        });
      });

      doc.autoTable({
        head: [tableColumnLabels.filter(label => activeColumns.some(col => col.headerName === label))],
        body: tableRows,
        startY: 20,
        styles: { font: 'Helvetica', fontStyle: 'normal' }, // Font stili
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: (data) => {
          doc.setFontSize(18);
          doc.setTextColor(40);
          doc.text('Kesim Sevk Listesi Raporu', data.settings.margin.left, 15); // PDF Başlığı
        },
      });

      doc.save('kesim_sevk_listesi.pdf');
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kesime Sevk Edilenler');
      const colsWidths = columns.map(col => ({ wch: col.headerName.length + 5 }));
      worksheet['!cols'] = colsWidths;
      XLSX.writeFile(workbook, 'kesime_sevk_edilenler_listesi.xlsx');
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
        Kesime Sevk Edilen Hayvanlar Raporu
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

export default SlaughterReferralList; 