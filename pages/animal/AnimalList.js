import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnimal } from '../../contexts/AnimalContext';
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
    Typography,
    Snackbar,
    Alert
} from '@mui/material';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';

function FilterBar( { onFilterChange, constants } ) {
    if ( !constants ) return null;

    console.log( 'FilterBar constants:', JSON.stringify( constants, null, 2 ) ); // constants değerini daha detaylı logla

    return (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 mb-6">
            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'category', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Kategoriler</option>
                {Object.entries( constants?.categories || {} ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>

            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'testResult', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Test Sonuçları</option>
                {Object.entries( constants?.testResults || {} ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>

            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'destination', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Hedef Şirketler</option>
                {Object.entries( constants?.destinationCompanies || {} ).map( ( [key, value] ) => (
                    <option key={key} value={value}>{value}</option>
                ) )}
            </select>

            <select
                className="form-select bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                onChange={( e ) => onFilterChange( 'saleStatus', e.target.value )}
                defaultValue=""
            >
                <option value="">Tüm Satış Durumları</option>
                {Object.entries( constants?.saleStatuses || {} ).map( ( [key, value] ) => (
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
    const navigate = useNavigate();
    const [animals, setAnimals] = useState( [] );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );
    const [testModalOpen, setTestModalOpen] = useState( false );
    const [saleModalOpen, setSaleModalOpen] = useState( false );
    const [selectedAnimal, setSelectedAnimal] = useState( null );
    const [detailModalOpen, setDetailModalOpen] = useState( false );
    const [selectedAnimalDetails, setSelectedAnimalDetails] = useState( null );
    const [filters, setFilters] = useState( {} );
    const [constants, setConstants] = useState( null );
    const [importModalOpen, setImportModalOpen] = useState( false );
    const [importResult, setImportResult] = useState( null );
    const fileInputRef = useRef( null );
    const [animalIdSearchTerm, setAnimalIdSearchTerm] = useState( '' );
    const [tespitNoSearchTerm, setTespitNoSearchTerm] = useState( '' );
    const [animalSuggestions, setAnimalSuggestions] = useState( [] );
    const suggestionsTimeoutRef = useRef( null );
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'error' // 'error', 'warning', 'info', 'success'
    });

    // Bileşen ilk yüklendiğinde verileri ve sabitleri çek
    useEffect(() => {
        setLoading(true); // Yüklemeyi başlat
        Promise.all([loadAnimals(), loadConstants()])
            .catch(err => {
                // Hata durumunda bile yüklemeyi sonlandır
                console.error("İlk yükleme sırasında genel hata:", err);
                setError("Veriler yüklenirken bir sorun oluştu.");
            })
            .finally(() => {
                // Her durumda yüklemeyi sonlandır
                // setLoading(false); // loadAnimals zaten kendi içinde setLoading(false) yapıyor.
                // Ancak loadConstants için ayrıca bir setLoading(false) gerekebilir eğer o da uzun sürüyorsa
                // Şimdilik loadAnimals içindeki yeterli olacaktır.
            });
    }, []); // Boş bağımlılık dizisi, sadece mount ve unmount'ta çalışır

    // DataGrid sütun tanımlamaları
    const columns = [
        {
            field: 'kupeno',
            headerName: 'Küpe No',
            width: 150,
            renderCell: ( params ) => (
                <button
                    onClick={() => {
                        setSelectedAnimalDetails( params.row );
                    }}
                    className="text-blue-400 hover:text-blue-500 underline"
                >
                    {params.value}
                </button>
            ),
        },
        { field: 'kategori', headerName: 'Kategori', width: 150 },
        {
            field: 'dogtar',
            headerName: 'Doğum Tarihi',
            width: 180,
            renderCell: ( params ) => {
                if ( !params.value ) return '-';
                const dateObj = new Date( params.value );
                if ( isNaN( dateObj.getTime() ) ) return params.value;
                return dateObj.toLocaleDateString( 'tr-TR' );
            }
        },
        { field: 'cinsiyet', headerName: 'Cinsiyet', width: 120 },
        { field: 'amac', headerName: 'Amaç', width: 120 },
        {
            field: 'durum',
            headerName: 'Durum',
            width: 150,
            renderCell: ( params ) => {
                const value = params.value;
                let color = 'default';

                if ( value && value.toLowerCase().includes( 'pozitif' ) ) {
                    color = 'error';
                } else if ( value && value.toLowerCase().includes( 'negatif' ) ) {
                    color = 'success';
                } else if ( value && value.toLowerCase().includes( 'bekliyor' ) ) {
                    color = 'warning';
                }

                return <Chip label={value || 'Belirtilmemiş'} color={color} size="small" />;
            }
        },
        {
            field: 'actions',
            headerName: 'İşlemler',
            width: 180,
            renderCell: ( params ) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleTestClick( params.row )}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                        Test
                    </button>
                    <button
                        onClick={() => handleSaleClick( params.row )}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                        Satış
                    </button>
                </div>
            )
        }
    ];

    const handleImportSuccess = ( result ) => {
        setImportResult( result );
        setImportModalOpen( false );
        loadAnimals(); // Verileri yenile
    };

    const handleCloseImportResult = () => {
        setImportResult( null );
    };

    const handleFilterChange = ( type, value ) => {
        if ( value === '' ) {
            const newFilters = { ...filters };
            delete newFilters[type];
            setFilters( newFilters );
        } else {
            setFilters( { ...filters, [type]: value } );
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            loadAnimals();
        }, 500); // 500ms gecikme ekle

        return () => clearTimeout(debounceTimer);
    }, [filters]);

    // Snackbar kapatma fonksiyonu
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Hata gösterme fonksiyonu
    const showError = (message) => {
        setSnackbar({
            open: true,
            message,
            severity: 'error'
        });
    };

    // Hayvan ID/Küpe No önerilerini getir
    useEffect(() => {
        if (animalIdSearchTerm && animalIdSearchTerm.length >= 1) {
            clearTimeout(suggestionsTimeoutRef.current);

            suggestionsTimeoutRef.current = setTimeout(async () => {
                try {
                    console.log('Küpe no önerileri isteniyor:', animalIdSearchTerm);
                    const response = await axiosInstance.get(`/animals/suggestions?searchTerm=${animalIdSearchTerm}&searchField=kupeno`);

                    console.log('Küpe no önerileri yanıtı:', response.data);
                    if (response.data && response.data.data) {
                        // Tespit numarası olmayan hayvanları filtrele
                        const filteredSuggestions = response.data.data.filter(animal => !animal.tespitno);
                        setAnimalSuggestions(filteredSuggestions);
                    }
                } catch (err) {
                    console.error('Küpe no önerileri alınırken hata:', err);
                    setAnimalSuggestions([]);
                    showError('Hayvan önerileri alınırken bir hata oluştu');
                }
            }, 300);
        } else {
            setAnimalSuggestions([]);
        }

        return () => clearTimeout(suggestionsTimeoutRef.current);
    }, [animalIdSearchTerm]);

    // Tespit No önerilerini getir
    useEffect(() => {
        if (tespitNoSearchTerm && tespitNoSearchTerm.length >= 1) {
            clearTimeout(suggestionsTimeoutRef.current);

            suggestionsTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await axiosInstance.get(`/animals/suggestions?searchTerm=${tespitNoSearchTerm}&searchField=tespitno`);
                    if (response.data && response.data.data) {
                        // Tespit numarası olmayan hayvanları filtrele
                        const filteredSuggestions = response.data.data.filter(animal => !animal.tespitno);
                        setAnimalSuggestions(filteredSuggestions);
                    }
                } catch (err) {
                    console.error('Tespit no önerileri alınırken hata:', err);
                    setAnimalSuggestions([]);
                    showError('Hayvan önerileri alınırken bir hata oluştu');
                }
            }, 300);
        } else {
            setAnimalSuggestions([]);
        }

        return () => clearTimeout(suggestionsTimeoutRef.current);
    }, [tespitNoSearchTerm]);

    const handleTestClick = ( animal ) => {
        setSelectedAnimal( animal );
        setTestModalOpen( true );
    };

    const handleSaleClick = ( animal ) => {
        setSelectedAnimal( animal );
        setSaleModalOpen( true );
    };

    const handleTestSubmit = async (animalId, testData) => {
        try {
            await axiosInstance.post(`/animals/${animalId}/test-result`, testData);
            setTestModalOpen(false);
            loadAnimals(); // Verileri yenile
        } catch (err) {
            console.error('Test sonucu kaydedilirken hata:', err);
            const errorMessage = err.response?.data?.message || 'Test sonucu kaydedilirken bir hata oluştu';
            showError(errorMessage);
        }
    };

    const handleSaleSubmit = async ( animalId, price ) => {
        try {
            await axiosInstance.post( `/animals/${animalId}/sale`, { price } );
            setSaleModalOpen( false );
            loadAnimals(); // Verileri yenile
        } catch ( err ) {
            console.error( 'Satış işlemi gerçekleştirilirken hata:', err );
        }
    };

    const loadAnimals = async () => {
        // if (loading) return; // Bu kontrol, ilk yükleme useEffect'i ile çakışabilir. Şimdilik yorum satırı yapalım.
        
        setLoading(true);
        try {
            // İstek öncesi kısa bir gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Filtreler ile API'yi çağır
            let url = '/animals';

            if (Object.keys(filters).length > 0) {
                url += '?';
                Object.entries(filters).forEach(([key, value], index) => {
                    url += `${index > 0 ? '&' : ''}${key}=${value}`;
                });
            }

            const response = await axiosInstance.get(url);

            if (response.data && Array.isArray(response.data.data)) {
                setAnimals(response.data.data);
                setError(null);
            } else {
                console.error('Beklenmeyen API yanıt formatı:', response.data);
                setAnimals([]);
                setError('Veri alınırken bir sorun oluştu. Beklenmeyen API yanıt formatı.');
            }
        } catch (err) {
            console.error('Hayvanlar listesi alınırken hata:', err);
            setAnimals([]);
            setError('Hayvanlar listesi alınırken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const loadConstants = async () => {
        try {
            const response = await axiosInstance.get( '/animals/constants' );
            if ( response.data && response.data.data ) {
                setConstants( response.data.data );
            }
        } catch ( err ) {
            console.error( 'Sabitler alınırken hata:', err );
        }
    };

    const handleRefreshData = () => {
        loadAnimals();
    };

    // DetailModal bileşeni burada tanımlandı
    function DetailModal( { animal, onClose } ) {
        console.log( 'DetailModal animal:', animal );

        const formatBirthDate = ( birthDateStr ) => {
            if ( !birthDateStr ) return '-';
            const dateObj = new Date( birthDateStr );
            if ( isNaN( dateObj.getTime() ) ) return birthDateStr;
            return dateObj.toLocaleDateString( 'tr-TR' );
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-100">Hayvan Detayları</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>

                    {animal ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-lg font-medium text-gray-300">Temel Bilgiler</h4>
                                    <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Küpe No:</span>
                                            <span className="text-gray-200 font-medium">{animal.kupeno}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Tespit No:</span>
                                            <span className="text-gray-200 font-medium">{animal.tespitno || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Kategori:</span>
                                            <span className="text-gray-200 font-medium">{animal.kategori || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Doğum Tarihi:</span>
                                            <span className="text-gray-200 font-medium">{formatBirthDate( animal.dogtar )}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Cinsiyet:</span>
                                            <span className="text-gray-200 font-medium">{animal.cinsiyet || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-lg font-medium text-gray-300">Fiziksel Özellikler</h4>
                                    <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Irk:</span>
                                            <span className="text-gray-200 font-medium">{animal.irk || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Renk:</span>
                                            <span className="text-gray-200 font-medium">{animal.renk || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Ağırlık:</span>
                                            <span className="text-gray-200 font-medium">{animal.agirlik ? `${animal.agirlik} kg` : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-lg font-medium text-gray-300">Durum Bilgileri</h4>
                                    <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Amaç:</span>
                                            <span className="text-gray-200 font-medium">{animal.amac || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Durum:</span>
                                            <Chip
                                                label={animal.durum || 'Belirtilmemiş'}
                                                color={
                                                    animal.durum && animal.durum.toLowerCase().includes( 'pozitif' ) ? 'error' :
                                                        animal.durum && animal.durum.toLowerCase().includes( 'negatif' ) ? 'success' :
                                                            'default'
                                                }
                                                size="small"
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Satış Durumu:</span>
                                            <span className="text-gray-200 font-medium">{animal.durum || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Gebelik Durumu:</span>
                                            <span className="text-gray-200 font-medium">{animal.gebelikdurum || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Süt Verimi Bilgileri - Dişi hayvanlar için */}
                                    {animal.cinsiyet === 'Dişi' && animal.sut_verimi && (
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-medium text-gray-300">Süt Verimi</h4>
                                            <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Buzağılama Tarihi:</span>
                                                    <span className="text-gray-200 font-medium">
                                                        {animal.sut_verimi.buzagilama_tarihi ? 
                                                            new Date(animal.sut_verimi.buzagilama_tarihi).toLocaleDateString('tr-TR') : 
                                                            '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Sağmal Gün:</span>
                                                    <span className="text-gray-200 font-medium">
                                                        {animal.sut_verimi.sagmal_gun || 0} gün
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Günlük Süt Ortalaması:</span>
                                                    <span className="text-gray-200 font-medium">
                                                        {animal.sut_verimi.gunluk_sut_ortalamasi ? 
                                                            `${animal.sut_verimi.gunluk_sut_ortalamasi} lt` : 
                                                            '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Son Ölçüm Tarihi:</span>
                                                    <span className="text-gray-200 font-medium">
                                                        {animal.sut_verimi.olcum_tarihi ? 
                                                            new Date(animal.sut_verimi.olcum_tarihi).toLocaleDateString('tr-TR') : 
                                                            '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Anne Süt Verimi - Dişi buzağılar için */}
                                    {animal.cinsiyet === 'Dişi' && animal.anne_sut_verimi && (
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-medium text-gray-300">Anne Süt Verimi</h4>
                                            <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Anne Günlük Süt Ortalaması:</span>
                                                    <span className="text-gray-200 font-medium">
                                                        {animal.anne_sut_verimi.gunluk_sut_ortalamasi ? 
                                                            `${animal.anne_sut_verimi.gunluk_sut_ortalamasi} lt` : 
                                                            '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Son Ölçüm Tarihi:</span>
                                                    <span className="text-gray-200 font-medium">
                                                        {animal.anne_sut_verimi.olcum_tarihi ? 
                                                            new Date(animal.anne_sut_verimi.olcum_tarihi).toLocaleDateString('tr-TR') : 
                                                            '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-lg font-medium text-gray-300">Kayıt Bilgileri</h4>
                                    <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Eklenme Tarihi:</span>
                                            <span className="text-gray-200 font-medium">{
                                                animal.created_at
                                                    ? new Date( animal.created_at ).toLocaleDateString( 'tr-TR' )
                                                    : '-'
                                            }</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Güncelleme Tarihi:</span>
                                            <span className="text-gray-200 font-medium">{
                                                animal.updated_at
                                                    ? new Date( animal.updated_at ).toLocaleDateString( 'tr-TR' )
                                                    : '-'
                                            }</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-lg font-medium text-gray-300">Notlar</h4>
                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <p className="text-gray-200">
                                        {animal.aciklama || 'Not bulunmuyor.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-700">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => navigate( `/animals/${animal.id}/edit` )}
                                >
                                    Düzenle
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={onClose}
                                >
                                    Kapat
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center p-8">
                            <CircularProgress />
                        </div>
                    )}
                </div>
            </div>
        );
    }

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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-200">Hayvan Listesi</h1>
                <div className="flex space-x-3">
                    <Tooltip title="Verileri Yenile">
                        <IconButton
                            onClick={handleRefreshData}
                            color="primary"
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>

                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => setImportModalOpen( true )}
                    >
                        İçe Aktar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        component={Link}
                        to="/animals/add"
                    >
                        Yeni Ekle
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                    <div className="relative flex-1">
                        <label htmlFor="animalId" className="block text-gray-300 mb-1">Küpe No veya ID ile Ara</label>
                        <input
                            id="animalId"
                            type="text"
                            className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full rounded-md"
                            placeholder="Küpe no veya ID girin..."
                            value={animalIdSearchTerm}
                            onChange={( e ) => setAnimalIdSearchTerm( e.target.value )}
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
                                            setAnimalIdSearchTerm(suggestion.kupeno || '');
                                            setAnimalSuggestions([]);
                                            setTespitNoSearchTerm('');
                                        }}
                                    >
                                        <div className="font-medium flex items-center gap-2">
                                            {suggestion.kupeno}
                                            {suggestion.tespitno && (
                                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                                    Tespit: {suggestion.tespitno}
                                                </span>
                                            )}
                                            {suggestion.test_durumu && (
                                                <span className={`px-2 py-0.5 ${suggestion.test_durumu === 'Sonuç Bekleniyor' ? 'bg-yellow-500' : 'bg-green-500'} text-white text-xs rounded-full`}>
                                                    {suggestion.test_durumu}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {suggestion.kategori} - {suggestion.cinsiyet} - {suggestion.durum}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative flex-1">
                        <label htmlFor="tespitNo" className="block text-gray-300 mb-1">Tespit No ile Ara</label>
                        <input
                            id="tespitNo"
                            type="text"
                            className="form-input bg-gray-700 text-gray-200 border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full rounded-md"
                            placeholder="Tespit no girin..."
                            value={tespitNoSearchTerm}
                            onChange={( e ) => setTespitNoSearchTerm( e.target.value )}
                        />

                        {animalSuggestions.length > 0 && tespitNoSearchTerm.length >= 1 && !selectedAnimalDetails && (
                            <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {animalSuggestions.map( ( suggestion ) => (
                                    <div
                                        key={suggestion.id}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-600 text-gray-200 text-sm border-b border-gray-600 last:border-b-0"
                                        onClick={() => {
                                            console.log( 'Tespit no önerisi seçildi:', suggestion );
                                            setSelectedAnimalDetails( suggestion );
                                            setTespitNoSearchTerm( suggestion.tespitno || '' );
                                            setAnimalSuggestions( [] );
                                            setAnimalIdSearchTerm( '' );
                                        }}
                                    >
                                        <div className="font-medium">{suggestion.tespitno}</div>
                                        <div className="text-xs text-gray-400">
                                            {suggestion.kupeno} - {suggestion.kategori} - {suggestion.durum}
                                        </div>
                                    </div>
                                ) )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filtre çubuğu */}
            <FilterBar onFilterChange={handleFilterChange} constants={constants} />

            {selectedAnimalDetails && (
                <div className="mb-6 p-4 bg-gray-800 border border-blue-500 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium text-gray-200">Seçili Hayvan</h3>
                            <p className="text-gray-400">
                                Küpe No: <span className="text-blue-400">{selectedAnimalDetails.kupeno}</span> |
                                Tespit No: <span className="text-blue-400">{selectedAnimalDetails.tespitno || 'Belirtilmemiş'}</span> |
                                Kategori: <span className="text-blue-400">{selectedAnimalDetails.kategori}</span>
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setDetailModalOpen( true )}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Detaylar
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedAnimalDetails( null );
                                    setAnimalIdSearchTerm( '' );
                                    setTespitNoSearchTerm( '' );
                                }}
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Temizle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <CircularProgress />
                </div>
            ) : (
                <div style={{ height: 650, width: '100%' }} className="bg-gray-800 rounded-lg overflow-hidden">
                    <DataGrid
                        rows={selectedAnimalDetails ? [selectedAnimalDetails] : animals}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        disableSelectionOnClick
                        getRowId={( row ) => row.id}
                        localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
                        components={{
                            Toolbar: GridToolbar
                        }}
                        componentsProps={{
                            toolbar: {
                                showQuickFilter: true,
                                quickFilterProps: { debounceMs: 500 },
                            },
                        }}
                        sx={{
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.85)',
                            '& .MuiDataGrid-columnHeader, .MuiDataGrid-cell': {
                                borderRight: '1px solid rgba(81, 81, 81, 1)',
                            },
                            '& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(81, 81, 81, 1)',
                            },
                            '& .MuiDataGrid-cell': {
                                color: 'rgba(255, 255, 255, 0.85)',
                            },
                            '& .MuiPaginationItem-root': {
                                color: 'rgba(255, 255, 255, 0.85)',
                            },
                            '& .MuiTablePagination-root': {
                                color: 'rgba(255, 255, 255, 0.85)',
                            },
                            '& .MuiDataGrid-toolbarContainer': {
                                backgroundColor: 'rgba(51, 51, 51, 0.2)',
                                padding: '8px',
                                borderBottom: '1px solid rgba(81, 81, 81, 1)',
                            },
                            '& .MuiButton-root': {
                                color: 'rgba(255, 255, 255, 0.85)',
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(60, 60, 60, 0.4)'
                            }
                        }}
                    />
                </div>
            )}

            {/* Test Sonucu Giriş Modalı */}
            {testModalOpen && selectedAnimal && (
                <TestModal
                    animal={selectedAnimal}
                    onClose={() => setTestModalOpen( false )}
                    onSubmit={handleTestSubmit}
                />
            )}

            {/* Satış İşlemi Modalı */}
            {saleModalOpen && selectedAnimal && (
                <SaleModal
                    animal={selectedAnimal}
                    onClose={() => setSaleModalOpen( false )}
                    onSubmit={handleSaleSubmit}
                />
            )}

            {/* İçe Aktarma Modalı */}
            {importModalOpen && (
                <ImportModal
                    onClose={() => setImportModalOpen( false )}
                    onSuccess={handleImportSuccess}
                />
            )}

            {/* İçe Aktarma Sonuç Modalı */}
            {importResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-100">İçe Aktarma Sonucu</h3>
                        <div className="mb-4">
                            <p className="text-gray-200">
                                {importResult.success
                                    ? `${importResult.data.length} hayvan başarıyla içe aktarıldı.`
                                    : 'İçe aktarma sırasında bir hata oluştu.'}
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleCloseImportResult}
                                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detay Modalı */}
            {detailModalOpen && selectedAnimalDetails && (
                <DetailModal
                    animal={selectedAnimalDetails}
                    onClose={() => setDetailModalOpen( false )}
                />
            )}

            {/* Snackbar bileşeni */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default AnimalList;
