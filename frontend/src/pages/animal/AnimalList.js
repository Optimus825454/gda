import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnimal } from '../../contexts/AnimalContext';
import { useAuth } from '../../contexts/AuthContext';
import { withPermission } from '../../components/auth/withPermission';
import { importAnimalsFromFile, downloadImportTemplate } from '../../utils/importService';
import { 
    DataGrid, 
    GridToolbar,
    trTR 
} from '@mui/x-data-grid';
import { 
    Button, 
    Box, 
    Chip, 
    Tooltip, 
    IconButton,
    Typography
} from '@mui/material';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';

function FilterBar( { onFilterChange, constants } ) {
    if ( !constants ) return null;

    return (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-6">
            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'category', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Kategoriler</option>
                {Object.entries( constants.categories ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>

            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'testResult', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Test Sonuçları</option>
                {Object.entries( constants.testResults ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>

            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'destination', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Hedef Şirketler</option>
                {Object.entries( constants.destinationCompanies ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>

            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'saleStatus', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Satış Durumları</option>
                {Object.entries( constants.saleStatus ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>
        </div>
    );
}

function TestModal( { animal, onClose, onSubmit } ) {
    const [testData, setTestData] = useState( {
        testType: '',
        testResult: '',
        description: '',
        performedBy: '',
        notes: ''
    } );

    const handleSubmit = ( e ) => {
        e.preventDefault();
        onSubmit( animal.id, testData );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Test Sonucu Kaydet</h3>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-gray-200">Test Tipi</label>
                            <input
                                type="text"
                                className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={testData.testType}
                                onChange={( e ) => setTestData( { ...testData, testType: e.target.value } )}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-200">Test Sonucu</label>
                            <select
                                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={testData.testResult}
                                onChange={( e ) => setTestData( { ...testData, testResult: e.target.value } )}
                                required
                            >
                                <option value="">Seçiniz</option>
                                <option value="POZITIF">Pozitif</option>
                                <option value="NEGATIF">Negatif</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-200">Açıklama</label>
                            <textarea
                                className="form-textarea bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={testData.description}
                                onChange={( e ) => setTestData( { ...testData, description: e.target.value } )}
                                rows="3"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-200">Test Eden</label>
                            <input
                                type="text"
                                className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={testData.performedBy}
                                onChange={( e ) => setTestData( { ...testData, performedBy: e.target.value } )}
                                required
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-gray-200">Notlar</label>
                            <textarea
                                className="form-textarea bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={testData.notes}
                                onChange={( e ) => setTestData( { ...testData, notes: e.target.value } )}
                                rows="2"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-gray-200"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SaleModal( { animal, onClose, onSubmit } ) {
    const [price, setPrice] = useState( '' );

    const handleSubmit = ( e ) => {
        e.preventDefault();
        onSubmit( animal.id, parseFloat( price ) );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Satış İşlemi</h3>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label className="block mb-1 text-gray-200">Satış Fiyatı (TL)</label>
                        <input
                            type="number"
                            className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full"
                            value={price}
                            onChange={( e ) => setPrice( e.target.value )}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-gray-200"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600"
                        >
                            Satışı Tamamla
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ImportModal( { onClose, onSuccess } ) {
    const [file, setFile] = useState( null );
    const [loading, setLoading] = useState( false );
    const [error, setError] = useState( null );
    const fileInputRef = useRef( null );

    const handleFileChange = ( e ) => {
        const selectedFile = e.target.files[0];

        if ( selectedFile ) {
            const fileExt = selectedFile.name.split( '.' ).pop().toLowerCase();

            if ( ['csv', 'xlsx', 'xls'].includes( fileExt ) ) {
                setFile( selectedFile );
                setError( null );
            } else {
                setFile( null );
                setError( 'Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası yükleyin.' );
            }
        } else {
            setFile( null );
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadImportTemplate( 'animals' );
        } catch ( err ) {
            setError( 'Şablon indirilirken bir hata oluştu' );
        }
    };

    const handleSubmit = async ( e ) => {
        e.preventDefault();

        if ( !file ) {
            setError( 'Lütfen bir dosya seçin' );
            return;
        }

        setLoading( true );
        setError( null );

        try {
            const result = await importAnimalsFromFile( file );

            if ( result.success ) {
                onSuccess( result );
            } else {
                setError( result.error || 'Dosya yüklenirken bir hata oluştu' );
            }
        } catch ( err ) {
            setError( err.response?.data?.error || 'Dosya yüklenirken bir hata oluştu' );
        } finally {
            setLoading( false );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-lg w-full border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-100">Toplu Hayvan İçe Aktarma</h3>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <p className="mb-2 text-gray-400">
                            Excel (.xlsx, .xls) veya CSV formatında bir dosya yükleyerek hayvanları toplu olarak ekleyebilirsiniz.
                        </p>

                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="text-blue-400 hover:underline mb-4"
                        >
                            İçe aktarma şablonunu indir
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center mb-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                        >
                            Dosya Seç
                        </button>

                        {file && (
                            <div className="mt-2 text-gray-200">
                                Seçilen Dosya: <span className="font-medium">{file.name}</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-900 text-red-200 p-3 rounded mb-4 border border-red-800">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-gray-200"
                        >
                            İptal
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 flex items-center"
                            disabled={!file || loading}
                        >
                            {loading && <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            {loading ? 'İşleniyor...' : 'İçe Aktar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AnimalList() {
    const {
        animals,
        constants,
        loading,
        error,
        fetchAnimals,
        fetchAnimalsByCategory,
        fetchAnimalsByTestResult,
        fetchAnimalsByDestination,
        fetchAnimalsBySaleStatus,
        recordTestResult,
        completeSale
    } = useAnimal();
    const { hasPermission, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [selectedAnimal, setSelectedAnimal] = useState( null );
    const [showTestModal, setShowTestModal] = useState( false );
    const [showSaleModal, setShowSaleModal] = useState( false );
    const [showImportModal, setShowImportModal] = useState( false );
    const [showDetailModal, setShowDetailModal] = useState( false );
    const [importResult, setImportResult] = useState( null );
    const [pageSize, setPageSize] = useState(10);

    // Yeni eklenen arama state'leri
    const [animalIdSearchTerm, setAnimalIdSearchTerm] = useState('');
    const [tespitNoSearchTerm, setTespitNoSearchTerm] = useState('');
    const [animalSuggestions, setAnimalSuggestions] = useState([]);
    const [tespitNoSuggestions, setTespitNoSuggestions] = useState([]);
    const [selectedAnimalDetails, setSelectedAnimalDetails] = useState(null);

    useEffect( () => {
        fetchAnimals();
    }, [fetchAnimals] );

    // animal_id veya tespit_no arama terimleri değiştiğinde çalışacak efektler
    useEffect(() => {
        // Kullanıcı kimlik doğrulaması yapıldıysa ve arama terimi yeterliyse API çağrısı yap
        if (isAuthenticated && animalIdSearchTerm.length >= 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    // Öneri getirme API çağrısı
                    const response = await axiosInstance.get('/animals/suggestions', {
                        params: {
                            searchTerm: animalIdSearchTerm,
                            searchField: 'animal_id'
                        }
                    });
                    setAnimalSuggestions(response.data?.data || []);
                } catch (error) {
                    console.error('Error fetching animal ID suggestions:', error);
                    setAnimalSuggestions([]);
                }
            }, 300); // 300ms debounce süresi

            return () => clearTimeout(delayDebounceFn);
        }
    }, [isAuthenticated, animalIdSearchTerm]);

    useEffect(() => {
        // Kullanıcı kimlik doğrulaması yapıldıysa ve arama terimi yeterliyse API çağrısı yap
        if (isAuthenticated && tespitNoSearchTerm.length >= 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    // Öneri getirme API çağrısı
                    const response = await axiosInstance.get('/animals/suggestions', {
                        params: {
                            searchTerm: tespitNoSearchTerm,
                            searchField: 'tespit_no'
                        }
                    });
                    setTespitNoSuggestions(response.data?.data || []);
                } catch (error) {
                    console.error('Error fetching tespit no suggestions:', error);
                    setTespitNoSuggestions([]);
                }
            }, 300); // 300ms debounce süresi

            return () => clearTimeout(delayDebounceFn);
        }
    }, [isAuthenticated, tespitNoSearchTerm]);

    const handleImportSuccess = ( result ) => {
        setShowImportModal( false );
        setImportResult( result );
        fetchAnimals();
    };

    const handleCloseImportResult = () => {
        setImportResult( null );
    };

    const handleFilterChange = ( type, value ) => {
        if ( !value ) {
            fetchAnimals();
            return;
        }

        switch ( type ) {
            case 'category':
                fetchAnimalsByCategory( value );
                break;
            case 'testResult':
                fetchAnimalsByTestResult( value );
                break;
            case 'destination':
                fetchAnimalsByDestination( value );
                break;
            case 'saleStatus':
                if ( typeof fetchAnimalsBySaleStatus === 'function' ) {
                    fetchAnimalsBySaleStatus( value );
                }
                break;
            default:
                break;
        }
    };

    const handleTestClick = ( animal ) => {
        setSelectedAnimal( animal );
        setShowTestModal( true );
    };

    const handleSaleClick = ( animal ) => {
        setSelectedAnimal( animal );
        setShowSaleModal( true );
    };

    const handleTestSubmit = async ( animalId, testData ) => {
        try {
            await recordTestResult( animalId, testData );
            setShowTestModal( false );
            setSelectedAnimal( null );
        } catch ( err ) {
            alert( 'Test sonucu kaydedilirken bir hata oluştu' );
        }
    };

    const handleSaleSubmit = async ( animalId, price ) => {
        try {
            await completeSale( animalId, price );
            setShowSaleModal( false );
            setSelectedAnimal( null );
        } catch ( err ) {
            alert( 'Satış işlemi tamamlanırken bir hata oluştu' );
        }
    };

    // DataGrid sütun tanımlamaları
    const columns = [
        { 
            field: 'animal_id', 
            headerName: 'Kimlik', 
            width: 150,
            renderCell: (params) => (
                <button 
                    onClick={() => {
                        setSelectedAnimalDetails(params.row);
                    }}
                    className="text-blue-400 hover:text-blue-500 underline"
                >
                    {params.value}
                </button>
            ),
        },
        { field: 'category', headerName: 'Kategori', width: 150 },
        { 
            field: 'birth_date', 
            headerName: 'Doğum Tarihi', 
            width: 180,
            renderCell: (params) => {
                if (!params.value) return '-';
                
                // Doğum tarihini formatlama
                const birthDate = new Date(params.value);
                const formattedDate = birthDate.toLocaleDateString('tr-TR');
                
                // Yaş hesaplama
                const today = new Date();
                const ageInMs = today - birthDate;
                const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
                let ageText = '';
                
                if (ageInDays < 30) {
                    ageText = `(${ageInDays} gün)`;
                } else if (ageInDays < 365) {
                    const ageInMonths = Math.floor(ageInDays / 30);
                    ageText = `(${ageInMonths} ay)`;
                } else {
                    const ageInYears = Math.floor(ageInDays / 365);
                    ageText = `(${ageInYears} yıl)`;
                }
                
                return (
                    <div>
                        {formattedDate} <span className="text-gray-400">{ageText}</span>
                    </div>
                );
            }
        },
        { 
            field: 'testResult', 
            headerName: 'Test Sonucu', 
            width: 150,
            renderCell: (params) => {
                if (!params.value) {
                    return <Chip label="BELİRLENMEDİ" size="small" sx={{ bgcolor: 'gray.700', color: 'gray.200' }} />;
                }
                
                let color = 'default';
                let label = params.value;
                
                if (params.value === 'POZITIF') {
                    color = 'error';
                    label = 'POZİTİF';
                } else if (params.value === 'NEGATIF') {
                    color = 'success';
                    label = 'NEGATİF';
                } else if (params.value === 'BEKLEMEDE') {
                    color = 'warning';
                    label = 'BEKLEMEDE';
                }
                
                return <Chip label={label} color={color} size="small" />;
            }
        },
        { 
            field: 'saleStatus', 
            headerName: 'Satış Durumu', 
            width: 150,
            renderCell: (params) => {
                let color = 'default';
                
                if (params.value === 'SATILDI') {
                    color = 'success';
                } else if (params.value === 'SATISA_HAZIR') {
                    color = 'primary';
                }
                
                return <Chip label={params.value} color={color} size="small" />;
            }
        },
        { 
            field: 'actions', 
            headerName: 'İşlemler', 
            width: 200,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const animal = params.row;
                
                return (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {animal.category !== 'INEK' && animal.testResult !== 'POZITIF' && animal.testResult !== 'NEGATIF' && (
                            <Button
                                variant="text"
                                color="primary"
                                size="small"
                                onClick={() => handleTestClick(animal)}
                            >
                                Test Kaydet
                            </Button>
                        )}
                        {animal.saleStatus === 'SATISA_HAZIR' && (
                            <Button
                                variant="text"
                                color="success"
                                size="small"
                                onClick={() => handleSaleClick(animal)}
                            >
                                Satış Yap
                            </Button>
                        )}
                    </Box>
                );
            }
        },
    ];

    // Veriyi yenile
    const handleRefreshData = () => {
        fetchAnimals();
    };

    if ( loading && !animals.length ) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if ( error ) {
        return (
            <div className="p-6 bg-gray-900 min-h-screen">
                <div className="p-4 bg-red-900 text-red-200 rounded-lg shadow-lg border border-red-800">
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 min-h-screen">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Hayvan Yönetimi
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<CloudUploadIcon />}
                        component={Link}
                        to="/animals/import"
                        sx={{ mr: 1 }}
                    >
                        Toplu İçe Aktar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        component={Link}
                        to="/animals/new"
                        sx={{ mr: 1 }}
                    >
                        Yeni Hayvan
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                        onClick={handleRefreshData}
                        disabled={loading}
                    >
                        {loading ? 'Yükleniyor...' : 'Yenile'}
                    </Button>
                </Box>
            </Box>

            {importResult && (
                <div className="mb-6 p-4 bg-green-900 text-green-100 rounded-lg shadow-lg border border-green-700 flex justify-between items-center">
                    <div>
                        <p className="font-medium">{importResult.message}</p>
                        <p className="text-sm mt-1">
                            Toplam: {importResult.result.total}, Başarılı: {importResult.result.inserted}, Başarısız: {importResult.result.failed}
                        </p>
                    </div>
                    <button
                        onClick={handleCloseImportResult}
                        className="text-green-200 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            <FilterBar onFilterChange={handleFilterChange} constants={constants} />

            {/* Yeni eklenen Arama Bölümü */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px] relative">
                    <label className="block mb-1 text-gray-200 text-sm font-medium">Animal ID Ara (Küpe No)</label>
                    <input
                        type="text"
                        className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full pr-10"
                        placeholder="Küpe No girin (min 2 karakter)"
                        value={animalIdSearchTerm}
                        onChange={(e) => setAnimalIdSearchTerm(e.target.value)}
                    />

                    {animalSuggestions.length > 0 && animalIdSearchTerm.length >= 1 && !selectedAnimalDetails && (
                        <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {animalSuggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-600 text-gray-200 text-sm border-b border-gray-600 last:border-b-0"
                                    onClick={() => {
                                        console.log('Animal ID önerisi seçildi:', suggestion);
                                        setSelectedAnimalDetails(suggestion);
                                        setAnimalIdSearchTerm(suggestion.animal_id || '');
                                        setAnimalSuggestions([]);
                                        setTespitNoSearchTerm('');
                                    }}
                                >
                                    <span className="font-semibold">{suggestion.animal_id}</span> ({suggestion.category || '-'}) {suggestion.tespit_no ? `- ${suggestion.tespit_no}` : ''}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-[250px] relative">
                    <label className="block mb-1 text-gray-200 text-sm font-medium">Tespit No Ara</label>
                    <input
                        type="text"
                        className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full pr-10"
                        placeholder="Tespit No girin (min 2 karakter)"
                        value={tespitNoSearchTerm}
                        onChange={(e) => setTespitNoSearchTerm(e.target.value)}
                    />

                    {tespitNoSuggestions.length > 0 && tespitNoSearchTerm.length >= 1 && !selectedAnimalDetails && (
                        <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {tespitNoSuggestions.map((suggestion) => (
                                <div
                                    key={suggestion.id}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-600 text-gray-200 text-sm border-b border-gray-600 last:border-b-0"
                                    onClick={() => {
                                        console.log('Tespit No önerisi seçildi:', suggestion);
                                        setSelectedAnimalDetails(suggestion);
                                        setTespitNoSearchTerm(suggestion.tespit_no || '');
                                        setTespitNoSuggestions([]);
                                        setAnimalIdSearchTerm('');
                                    }}
                                >
                                    <span className="font-semibold">{suggestion.tespit_no}</span> ({suggestion.category || '-'}) {suggestion.animal_id ? `- ${suggestion.animal_id}` : ''}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedAnimalDetails && (
                    <div className="flex items-end pb-2">
                        <button
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                            onClick={() => {
                                setSelectedAnimalDetails(null);
                                setAnimalIdSearchTerm('');
                                setTespitNoSearchTerm('');
                                setAnimalSuggestions([]);
                                setTespitNoSuggestions([]);
                            }}
                        >
                            Aramayı Temizle
                        </button>
                    </div>
                )}
            </div>

            {/* Seçilen Hayvan Detayları Bölümü */}
            {selectedAnimalDetails && (
                <div className="mb-6 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-gray-100">
                    <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-3">Seçilen Hayvan Detayları</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* Küpe No */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-5 0a2 2 0 11-4 0 2 2 0 014 0zm0 0V4a2 2 0 114 0v2m-4 0h4m-4 6h4m-2 4h2" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Küpe No:</p>
                                <Chip label={selectedAnimalDetails.animal_id || '-'} color="primary" size="medium" sx={{ bgcolor: 'rgb(59, 130, 246, 0.2)', color: 'rgb(96, 165, 250)', fontWeight: 'bold' }} />
                            </div>
                        </div>

                        {/* Tespit No */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-1m-4 0V8a1 1 0 011-1h4a1 1 0 011 1v12m-4-1h4m2 0h4m-2 0a1 1 0 002 0v-2a1 1 0 00-2 0v2m-3 0a1 1 0 002 0v-3a1 1 0 00-2 0v3z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Tespit No:</p>
                                <Chip label={selectedAnimalDetails.tespit_no || '-'} color="warning" size="medium" sx={{ bgcolor: 'rgb(251, 191, 36, 0.2)', color: 'rgb(252, 211, 77)', fontWeight: 'bold' }} />
                            </div>
                        </div>

                        {/* Kategori */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m.707-1.414L14.586 9.414m-9.192 9.192L18.364 5.636m2.121 2.121L14.586 14.586m-9.192 9.192L5.636 18.364m2.121-2.121L9.414 13.414m8.182 0l-2.828 2.828" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Kategori:</p>
                                <span className="text-gray-100 text-lg font-semibold">{selectedAnimalDetails.category || '-'}</span>
                            </div>
                        </div>

                        {/* Doğum Tarihi (Yaş) */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Doğum Tarihi (Yaş):</p>
                                <span className="text-gray-100 text-lg">
                                {selectedAnimalDetails.birth_date ?
                                    new Date(selectedAnimalDetails.birth_date).toLocaleDateString('tr-TR') +
                                    (selectedAnimalDetails.birth_date ?
                                        ` (${new Date().getFullYear() - new Date(selectedAnimalDetails.birth_date).getFullYear()} yıl)`
                                        : '')
                                    : '-'}
                                </span>
                            </div>
                        </div>

                        {/* Cinsiyet */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636L16.95 7.05a4.95 4.95 0 00-7.006 0H8.55a4.95 4.95 0 00-7.006 0L.636 8.05a4.95 4.95 0 000 7.007L2.05 16.95a4.95 4.95 0 007.007 0H10.45a4.95 4.95 0 007.006 0l1.414-1.414a4.95 4.95 0 000-7.007z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Cinsiyet:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.gender || '-'}</span>
                            </div>
                        </div>

                        {/* Amaç */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Amaç:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.purpose || '-'}</span>
                            </div>
                        </div>

                        {/* Durum */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Durum:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.status || '-'}</span>
                            </div>
                        </div>

                        {/* Test Durumu */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.275a1.99 1.99 0 010 2.828m0 0a1.99 1.99 0 00-2.828 0m2.828 0L9 17.172m0 0L3.22 11.396m1.414-1.414L9 14.343m0 0L3.22 8.565m1.414 1.414L9 11.396m0 0L3.22 5.62m1.414 1.414L9 8.565m0 0L3.22-.151m1.414 1.414L9 2.787m0 0L3.22 2.787M12 8v.01" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Test Durumu:</p>
                                {selectedAnimalDetails.testResult ? (
                                    <Chip
                                        label={selectedAnimalDetails.testResult === 'POZITIF' ? 'POZİTİF' : selectedAnimalDetails.testResult === 'NEGATIF' ? 'NEGATİF' : selectedAnimalDetails.testResult}
                                        color={selectedAnimalDetails.testResult === 'POZITIF' ? 'error' : selectedAnimalDetails.testResult === 'NEGATIF' ? 'success' : 'default'}
                                        size="medium"
                                        sx={{
                                            bgcolor: selectedAnimalDetails.testResult === 'POZITIF' ? 'rgb(239, 68, 68, 0.2)' : selectedAnimalDetails.testResult === 'NEGATIF' ? 'rgb(34, 197, 94, 0.2)' : 'rgb(107, 114, 128, 0.2)',
                                            color: selectedAnimalDetails.testResult === 'POZITIF' ? 'rgb(252, 165, 165)' : selectedAnimalDetails.testResult === 'NEGATIF' ? 'rgb(134, 239, 172)' : 'rgb(209, 213, 219)',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                ) : (
                                    <Chip label="BELİRLENMEDİ" size="medium" sx={{ bgcolor: 'rgb(107, 114, 128, 0.2)', color: 'rgb(209, 213, 219)', fontWeight: 'bold' }} />
                                )}
                            </div>
                        </div>

                        {/* Fiyat */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V3m0 9v3m0 3v2.926a2.397 2.397 0 01-.599.491l-1.752 1.752Ac2.397 2.397 0 0012 21c1.657 0 3-.895 3-2s-1.343-2-3-2m0-8c-1.11 0-2.08-.402-2.599-1M12 8V3m0 9v3m0 3v2.926a2.397 2.397 0 00-.599.491l-1.752 1.752Ac2.397 2.397 0 0012 21c1.657 0 3-.895 3-2s-1.343-2-3-2" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Fiyat:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.price ? `${selectedAnimalDetails.price} TL` : '-'}</span>
                            </div>
                        </div>

                        {/* Satış Durumu */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Satış Durumu:</p>
                                <Chip label={selectedAnimalDetails.sale_status || '-'} color="error" size="medium" sx={{ bgcolor: 'rgb(239, 68, 68, 0.2)', color: 'rgb(252, 165, 165)', fontWeight: 'bold' }} />
                            </div>
                        </div>

                        {/* Satış Tarihi */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Satış Tarihi:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.sale_date ? new Date(selectedAnimalDetails.sale_date).toLocaleDateString('tr-TR') : '-'}</span>
                            </div>
                        </div>

                        {/* Anne No */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9m-7 0h5v-2a3 3 0 01-5.356-1.857M12 11v9m-2-4h4m-9-4h9m7-4h-9m2 4h-4m-2-4h4m-2 4h-4m-2-4h4" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Anne No:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.anne_no || '-'}</span>
                            </div>
                        </div>

                        {/* Baba No */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-9a2 2 0 00-2-2H9a2 2 0 00-2 2v9m-7 0h5v-2a3 3 0 01-5.356-1.857M12 11v9m-2-4h4m-9-4h9m7-4h-9m2 4h-4m-2-4h4m-2 4h-4m-2-4h4" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Baba No:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.baba_no || '-'}</span>
                            </div>
                        </div>

                        {/* Tohumlama Tarihi */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Tohumlama Tarihi:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.tohumlama_tarihi ? new Date(selectedAnimalDetails.tohumlama_tarihi).toLocaleDateString('tr-TR') : '-'}</span>
                            </div>
                        </div>

                        {/* Tohtar */}
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Tohtar:</p>
                                <span className="text-gray-100 text-lg">{selectedAnimalDetails.tohtar || '-'}</span>
                            </div>
                        </div>

                        {/* Görsel */}
                        {selectedAnimalDetails.image_url && (
                            <div className="md:col-span-full flex flex-col items-center">
                                <p className="text-sm font-medium text-gray-400 mb-2">Görsel:</p>
                                <div className="bg-gray-700 p-2 rounded-md max-w-sm w-full">
                                    <img
                                        src={selectedAnimalDetails.image_url}
                                        alt={`Hayvan ${selectedAnimalDetails.animal_id || ''}`}
                                        className="w-full h-auto rounded max-h-64 object-contain"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 text-right">
                        <Link
                            to={`/animals/${selectedAnimalDetails.id}`}
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 inline-flex items-center transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a12.006 12.006 0 01-.367-.404l-6.108-6.108a1.2 1.2 0 00-1.7 0L3.77 8.293a1.2 1.2 0 000 1.7l6.108 6.108c.128.128.264.244.404.367M15 18a3 3 0 11-6 0 3 3 0 016 0zM17 21l-2-2m-3-3l-2-2m11-2a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h11z"/></svg>
                            Detayları Görüntüle / Düzenle
                        </Link>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden h-[600px]">
                <DataGrid
                    rows={animals}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 },
                        },
                    }}
                    pageSizeOptions={[5, 10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    }}
                    localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
                    loading={loading}
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-root': {
                            backgroundColor: 'rgb(31, 41, 55)',
                            color: 'rgb(209, 213, 219)',
                            border: '1px solid rgb(75, 85, 99)',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'rgb(55, 65, 81)',
                            color: 'rgb(209, 213, 219)',
                            borderBottom: '1px solid rgb(75, 85, 99)',
                            fontWeight: 'bold',
                        },
                        '& .MuiDataGrid-row': {
                            '&:nth-of-type(odd)': {
                                backgroundColor: 'rgb(40, 50, 60)',
                            },
                            '&:hover': {
                                backgroundColor: 'rgb(65, 75, 90)',
                            },
                            borderBottom: '1px solid rgb(75, 85, 99)',
                        },
                        '& .MuiDataGrid-cell': {
                            color: 'rgb(209, 213, 219)',
                            padding: '10px',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid rgb(75, 85, 99)',
                            backgroundColor: 'rgb(55, 65, 81)',
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiTablePagination-root': {
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiButtonBase-root': {
                            color: 'rgb(129, 140, 248)',
                        },
                        '& .MuiButton-text': {
                            color: 'rgb(129, 140, 248) !important',
                        },
                        '& .MuiInputBase-root': {
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiDataGrid-toolbarContainer': {
                            backgroundColor: 'rgb(55, 65, 81)',
                            color: 'rgb(209, 213, 219)',
                            borderBottom: '1px solid rgb(75, 85, 99)',
                            padding: '8px',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px'
                        },
                        '& .MuiDataGrid-globalFilterInput': {
                            color: 'rgb(209, 213, 219)',
                            backgroundColor: 'rgb(31, 41, 55)',
                            border: '1px solid rgb(75, 85, 99)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                        },
                        '& .MuiDataGrid-sortIcon': {
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiDataGrid-filterIcon': {
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiDataGrid-columnSeparator': {
                            color: 'rgb(75, 85, 99)',
                        },
                        '& .MuiDataGrid-overlay': {
                            backgroundColor: 'rgba(31, 41, 55, 0.7)',
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiDataGrid-noRowsOverlay': {
                            backgroundColor: 'rgb(31, 41, 55)',
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select, & .MuiTablePagination-root .MuiIconButton-root ': {
                            color: 'rgb(209, 213, 219)',
                        },
                        '& .MuiTablePagination-root .MuiSvgIcon-root': {
                            color: 'rgb(209, 213, 219)',
                        }
                    }}
                />
            </div>

            {showTestModal && selectedAnimal && (
                <TestModal
                    animal={selectedAnimal}
                    onClose={() => {
                        setShowTestModal( false );
                        setSelectedAnimal( null );
                    }}
                    onSubmit={handleTestSubmit}
                />
            )}

            {showSaleModal && selectedAnimal && (
                <SaleModal
                    animal={selectedAnimal}
                    onClose={() => {
                        setShowSaleModal( false );
                        setSelectedAnimal( null );
                    }}
                    onSubmit={handleSaleSubmit}
                />
            )}

            {showImportModal && (
                <ImportModal
                    onClose={() => setShowImportModal( false )}
                    onSuccess={handleImportSuccess}
                />
            )}

            {showDetailModal && selectedAnimal && (
                <DetailModal
                    animal={selectedAnimal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedAnimal(null);
                    }}
                />
            )}
        </div>
    );
}

function DetailModal({ animal, onClose }) {
    if (!animal) return null;
    
    // Doğum tarihini formatlama ve yaş hesaplama
    const formatBirthDate = (birthDateStr) => {
        if (!birthDateStr) return { formatted: '-', age: '' };
        
        const birthDate = new Date(birthDateStr);
        const formattedDate = birthDate.toLocaleDateString('tr-TR');
        
        // Yaş hesaplama
        const today = new Date();
        const ageInMs = today - birthDate;
        const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
        let ageText = '';
        
        if (ageInDays < 30) {
            ageText = `(${ageInDays} gün)`;
        } else if (ageInDays < 365) {
            const ageInMonths = Math.floor(ageInDays / 30);
            ageText = `(${ageInMonths} ay)`;
        } else {
            const ageInYears = Math.floor(ageInDays / 365);
            ageText = `(${ageInYears} yıl)`;
        }
        
        return { formatted: formattedDate, age: ageText };
    };
    
    const birthDateInfo = formatBirthDate(animal.birth_date);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-100">Hayvan Detayları</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Kimlik</h4>
                        <p className="text-lg text-gray-100">{animal.animal_id || '-'}</p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Kategori</h4>
                        <p className="text-lg text-gray-100">{animal.category || '-'}</p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Doğum Tarihi</h4>
                        <p className="text-lg text-gray-100">
                            {birthDateInfo.formatted} <span className="text-gray-400">{birthDateInfo.age}</span>
                        </p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Cinsiyet</h4>
                        <p className="text-lg text-gray-100">{animal.gender || '-'}</p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Irk</h4>
                        <p className="text-lg text-gray-100">{animal.breed || '-'}</p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Amaç</h4>
                        <p className="text-lg text-gray-100">{animal.purpose || '-'}</p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Durum</h4>
                        <p className="text-lg text-gray-100">{animal.status || '-'}</p>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Fiyat</h4>
                        <p className="text-lg text-gray-100">{animal.price ? `${animal.price} TL` : '-'}</p>
                    </div>
                </div>
                
                {animal.notes && (
                    <div className="bg-gray-700 p-4 rounded-lg mb-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Notlar</h4>
                        <p className="text-gray-100">{animal.notes}</p>
                    </div>
                )}
                
                {animal.image_url && (
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Görsel</h4>
                        <div className="bg-gray-700 p-2 rounded-lg">
                            <img 
                                src={animal.image_url} 
                                alt={`Hayvan ${animal.animal_id}`} 
                                className="w-full h-auto rounded max-h-64 object-contain"
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                    >
                        Kapat
                    </button>
                    
                    <Link 
                        to={`/animals/${animal.id}`}
                        className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                    >
                        Düzenle
                    </Link>
                </div>
            </div>
        </div>
    );
}

// READ_ANIMAL yetkisi gerektir
export default withPermission(AnimalList, 'READ_ANIMAL');
