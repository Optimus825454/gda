import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ListAltIcon from '@mui/icons-material/ListAlt';
import axiosInstance, { validateToken } from '../../utils/axiosConfig';
import CustomTable from '../../components/common/CustomTable';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Tahmini doğum tarihi hesaplama fonksiyonu (düve için ~280 gün)
const calculateExpectedBirthDate = ( inseminationDate ) => {
  if ( !inseminationDate ) return '-';

  try {
    const date = new Date( inseminationDate );
    if ( isNaN( date.getTime() ) ) return '-';

    // Tohumlama tarihine 280 gün ekle (yaklaşık 9 ay, düve gebelik süresi)
    date.setDate( date.getDate() + 280 );

    // Formatla: GG.AA.YYYY
    return date.toLocaleDateString( 'tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    } );
  } catch ( error ) {
    console.error( 'Tarih hesaplama hatası:', error );
    return '-';
  }
};

// Hayvanın yaşını hesaplama fonksiyonu
const calculateAge = ( birthDate ) => {
  if ( !birthDate ) return '-';

  try {
    const birthDateObj = new Date( birthDate );
    if ( isNaN( birthDateObj.getTime() ) ) return '-';

    const today = new Date();
    const ageInMilliseconds = today - birthDateObj;
    const ageInYears = ageInMilliseconds / ( 365 * 24 * 60 * 60 * 1000 );

    // 2 yıldan az ise ay olarak göster
    if ( ageInYears < 2 ) {
      const ageInMonths = Math.floor( ageInYears * 12 );
      return `${ageInMonths} ay`;
    }

    // 2 yıldan fazla ise yıl olarak göster (ondalık kısmını bir basamak)
    return `${ageInYears.toFixed( 1 )} yıl`;
  } catch ( error ) {
    console.error( 'Yaş hesaplama hatası:', error );
    return '-';
  }
};

// Tarih formatlama yardımcı fonksiyonu
const formatDate = ( dateString ) => {
  if ( !dateString ) return '-';
  try {
    const date = new Date( dateString );
    return date.toLocaleDateString( 'tr-TR' );
  } catch ( e ) {
    return dateString;
  }
};

// Amaç formatlama
const formatPurpose = ( purpose ) => {
  const purposeMap = {
    'DAMIZLIK': 'Damızlık',
    'KESIM': 'Kesim'
  };
  return purposeMap[purpose] || purpose || '-';
};

const PregnantHeifersList = () => {
  const [rows, setRows] = useState( [] );
  const [loading, setLoading] = useState( false );
  const [exporting, setExporting] = useState( false );
  const [error, setError] = useState( null );
  const [showAllRecords, setShowAllRecords] = useState( false );

  // Tabloda sıra numarası eklemek için ön işlem
  const processDataWithIndex = ( data ) => {
    return data.map( ( item, index ) => ( {
      ...item,
      index: index + 1, // 1'den başlayan sıra numarası
    } ) );
  };

  // Sütun tanımları
  const columns = [
    { id: 'index', label: 'Sıra No', minWidth: 70, sortable: false },
    { id: 'animal_id', label: 'Küpe No', minWidth: 150 },
    { id: 'category', label: 'Kategori', minWidth: 120 },
    { id: 'purpose', label: 'Amaç', minWidth: 120, format: formatPurpose },
    { id: 'birth_date', label: 'Yaş', minWidth: 100, getValue: ( row ) => calculateAge( row.birth_date ) },
    { id: 'pregnancy_status', label: 'Gebelik Durumu', minWidth: 150 },
    { id: 'tohumlama_tarihi', label: 'Tohumlama Tarihi', minWidth: 160, type: 'date', format: formatDate },
    {
      id: 'expected_birth_date',
      label: 'Tahmini Doğum Tarihi',
      minWidth: 180,
      getValue: ( row ) => calculateExpectedBirthDate( row.tohumlama_tarihi )
    }
  ];

  useEffect( () => {
    const fetchPregnantHeifers = async () => {
      setLoading( true );
      setError( null );
      try {
        const response = await axiosInstance.get( '/animals/reports/pregnant-heifers' );
        console.log( 'Gebe düveler:', response.data );

        // Backend'den gelen veriyi uygun formata dönüştür
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
        console.error( 'Gebe düve verileri alınırken hata oluştu:', error );

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

    fetchPregnantHeifers();
  }, [] );

  const handleExportPDF = () => {
    if ( exporting ) return;
    setExporting( true );
    toast.info( 'PDF dışa aktarma işlemi başlatıldı...' );

    try {
      const doc = new jsPDF();
      doc.setFont( 'Helvetica', 'normal' ); // veya 'Arial'

      const tableColumn = columns.map( col => col.label );
      const tableRows = rows.map( row => {
        return columns.map( col => {
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
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { font: 'Helvetica', fontStyle: 'normal' },
        headStyles: { fillColor: [22, 160, 133] },
        didDrawPage: ( data ) => {
          doc.setFontSize( 18 );
          doc.setTextColor( 40 );
          doc.text( 'Gebe Düveler Listesi Raporu', data.settings.margin.left, 15 );
        },
      } );

      doc.save( 'gebe_duveler_listesi.pdf' );
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
      XLSX.utils.book_append_sheet( workbook, worksheet, 'Gebe Düveler' );

      // Sütun genişliklerini ayarla
      const colsWidths = columns.map( col => ( { wch: col.label.length + 5 } ) );
      worksheet['!cols'] = colsWidths;

      XLSX.writeFile( workbook, 'gebe_duve_listesi.xlsx' );
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
        Gebe Düve Listesi Raporu
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
        defaultSortBy="birth_date"
        defaultSortOrder="desc"
        defaultPageSize={50}
        emptyMessage="Gebe düve kaydı bulunamadı"
      />
    </Paper>
  );
};

export default PregnantHeifersList; 