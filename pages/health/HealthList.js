import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Download as DownloadIcon,
    PrintOutlined as PrintIcon,
    HealthAndSafety as HealthIcon,
    EventNote as EventIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';

// PDF ve Excel dışa aktarma için bileşenler
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const HealthList = () => {
    // State tanımları
    const [healthRecords, setHealthRecords] = useState( [] );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );
    const [page, setPage] = useState( 0 );
    const [rowsPerPage, setRowsPerPage] = useState( 10 );

    // Filtre state'leri
    const [searchTerm, setSearchTerm] = useState( '' );
    const [filterType, setFilterType] = useState( '' );
    const [startDate, setStartDate] = useState( null );
    const [endDate, setEndDate] = useState( null );

    // Kayıtları getir
    const fetchHealthRecords = async () => {
        setLoading( true );
        try {
            // Gerçek API çağrısı burada yapılacak
            // Şimdilik örnek veri kullanıyoruz
            const mockData = [
                {
                    id: '1',
                    animal_id: 'A001',
                    animal_name: 'Sarıkız',
                    date: '2025-04-15',
                    type: 'Aşılama',
                    description: 'Şap aşısı yapıldı',
                    veterinarian: 'Dr. Ahmet Yılmaz',
                    notes: 'Sorunsuz tamamlandı'
                },
                {
                    id: '2',
                    animal_id: 'A002',
                    animal_name: 'Karabaş',
                    date: '2025-04-20',
                    type: 'Muayene',
                    description: 'Rutin kontrol',
                    veterinarian: 'Dr. Mehmet Öz',
                    notes: 'Sağlık durumu iyi'
                },
                {
                    id: '3',
                    animal_id: 'A003',
                    animal_name: 'Benekli',
                    date: '2025-05-05',
                    type: 'Tedavi',
                    description: 'Ayak enfeksiyonu tedavisi',
                    veterinarian: 'Dr. Ayşe Kaya',
                    notes: 'İlaç tedavisi başlandı, 7 gün sonra kontrol'
                },
                {
                    id: '4',
                    animal_id: 'A001',
                    animal_name: 'Sarıkız',
                    date: '2025-05-10',
                    type: 'Planlanan',
                    description: 'Rutin sağlık kontrolü',
                    veterinarian: '',
                    notes: 'Veteriner randevusu alınacak'
                },
            ];

            // API'den gelen verileri ayarla
            setHealthRecords( mockData );
            setError( null );
        } catch ( err ) {
            console.error( 'Sağlık kayıtlarını getirirken hata:', err );
            setError( 'Sağlık kayıtları yüklenirken bir hata oluştu.' );
        } finally {
            setLoading( false );
        }
    };

    useEffect( () => {
        fetchHealthRecords();
    }, [] );

    // Sayfa değişikliği
    const handleChangePage = ( event, newPage ) => {
        setPage( newPage );
    };

    // Sayfa başına kayıt sayısı değişikliği
    const handleChangeRowsPerPage = ( event ) => {
        setRowsPerPage( parseInt( event.target.value, 10 ) );
        setPage( 0 );
    };

    // Arama/filtreleme işlemleri
    const handleSearchChange = ( event ) => {
        setSearchTerm( event.target.value );
        setPage( 0 );
    };

    const handleFilterTypeChange = ( event ) => {
        setFilterType( event.target.value );
        setPage( 0 );
    };

    // Filtrelenmiş veriyi hazırla
    const filteredData = healthRecords
        .filter( record => {
            // Arama terimine göre filtrele
            if ( searchTerm && !record.animal_name.toLowerCase().includes( searchTerm.toLowerCase() ) &&
                !record.description.toLowerCase().includes( searchTerm.toLowerCase() ) &&
                !record.veterinarian.toLowerCase().includes( searchTerm.toLowerCase() ) ) {
                return false;
            }

            // Kayıt türüne göre filtrele
            if ( filterType && record.type !== filterType ) {
                return false;
            }

            // Başlangıç tarihine göre filtrele
            if ( startDate && new Date( record.date ) < startDate ) {
                return false;
            }

            // Bitiş tarihine göre filtrele
            if ( endDate && new Date( record.date ) > endDate ) {
                return false;
            }

            return true;
        } );

    // Tabloda gösterilecek sayfalanmış veriyi hazırla
    const displayedData = filteredData
        .slice( page * rowsPerPage, page * rowsPerPage + rowsPerPage );

    // Excel'e dışa aktar
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet( filteredData.map( record => ( {
            'ID': record.id,
            'Hayvan ID': record.animal_id,
            'Hayvan Adı': record.animal_name,
            'Tarih': record.date,
            'İşlem Türü': record.type,
            'Açıklama': record.description,
            'Veteriner': record.veterinarian,
            'Notlar': record.notes
        } ) ) );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet( workbook, worksheet, 'Sağlık Kayıtları' );

        // Excel dosyasını indir
        XLSX.writeFile( workbook, `Sağlık_Kayıtları_${format( new Date(), 'dd-MM-yyyy' )}.xlsx` );
    };

    // PDF'ye dışa aktar
    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize( 18 );
        doc.text( 'Sağlık Kayıtları Raporu', 14, 22 );

        doc.setFontSize( 11 );
        doc.text( `Oluşturulma Tarihi: ${format( new Date(), 'dd/MM/yyyy' )}`, 14, 30 );

        const tableColumn = ['ID', 'Hayvan', 'Tarih', 'İşlem Türü', 'Açıklama', 'Veteriner'];
        const tableRows = filteredData.map( record => [
            record.id,
            record.animal_name,
            record.date,
            record.type,
            record.description,
            record.veterinarian
        ] );

        doc.autoTable( {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1 },
            headStyles: { fillColor: [63, 81, 181], textColor: 255 }
        } );

        doc.save( `Sağlık_Kayıtları_${format( new Date(), 'dd-MM-yyyy' )}.pdf` );
    };

    return (
        <Container maxWidth="xl">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Sağlık Kayıtları
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                        Hayvanların sağlık kayıtlarını görüntüleyin ve yönetin
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/health/create"
                >
                    Yeni Kayıt
                </Button>
            </Stack>

            {/* Filtre ve arama */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="Arama"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel id="filter-type-label">İşlem Türü</InputLabel>
                                <Select
                                    labelId="filter-type-label"
                                    value={filterType}
                                    label="İşlem Türü"
                                    onChange={handleFilterTypeChange}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <FilterIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    <MenuItem value="Aşılama">Aşılama</MenuItem>
                                    <MenuItem value="Muayene">Muayene</MenuItem>
                                    <MenuItem value="Tedavi">Tedavi</MenuItem>
                                    <MenuItem value="Planlanan">Planlanan</MenuItem>
                                    <MenuItem value="Diğer">Diğer</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                                <DatePicker
                                    label="Başlangıç Tarihi"
                                    value={startDate}
                                    onChange={( newValue ) => setStartDate( newValue )}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                                <DatePicker
                                    label="Bitiş Tarihi"
                                    value={endDate}
                                    onChange={( newValue ) => setEndDate( newValue )}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* İşlem butonları */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportToExcel}
                >
                    Excel
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={exportToPDF}
                >
                    PDF
                </Button>
            </Box>

            {/* Kayıtlar tablosu */}
            <Card>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Box sx={{ textAlign: 'center', color: 'error.main', my: 3 }}>
                            <Typography>{error}</Typography>
                        </Box>
                    ) : (
                        <>
                            <TableContainer component={Paper}>
                                <Table aria-label="sağlık kayıtları tablosu">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                            <TableCell sx={{ color: 'white' }}>Hayvan ID</TableCell>
                                            <TableCell sx={{ color: 'white' }}>Hayvan Adı</TableCell>
                                            <TableCell sx={{ color: 'white' }}>Tarih</TableCell>
                                            <TableCell sx={{ color: 'white' }}>İşlem Türü</TableCell>
                                            <TableCell sx={{ color: 'white' }}>Açıklama</TableCell>
                                            <TableCell sx={{ color: 'white' }}>Veteriner</TableCell>
                                            <TableCell sx={{ color: 'white' }} align="center">İşlemler</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {displayedData.length > 0 ? (
                                            displayedData.map( ( record ) => (
                                                <TableRow key={record.id} hover>
                                                    <TableCell>{record.animal_id}</TableCell>
                                                    <TableCell>{record.animal_name}</TableCell>
                                                    <TableCell>{record.date}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1
                                                        }}>
                                                            {record.type === 'Aşılama' && <HealthIcon color="success" fontSize="small" />}
                                                            {record.type === 'Muayene' && <HealthIcon color="info" fontSize="small" />}
                                                            {record.type === 'Tedavi' && <HealthIcon color="warning" fontSize="small" />}
                                                            {record.type === 'Planlanan' && <EventIcon color="primary" fontSize="small" />}
                                                            {record.type}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{record.description}</TableCell>
                                                    <TableCell>{record.veterinarian}</TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                            <Tooltip title="Düzenle">
                                                                <IconButton
                                                                    component={RouterLink}
                                                                    to={`/health/edit/${record.id}`}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Sil">
                                                                <IconButton color="error">
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ) )
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <Typography variant="subtitle1" sx={{ py: 5 }}>
                                                        Sağlık kaydı bulunamadı
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={filteredData.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage="Sayfa başına kayıt:"
                                labelDisplayedRows={( { from, to, count } ) =>
                                    `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default HealthList;