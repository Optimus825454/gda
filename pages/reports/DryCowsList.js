import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Switch, FormControlLabel, Alert } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ListAltIcon from '@mui/icons-material/ListAlt';
import axiosInstance, { validateToken } from '../../utils/axiosConfig';
import CustomTable from '../../components/common/CustomTable';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Tarih formatlama fonksiyonu
const formatDate = ( dateString ) => {
  if ( !dateString ) return '-';
  try {
    const date = new Date( dateString );
    return date.toLocaleDateString( 'tr-TR' );
  } catch ( e ) {
    return dateString;
  }
};

// Kalan gün hesaplama fonksiyonu
const calculateRemainingDays = ( expectedDate ) => {
  if ( !expectedDate ) return '-';

  try {
    const expected = new Date( expectedDate );
    if ( isNaN( expected.getTime() ) ) return '-';

    const today = new Date();
    const diffTime = expected - today;
    const diffDays = Math.ceil( diffTime / ( 1000 * 60 * 60 * 24 ) );

    if ( diffDays < 0 ) return 'Geçti';
    return `${diffDays} gün`;
  } catch ( error ) {
    console.error( 'Kalan gün hesaplama hatası:', error );
    return '-';
  }
};

const DryCowsList = () => {
  const [rows, setRows] = useState( [] );
  const [loading, setLoading] = useState( false );
  const [exporting, setExporting] = useState( false );
  const [showAllRecords, setShowAllRecords] = useState( false );
  const [error, setError] = useState( null );

  // Tabloda sıra numarası eklemek için işlem
  const processDataWithIndex = ( data ) => {
    return data.map( ( item, index ) => ( {
      ...item,
      index: index + 1, // 1'den başlayan sıra numarası
    } ) );
  };

  // Tablo sütunları
  const columns = [
    { id: 'index', label: 'Sıra No', minWidth: 70, sortable: false },
    { id: 'kupeno', label: 'Küpe No', minWidth: 150 }, 
    { id: 'yas', label: 'Hayvanın Yaşı', minWidth: 180 }, 
    { id: 'tohumlama_tarihi', label: 'Tohumlama Tarihi', minWidth: 180, type: 'date' }, 
    { id: 'beklenen_buzagilama_tarihi', label: 'Beklenen Buzağılama Tarihi', minWidth: 220, type: 'date' }, 
    {
      id: 'tahmini_doguma_kalan_gun',
      label: 'Kalan Gün',
      minWidth: 120
    }
  ];

  useEffect( () => {
    const fetchDryCows = async () => {
      setLoading( true );
      setError( null );
      try {
        const response = await axiosInstance.get( '/animals/reports/dry-cows' );
        console.log( 'Kuru inekler:', response.data );

        let processedData = [];
        if ( response.data && response.data.data ) {
          processedData = response.data.data.map( ( animal, index ) => ( {
            id: animal.id || index,
            ...animal
          } ) );

          // Sıra numarası ekle
          processedData = processDataWithIndex( processedData );
        }

        setRows( processedData );
      } catch ( error ) {
        console.error( 'Kuru inek verileri alınırken hata oluştu:', error );

        // 431 hatası özel olarak yakalandıysa
        if ( error.isHeaderTooLarge || error.response?.status === 431 ) {
          setError( 'Oturum bilgilerinizde bir sorun oluştu. Sayfayı yenileyip tekrar giriş yapmanız gerekiyor.' );
          toast.error( 'Oturum hatası! Lütfen sayfayı yenileyin ve tekrar giriş yapın.' );
          // Tarayıcı çerezlerini ve localStorage'ı temizle
          localStorage.removeItem( 'token' );
          sessionStorage.removeItem( 'token' );
        } else {
          toast.error( 'Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.' );
        }
      } finally {
        setLoading( false );
      }
    };
    fetchDryCows();
  }, [] );

  const handleExportPDF = () => {
    if ( exporting ) return;
    setExporting( true );
    toast.info( 'PDF dışa aktarma işlemi başlatıldı...' );

    try {
      const doc = new jsPDF();
      doc.setFont( 'Helvetica', 'normal' ); // Font ayarı

      const tableColumn = columns.map( col => col.label );
      // "Test Sonucu" gibi kaldırılmış olabilecek sütunları filtrele
      const activeColumns = columns.filter(col => tableColumn.includes(col.label)); 

      const tableRows = rows.map( row => {
        return activeColumns.map( col => {
          if ( col.format && col.getValue ) {
            return col.format( col.getValue( row ) );
          } else if ( col.format ) {
            return col.format( row[col.id] );
          } else if ( col.getValue ) {
            return col.getValue( row );
          } else {
            return row[col.id] !== null && row[col.id] !== undefined ? row[col.id] : '-';
          }
        } );
      } );

      doc.autoTable( {
        head: [tableColumn.filter(label => activeColumns.some(col => col.label === label))],
        body: tableRows,
        startY: 20,
        styles: { font: 'Helvetica', fontStyle: 'normal' }, // Font stili
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: ( data ) => {
          doc.setFontSize( 18 );
          doc.setTextColor( 40 );
          doc.text( 'Kuru İnekler Listesi Raporu', data.settings.margin.left, 15 ); // PDF Başlığı
        },
      } );

      doc.save( 'kuru_inekler_listesi.pdf' );
      toast.success( 'PDF başarıyla dışa aktarıldı!' );
    } catch ( error ) {
      console.error( 'PDF export sırasında hata:', error );
      toast.error( 'PDF dışa aktarılırken bir hata oluştu.' );
    } finally {
      setExporting( false );
    }
  };

  const handleExportExcel = () => {
    if ( exporting ) return;
    setExporting( true );
    toast.info( 'Excel dışa aktarma işlemi başlatıldı...' );
    try {
      // Veriyi Excel'e uygun formata hazırla
      const dataToExport = rows.map( row => {
        let mappedRow = {};
        columns.forEach( col => {
          if ( col.format && col.getValue ) {
            mappedRow[col.label] = col.format( col.getValue( row ) );
          } else if ( col.format ) {
            mappedRow[col.label] = col.format( row[col.id] );
          } else if ( col.getValue ) {
            mappedRow[col.label] = col.getValue( row );
          } else {
            mappedRow[col.label] = row[col.id] !== null && row[col.id] !== undefined ? row[col.id] : '-';
          }
        } );
        return mappedRow;
      } );

      const worksheet = XLSX.utils.json_to_sheet( dataToExport );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet( workbook, worksheet, 'Kuru İnekler' );
      const colsWidths = columns.map( col => ( { wch: col.label.length + 5 } ) );
      worksheet['!cols'] = colsWidths;
      XLSX.writeFile( workbook, 'kuru_inekler_listesi.xlsx' );
      toast.success( 'Excel başarıyla dışa aktarıldı!' );
    } catch ( error ) {
      console.error( 'Excel export sırasında hata:', error );
      toast.error( 'Excel dışa aktarılırken bir hata oluştu.' );
    } finally {
      setExporting( false );
    }
  };

  // Tümünü gösterme düğmesi işlevi
  const toggleShowAll = () => {
    setShowAllRecords( !showAllRecords );
  };

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Kuru İnekler Listesi Raporu
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showAllRecords}
                onChange={toggleShowAll}
                color="primary"
              />
            }
            label="Tümünü Listele"
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<ListAltIcon />}
            onClick={toggleShowAll}
            sx={{ ml: 1 }}
          >
            {!showAllRecords ? 'Tümünü Listele' : 'Sayfalı Görünüm'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Box>

      <CustomTable
        columns={columns}
        rows={rows}
        loading={loading}
        showAllRecords={showAllRecords}
        defaultSortBy="beklenen_buzagilama_tarihi"
        defaultSortOrder="asc"
        defaultPageSize={50}
        emptyMessage="Kuru inek kaydı bulunamadı"
      />
    </Paper>
  );
};

export default DryCowsList; 