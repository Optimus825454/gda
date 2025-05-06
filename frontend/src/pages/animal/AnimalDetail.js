import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Paper,
    Typography,
    IconButton,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as BackIcon,
    LocalHospital as HealthIcon,
    EventNote as NoteIcon,
    MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Tab paneli için özel bileşen
function TabPanel( props ) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`animal-tabpanel-${index}`}
            aria-labelledby={`animal-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Tab için erişilebilirlik özellikleri
function a11yProps( index ) {
    return {
        id: `animal-tab-${index}`,
        'aria-controls': `animal-tabpanel-${index}`,
    };
}

const AnimalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState( null );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );
    const [tabValue, setTabValue] = useState( 0 );

    // Demo sağlık kayıtları
    const healthRecords = [
        {
            id: 1,
            date: '2025-04-01',
            type: 'Rutin Kontrol',
            diagnosis: 'Sağlıklı',
            treatment: 'Vitamin takviyesi',
            notes: 'Herhangi bir sorun görülmedi.',
            veterinarian: 'Dr. Ahmet Yılmaz'
        },
        {
            id: 2,
            date: '2025-03-15',
            type: 'Aşı',
            diagnosis: 'Sağlıklı',
            treatment: 'Brucella aşısı',
            notes: 'Yıllık aşı yapıldı.',
            veterinarian: 'Dr. Mehmet Demir'
        }
    ];

    // Demo mali kayıtlar
    const financialRecords = [
        {
            id: 1,
            date: '2025-04-05',
            type: 'Gider',
            amount: 250,
            description: 'Yem alımı',
            category: 'Besleme'
        },
        {
            id: 2,
            date: '2025-04-01',
            type: 'Gider',
            amount: 350,
            description: 'Veteriner kontrolü',
            category: 'Sağlık'
        }
    ];

    // API'den hayvan detaylarını çekme
    useEffect( () => {
        const fetchAnimal = async () => {
            setLoading( true );
            try {
                // Gerçek API çağrısı: const response = await fetch(`http://localhost:5000/api/animals/${id}`);
                // Simülasyon için 1 saniyelik gecikme ekleyelim
                await new Promise( resolve => setTimeout( resolve, 1000 ) );

                // Demo data for now
                const demoAnimal = {
                    id: Number( id ),
                    animalId: 'TR1234567890',
                    name: 'Şimşek',
                    type: 'İnek',
                    breed: 'Holstein',
                    birthDate: '2020-04-15',
                    gender: 'Dişi',
                    weight: 450,
                    price: 10000,
                    purchaseDate: '2020-08-10',
                    status: 'active',
                    healthStatus: 'healthy',
                    lastHealthCheckDate: '2025-04-01',
                    pregnancyStatus: 'pregnant',
                    notes: 'Bu hayvan çiftliğimizin en değerli ineğidir. Yüksek süt verimi ve doğurganlığı ile öne çıkar.',
                    createdAt: '2020-08-10',
                    updatedAt: '2025-04-01',
                    category: 'Süt Üretimi',
                    testResult: 'Negatif',
                    saleStatus: 'Satışta',
                    destinationCompany: 'ABC Süt Ürünleri',
                    salePrice: 12000
                };

                setAnimal( demoAnimal );
                setLoading( false );
            } catch ( err ) {
                setError( 'Hayvan detayları yüklenirken bir hata oluştu.' );
                setLoading( false );
                console.error( 'Hayvan detayları çekilirken hata:', err );
            }
        };

        fetchAnimal();
    }, [id] );

    // Tab değişimi
    const handleTabChange = ( event, newValue ) => {
        setTabValue( newValue );
    };

    // Hayvan silme işlemi
    const handleDelete = async () => {
        if ( window.confirm( 'Bu hayvanı silmek istediğinizden emin misiniz?' ) ) {
            try {
                // Gerçek API çağrısı: await fetch(`http://localhost:5000/api/animals/${id}`, { method: 'DELETE' });

                // Başarılı silme işlemi sonrası ana sayfaya yönlendir
                navigate( '/animals' );
            } catch ( err ) {
                console.error( 'Hayvan silinirken hata:', err );
                alert( 'Hayvan silinirken bir hata oluştu.' );
            }
        }
    };

    // Durum çipi oluşturma
    const renderStatusChip = ( status ) => {
        let color = 'default';
        let label = status;

        switch ( status ) {
            case 'active':
                color = 'success';
                label = 'Aktif';
                break;
            case 'sold':
                color = 'info';
                label = 'Satıldı';
                break;
            case 'dead':
                color = 'error';
                label = 'Öldü';
                break;
            default:
                color = 'default';
        }

        return <Chip color={color} label={label} />;
    };

    // Sağlık durumu çipi oluşturma
    const renderHealthChip = ( status ) => {
        let color = 'default';
        let label = status;

        switch ( status ) {
            case 'healthy':
                color = 'success';
                label = 'Sağlıklı';
                break;
            case 'sick':
                color = 'warning';
                label = 'Hasta';
                break;
            case 'treatment':
                color = 'info';
                label = 'Tedavide';
                break;
            default:
                color = 'default';
        }

        return <Chip icon={<HealthIcon />} color={color} label={label} />;
    };

    // Gebelik durumu çipi oluşturma
    const renderPregnancyChip = ( status ) => {
        let color = 'default';
        let label = status;

        switch ( status ) {
            case 'pregnant':
                color = 'success';
                label = 'Gebe';
                break;
            case 'not_pregnant':
                color = 'default';
                label = 'Gebe Değil';
                break;
            default:
                color = 'default';
                label = 'Bilinmiyor';
        }

        return <Chip color={color} label={label} />;
    };

    if ( loading ) {
        return <Typography>Yükleniyor...</Typography>;
    }

    if ( error ) {
        return <Typography color="error">{error}</Typography>;
    }

    if ( !animal ) {
        return <Typography color="error">Hayvan bulunamadı.</Typography>;
    }

    return (
        <div>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    component={Link}
                    to="/animals"
                >
                    Hayvan Listesine Dön
                </Button>

                <Box>
                    <IconButton
                        component={Link}
                        to={`/animals/${id}/edit`}
                        color="primary"
                        title="Düzenle"
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        onClick={handleDelete}
                        title="Sil"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h5" component="h1" gutterBottom>
                                    {animal.name}
                                </Typography>
                                {renderStatusChip( animal.status )}
                            </Box>

                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                {animal.type} ({animal.breed})
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Hayvan No
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.animalId}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Cinsiyet
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.gender}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Doğum Tarihi
                                    </Typography>
                                    <Typography variant="body2">
                                        {format( new Date( animal.birthDate ), 'dd MMMM yyyy', { locale: tr } )}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Ağırlık
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.weight} kg
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Sağlık Durumu
                                    </Typography>
                                    {renderHealthChip( animal.healthStatus )}
                                </Grid>
                                {animal.gender === 'Dişi' && (
                                    <Grid item xs={6}>
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                            Gebelik Durumu
                                        </Typography>
                                        {renderPregnancyChip( animal.pregnancyStatus )}
                                    </Grid>
                                )}
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Son Kontrol
                                    </Typography>
                                    <Typography variant="body2">
                                        {format( new Date( animal.lastHealthCheckDate ), 'dd/MM/yyyy' )}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Satın Alma Fiyatı
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.price} TL
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Kayıt Tarihi
                                    </Typography>
                                    <Typography variant="body2">
                                        {format( new Date( animal.createdAt ), 'dd MMMM yyyy', { locale: tr } )}
                                    </Typography>
                                </Grid>
                                {/* Kategori */}
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Kategori
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.category || '-'}
                                    </Typography>
                                </Grid>
                                {/* Test Sonucu */}
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Test Sonucu
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.testResult || '-'}
                                    </Typography>
                                </Grid>
                                {/* Satış Durumu */}
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Satış Durumu
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.saleStatus || '-'}
                                    </Typography>
                                </Grid>
                                {/* Hedef Şirket */}
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Hedef Şirket
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.destinationCompany || '-'}
                                    </Typography>
                                </Grid>
                                {/* Satış Fiyatı */}
                                <Grid item xs={6}>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Satış Fiyatı
                                    </Typography>
                                    <Typography variant="body2">
                                        {animal.salePrice ? `${animal.salePrice} TL` : '-'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Notlar
                            </Typography>
                            <Typography variant="body2">
                                {animal.notes || 'Bu hayvan için not eklenmemiş.'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="hayvan detay sekmeleri"
                        >
                            <Tab label="Sağlık Kayıtları" icon={<HealthIcon />} iconPosition="start" {...a11yProps( 0 )} />
                            <Tab label="Mali Kayıtlar" icon={<MoneyIcon />} iconPosition="start" {...a11yProps( 1 )} />
                            <Tab label="Notlar & Etkinlikler" icon={<NoteIcon />} iconPosition="start" {...a11yProps( 2 )} />
                        </Tabs>

                        <TabPanel value={tabValue} index={0}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Sağlık Geçmişi</Typography>
                                <Button variant="contained" color="primary" size="small">
                                    Yeni Sağlık Kaydı
                                </Button>
                            </Box>

                            <TableContainer>
                                <Table aria-label="sağlık kayıtları tablosu">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tarih</TableCell>
                                            <TableCell>İşlem Türü</TableCell>
                                            <TableCell>Tanı</TableCell>
                                            <TableCell>Tedavi</TableCell>
                                            <TableCell>Veteriner</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {healthRecords.map( ( record ) => (
                                            <TableRow key={record.id} hover>
                                                <TableCell>{format( new Date( record.date ), 'dd/MM/yyyy' )}</TableCell>
                                                <TableCell>{record.type}</TableCell>
                                                <TableCell>{record.diagnosis}</TableCell>
                                                <TableCell>{record.treatment}</TableCell>
                                                <TableCell>{record.veterinarian}</TableCell>
                                            </TableRow>
                                        ) )}
                                        {healthRecords.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    Sağlık kaydı bulunamadı.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Mali Kayıtlar</Typography>
                                <Button variant="contained" color="primary" size="small">
                                    Yeni Mali Kayıt
                                </Button>
                            </Box>

                            <TableContainer>
                                <Table aria-label="mali kayıtlar tablosu">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tarih</TableCell>
                                            <TableCell>İşlem Türü</TableCell>
                                            <TableCell>Kategori</TableCell>
                                            <TableCell>Açıklama</TableCell>
                                            <TableCell align="right">Tutar (TL)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {financialRecords.map( ( record ) => (
                                            <TableRow key={record.id} hover>
                                                <TableCell>{format( new Date( record.date ), 'dd/MM/yyyy' )}</TableCell>
                                                <TableCell>{record.type}</TableCell>
                                                <TableCell>{record.category}</TableCell>
                                                <TableCell>{record.description}</TableCell>
                                                <TableCell align="right">{record.amount.toLocaleString( 'tr-TR' )}</TableCell>
                                            </TableRow>
                                        ) )}
                                        {financialRecords.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    Mali kayıt bulunamadı.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="h6">Notlar & Etkinlikler</Typography>
                                <Button variant="contained" color="primary" size="small">
                                    Not Ekle
                                </Button>
                            </Box>

                            <List>
                                <ListItem divider>
                                    <ListItemText
                                        primary="Süt verimi normalin üzerinde"
                                        secondary={`Eklenme Tarihi: ${format( new Date( '2025-03-15' ), 'dd/MM/yyyy' )}`}
                                    />
                                </ListItem>
                                <ListItem divider>
                                    <ListItemText
                                        primary="Gebe olduğu tespit edildi"
                                        secondary={`Eklenme Tarihi: ${format( new Date( '2025-02-20' ), 'dd/MM/yyyy' )}`}
                                    />
                                </ListItem>
                            </List>
                        </TabPanel>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
};

export default AnimalDetail;