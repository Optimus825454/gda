import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Alert,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSale } from '../../contexts/SaleContext'; // deleteSale eklenecek
import { useAnimal } from '../../contexts/AnimalContext';
import { toast } from 'react-toastify';
import Dialog from '@mui/material/Dialog'; // Dialog için import
import DialogActions from '@mui/material/DialogActions'; // DialogActions için import
import DialogContent from '@mui/material/DialogContent'; // DialogContent için import
import DialogContentText from '@mui/material/DialogContentText'; // DialogContentText için import
import DialogTitle from '@mui/material/DialogTitle'; // DialogTitle için import

const SaleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean( id );
  const { createSale, updateSaleDetails, deleteSale, sales, fetchSales, loading: saleLoading } = useSale(); // deleteSale import edildi
  const {
    animals, // Düzenleme modunda hayvan detaylarını (örn. currentSale.animal_id ile eşleşen) bulmak için
    fetchAnimals,
    searchAnimalsByEarTagForSale,
    searchAnimalsByAnimalIdForSale,
    loading: animalLoadingContext // AnimalContext'teki genel fetchAnimals yüklenme durumu
  } = useAnimal();

  // Form state
  const [formData, setFormData] = useState( {
    buyer: '',
    sale_type: 'DAMIZLIK',
    sale_date: new Date(),
    status: 'BEKLEMEDE',
    notes: '',
  } );

  // Errors state
  const [errors, setErrors] = useState( {} );

  const [selectedAnimalForAutocomplete, setSelectedAnimalForAutocomplete] = useState( null );
  const [selectedAnimalForIdAutocomplete, setSelectedAnimalForIdAutocomplete] = useState( null );
  const [formSubmitting, setFormSubmitting] = useState( false );
  const [error, setError] = useState( null );
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState( false ); // Silme onay dialogu state'i

  const [inputValue, setInputValue] = useState( '' ); // Küpe No Autocomplete input değeri
  const [inputValueForId, setInputValueForId] = useState( '' ); // Tespit No Autocomplete input değeri
  const [selectedAnimalsForSale, setSelectedAnimalsForSale] = useState( [] );
  const [totalSalePrice, setTotalSalePrice] = useState( '' );

  const [earTagSuggestions, setEarTagSuggestions] = useState( [] );
  const [animalIdSuggestions, setAnimalIdSuggestions] = useState( [] );
  const [loadingEarTagSearch, setLoadingEarTagSearch] = useState( false );
  const [loadingAnimalIdSearch, setLoadingAnimalIdSearch] = useState( false );

  const debounceTimeoutRef = React.useRef( null );
  // Veri yükleme (fetchAnimals ve fetchSales)
  useEffect( () => {
    const loadInitialData = async () => {
      try {
        // Düzenleme modunda, hayvan listesi henüz yüklenmediyse fetchAnimals çağır.
        // Bu, currentSale için hayvan detaylarını bulabilmek için gereklidir.
        if ( isEditMode && ( !animals || animals.length === 0 ) ) {
          await fetchAnimals();
        }
        // Sadece düzenleme modunda satışları (sales) çekiyoruz.
        if ( isEditMode ) {
          await fetchSales();
        }
      } catch ( err ) {
        console.error( 'Veri yüklenirken hata:', err );
        setError( 'Veriler yüklenirken bir hata oluştu.' );
        toast.error( 'Veriler yüklenirken bir hata oluştu.' );
      }
    };
    loadInitialData();
  }, [fetchAnimals, fetchSales, isEditMode, animals] ); // animals bağımlılığı eklendi, düzenleme modunda hayvanlar yüklendiğinde useEffect'in tekrar çalışıp currentSale'i bulması için.

  // `availableAnimals` state'i ve onu dolduran useEffect kaldırıldı.
  // Öneriler artık Autocomplete'lerin onInputChange metotları içinde dinamik olarak fetch edilecek.

  // Düzenleme modunda verileri doldur
  useEffect( () => {
    // isEditMode, sales ve animals yüklendiğinde çalışır.
    if ( isEditMode && sales && sales.length > 0 && animals && animals.length > 0 ) {
      const currentSale = sales.find( sale => String( sale.id ) === String( id ) ); // ID karşılaştırması string olarak yapılıyor.
      if ( currentSale ) {
        setFormData( {
          buyer: currentSale.buyer || '',
          sale_type: currentSale.sale_type || 'DAMIZLIK',
          sale_date: currentSale.sale_date ? new Date( currentSale.sale_date ) : new Date(),
          status: currentSale.status || 'BEKLEMEDE',
          notes: currentSale.notes || ''
        } );

        // Seçili hayvanı ayarla
        if ( currentSale.animal_id ) {
          const animalInSale = animals.find( a => a.id === currentSale.animal_id );
          if ( animalInSale ) {
            // Düzenleme modunda, satılan hayvanı listeye ekleyip fiyatını dolduralım.
            setSelectedAnimalsForSale( [{
              animal: animalInSale,
              price: currentSale.sale_price != null ? String( currentSale.sale_price ) : ''
            }] );
          } else {
            // Bu durum, satışla ilişkili hayvanın `animals` listesinde bulunamadığı anlamına gelir.
            // Bu bir veri tutarsızlığı olabilir veya hayvan silinmiş olabilir.
            console.warn( `Düzenleme: Satışta belirtilen hayvan (ID: ${currentSale.animal_id}) mevcut hayvan listesinde bulunamadı.` );
            toast.warn( `Satışla ilişkili hayvan (ID: ${currentSale.animal_id}) bulunamadı. Lütfen verileri kontrol edin.` );
            // Formu bu durumda nasıl yöneteceğimize karar vermemiz gerekebilir.
            // Örneğin, kullanıcıyı bilgilendirip formu kilitleyebilir veya hayvan seçimini sıfırlayabiliriz.
            // Şimdilik sadece konsola ve toast ile uyarıyoruz.
          }
        }
      }
    } else if ( isEditMode && sales && sales.length > 0 && ( !animals || animals.length === 0 ) ) {
      // Bu blok, sales yüklendiğinde ancak animals henüz yüklenmediğinde tetiklenebilir.
      // fetchAnimals çağrısı yukarıdaki useEffect'te yapıldığı için, animals yüklendiğinde
      // bu useEffect tekrar çalışacak ve currentSale'i doğru şekilde ayarlayacaktır.
      // console.log("Düzenleme modu: Satışlar yüklendi, hayvanlar bekleniyor...");
    }
  }, [isEditMode, id, sales, animals] ); // animals bağımlılığı önemli.

  // Form alanlarında değişiklik
  const handleChange = ( e ) => {
    const { name, value } = e.target;
    setFormData( prevData => ( {
      ...prevData,
      [name]: value
    } ) );
    // Hata varsa temizle
    if ( errors[name] ) {
      setErrors( prevErrors => ( {
        ...prevErrors,
        [name]: null
      } ) );
    }
  };

  // Tarih değişikliği
  const handleDateChange = ( newDate ) => {
    setFormData( prevData => ( {
      ...prevData,
      sale_date: newDate
    } ) );
  };

  // Hayvan seçiminde (Herhangi bir Autocomplete'den) değişiklik
  // useCallback ile sarmalandı, çünkü Autocomplete bileşenlerine prop olarak geçiliyor.
  const handleAddAnimalToList = useCallback( ( event, newValue, autocompleteType ) => {
    if ( newValue && !selectedAnimalsForSale.find( item => item.animal.id === newValue.id ) ) {
      setSelectedAnimalsForSale( prev => [...prev, { animal: newValue, price: '' }] );
      toast.success( `"${newValue.ear_tag || newValue.animal_id}" küpeli hayvan listeye eklendi.` );
    } else if ( newValue ) {
      toast.warn( `"${newValue.ear_tag || newValue.animal_id}" küpeli hayvan zaten listede.` );
    }

    // İlgili Autocomplete'i ve input değerini sıfırla
    if ( autocompleteType === 'earTag' ) {
      setSelectedAnimalForAutocomplete( null );
      setInputValue( '' );
      // setEarTagSuggestions([]); // Önerileri temizleme kaldırıldı
    } else if ( autocompleteType === 'animalId' ) {
      setSelectedAnimalForIdAutocomplete( null );
      setInputValueForId( '' );
      // setAnimalIdSuggestions([]); // Önerileri temizleme kaldırıldı
    }

    if ( errors.selectedAnimals ) {
      setErrors( prevErrors => ( { ...prevErrors, selectedAnimals: null } ) );
    }
  }, [selectedAnimalsForSale, errors.selectedAnimals] );


  // Listeden hayvan silme
  const handleRemoveAnimalFromList = ( animalIdToRemove ) => {
    setSelectedAnimalsForSale( prev => prev.filter( item => item.animal.id !== animalIdToRemove ) );
    toast.info( "Hayvan listeden çıkarıldı." );
  };

  // Listedeki hayvanın fiyatını değiştirme
  const handleAnimalPriceChange = ( animalIdToUpdate, newPrice ) => {
    // Sadece sayısal karakterlere ve ondalık ayiracina izin ver
    const cleanedPrice = newPrice.replace( /[^\d.,]/g, '' );
    // Virgülü nokta yap (parseFloat için)
    const numericPrice = parseFloat( cleanedPrice.replace( ',', '.' ) );

    setSelectedAnimalsForSale( prev =>
      prev.map( item =>
        item.animal.id === animalIdToUpdate ? {
          ...item,
          // Fiyatı formatlayarak state'e kaydet
          price: isNaN( numericPrice ) ? '' : numericPrice.toLocaleString( 'tr-TR' )
        } : item
      )
    );
    // Fiyat değiştiğinde ilgili hatayı temizle
    const animalIndex = selectedAnimalsForSale.findIndex( item => item.animal.id === animalIdToUpdate );
    if ( errors[`animal_price_${animalIndex}`] ) {
      setErrors( prevErrors => ( { ...prevErrors, [`animal_price_${animalIndex}`]: null } ) );
    }
  };

  // Satış türü "KESIM" olduğunda alıcıyı otomatik olarak "ASYAET" yap
  useEffect( () => {
    if ( formData.sale_type === 'KESIM' ) {
      setFormData( prevData => ( {
        ...prevData,
        buyer: 'ASYAET'
      } ) );
    }
  }, [formData.sale_type] ); // sale_type değiştiğinde bu effect çalışır

  // Form doğrulama
  const validateForm = () => {
    const newErrors = {};
    if ( !formData.buyer.trim() ) newErrors.buyer = 'Alıcı bilgisi zorunludur.';
    if ( !formData.sale_date ) {
      newErrors.sale_date = 'Satış tarihi zorunludur.';
    } else if ( new Date( formData.sale_date ).setHours( 0, 0, 0, 0 ) > new Date().setHours( 0, 0, 0, 0 ) ) {
      newErrors.sale_date = 'Satış tarihi bugünden sonraki bir tarih olamaz.';
    }

    if ( selectedAnimalsForSale.length === 0 ) {
      const message = 'En az bir hayvan seçilmelidir.';
      newErrors.selectedAnimals = message;
      if ( !toast.isActive( 'animal_selection_error' ) ) {
        toast.error( message, { toastId: 'animal_selection_error' } );
      }
    } else {
      selectedAnimalsForSale.forEach( ( item, index ) => {
        // Fiyatı doğrulamadan önce formatlı string'den sayıya çevir
        const priceValue = parseFloat( String( item.price ).replace( '.', '' ).replace( ',', '.' ) );
        if ( isNaN( priceValue ) || priceValue <= 0 ) {
          newErrors[`animal_price_${index}`] = `Fiyat girilmedi veya geçersiz.`;
          // toast.error(`Hayvan #${item.animal.ear_tag || index + 1} için geçerli bir fiyat girin.`);
        }
      } );
    }
    // Satış türü için ek bir kontrol eklenebilir, ancak şu an için varsayılan bir değeri var.
    // if (!formData.sale_type) newErrors.sale_type = 'Satış türü zorunludur.';

    setErrors( newErrors );
    return Object.keys( newErrors ).length === 0;
  };

  // Formu gönder
  const handleSubmit = async ( e ) => {
    e.preventDefault();
    if ( !validateForm() ) {
      toast.error( "Lütfen formdaki hataları düzeltin." );
      return;
    }

    setFormSubmitting( true );
    setError( null );

    try {
      if ( isEditMode ) {
        if ( selectedAnimalsForSale.length === 1 ) {
          const saleToUpdate = selectedAnimalsForSale[0];
          const dataToUpdate = {
            buyer: formData.buyer,
            sale_type: formData.sale_type,
            sale_date: formData.sale_date,
            status: formData.status,
            notes: formData.notes,
            animal_id: saleToUpdate.animal.id,
            sale_price: parseFloat( saleToUpdate.price ),
          };
          await updateSaleDetails( id, dataToUpdate );
          toast.success( 'Satış bilgileri başarıyla güncellendi.' );
          navigate( '/sales' );
        } else {
          // Bu durum validateForm'da yakalanmalı, ancak ek bir güvenlik.
          toast.error( "Düzenleme modunda yalnızca tek bir hayvan satışı güncellenebilir." );
          setFormSubmitting( false );
          return;
        }
      } else {
        // Yeni Satış Oluşturma Modu
        const salePromises = selectedAnimalsForSale.map( item => {
          const singleSaleData = {
            buyer: formData.buyer,
            sale_type: formData.sale_type,
            sale_date: formData.sale_date,
            notes: formData.notes,
            animal_id: item.animal.id,
            sale_price: parseFloat( item.price ),
            status: 'TAMAMLANDI', // Yeni satışlar varsayılan olarak tamamlandı
          };
          return createSale( singleSaleData );
        } );

        await Promise.all( salePromises );
        toast.success( `${selectedAnimalsForSale.length} hayvan için satış kaydı başarıyla oluşturuldu.` );
        navigate( '/sales' );
      }
    } catch ( err ) {
      console.error( 'Form gönderilirken hata:', err );
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'İşlem sırasında bir hata oluştu.';
      setError( errorMessage );
      toast.error( errorMessage );
    } finally {
      setFormSubmitting( false );
    }
  };

  const handleDistributeTotalPrice = () => {
    if ( selectedAnimalsForSale.length > 0 && totalSalePrice && parseFloat( totalSalePrice ) > 0 ) {
      const pricePerAnimal = parseFloat( totalSalePrice ) / selectedAnimalsForSale.length;
      setSelectedAnimalsForSale( prev =>
        prev.map( item => ( { ...item, price: pricePerAnimal.toFixed( 2 ) } ) )
      );
      toast.success( 'Toplam fiyat hayvanlara eşit olarak dağıtıldı.' );
    } else if ( selectedAnimalsForSale.length === 0 ) {
      toast.error( "Lütfen önce satılacak hayvanları seçin." );
    } else {
      toast.error( "Lütfen geçerli bir toplu satış fiyatı girin." );
    }
  };

  // Silme onay dialogunu aç
  const handleDeleteClick = () => {
    setOpenDeleteConfirm( true );
  };

  // Silme onay dialogunu kapat
  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm( false );
  };

  // Satış silme işlemi
  const handleConfirmDelete = async () => {
    setOpenDeleteConfirm( false );
    setFormSubmitting( true ); // Silme işlemi de bir form submit gibi düşünülebilir
    setError( null );

    try {
      await deleteSale( id ); // Context'ten gelen deleteSale fonksiyonunu çağır
      toast.success( 'Satış kaydı başarıyla silindi.' );
      navigate( '/sales' ); // Satış listesi sayfasına yönlendir
    } catch ( err ) {
      console.error( 'Satış silinirken hata:', err );
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Silme işlemi sırasında bir hata oluştu.';
      setError( errorMessage );
      toast.error( errorMessage );
    } finally {
      setFormSubmitting( false );
    }
  };


  // Form iptal
  const handleCancel = () => {
    navigate( '/sales' );
  };

  // Yükleniyor durum kontrolü
  const isFormProcessing = saleLoading || formSubmitting; // Kaydetme/güncelleme işlemleri için
  const isInitialDataLoading = isEditMode && animalLoadingContext; // Düzenleme modunda başlangıç verilerinin yüklenmesi
  const isOverallDisabled = isFormProcessing || isInitialDataLoading || isEditMode; // Autocomplete ve diğer alanlar için genel disable durumu

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {isEditMode ? 'Satış Düzenle' : 'Yeni Satış Kaydı'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Küpe No ile Hayvan Seçimi */}
              {!isEditMode && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    id="animal-eartag-select"
                    options={earTagSuggestions.filter(
                      ( suggestion ) => !selectedAnimalsForSale.some( ( sa ) => sa.animal.id === suggestion.id )
                    )}
                    getOptionLabel={( option ) => `${option.ear_tag || 'Küpe No Yok'} (ID: ${option.animal_id || 'N/A'})`}
                    value={selectedAnimalForAutocomplete}
                    inputValue={inputValue}
                    onInputChange={( event, newInputValue, reason ) => {
                      setInputValue( newInputValue );
                      if ( reason === 'input' ) {
                        if ( debounceTimeoutRef.current ) {
                          clearTimeout( debounceTimeoutRef.current );
                        }
                        if ( newInputValue.length >= 2 ) {
                          debounceTimeoutRef.current = setTimeout( async () => {
                            setLoadingEarTagSearch( true );
                            try {
                              const fetchedSuggestions = await searchAnimalsByEarTagForSale( newInputValue );
                              setEarTagSuggestions( fetchedSuggestions || [] );
                            } catch ( apiError ) {
                              console.error( "Ear tag search API error:", apiError );
                              toast.error( "Küpe no ile hayvan aranırken bir hata oluştu." );
                              setEarTagSuggestions( [] );
                            } finally {
                              setLoadingEarTagSearch( false );
                            }
                          }, 500 );
                        } else {
                          // Input 2 karakterden kısaysa veya boşsa önerileri ve timeout'u temizle
                          if ( debounceTimeoutRef.current ) clearTimeout( debounceTimeoutRef.current );
                          setEarTagSuggestions( [] );
                        }
                      } else if ( reason === 'clear' ) {
                        if ( debounceTimeoutRef.current ) clearTimeout( debounceTimeoutRef.current );
                        setEarTagSuggestions( [] );
                        // setSelectedAnimalForAutocomplete(null); // onChange halleder
                      } else if ( reason === 'reset' && !selectedAnimalForAutocomplete ) {
                        // Eğer bir seçim yapıldıysa (onChange tetiklendi), inputValue zaten sıfırlanır.
                        // Bu, kullanıcı seçimi geri aldığında veya manuel olarak sildiğinde input'u temizler.
                        if ( debounceTimeoutRef.current ) clearTimeout( debounceTimeoutRef.current );
                        // setEarTagSuggestions([]); // Önerileri temizleme kaldırıldı
                        setInputValue( '' );
                      }
                    }}
                    onChange={( event, newValue ) => {
                      handleAddAnimalToList( event, newValue, 'earTag' );
                      // Seçim yapıldıktan sonra öneri listesini temizlemek iyi bir UX olabilir.
                      // setEarTagSuggestions([]); // handleAddAnimalToList zaten input'u ve value'yu sıfırlıyor.
                    }}
                    loading={loadingEarTagSearch}
                    disabled={isOverallDisabled}
                    // filterOptions prop'u kaldırıldı.
                    renderInput={( params ) => (
                      <TextField
                        {...params}
                        label="Küpe No ile Hayvan Seçin (Min 2 krk)"
                        variant="outlined"
                        error={!!errors.selectedAnimals && !isEditMode && selectedAnimalsForSale.length === 0}
                        helperText={!isEditMode ? ( errors.selectedAnimals || "Satmak için küpe no girin" ) : ""}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingEarTagSearch ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Tespit No (Hayvan ID) ile Hayvan Seçimi */}
              {!isEditMode && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    id="animal-id-select"
                    options={animalIdSuggestions.filter(
                      ( suggestion ) => !selectedAnimalsForSale.some( ( sa ) => sa.animal.id === suggestion.id )
                    )}
                    getOptionLabel={( option ) => `${String( option.tespitno || 'Tespit No Yok' )} (Küpe: ${option.ear_tag || 'N/A'})`}
                    value={selectedAnimalForIdAutocomplete}
                    inputValue={inputValueForId}
                    onInputChange={( event, newInputValue, reason ) => {
                      setInputValueForId( newInputValue );
                      if ( reason === 'input' ) {
                        if ( debounceTimeoutRef.current ) {
                          clearTimeout( debounceTimeoutRef.current );
                        }
                        if ( newInputValue.length >= 2 ) {
                          debounceTimeoutRef.current = setTimeout( async () => {
                            setLoadingAnimalIdSearch( true );
                            try {
                              const fetchedSuggestions = await searchAnimalsByAnimalIdForSale( newInputValue );
                              setAnimalIdSuggestions( fetchedSuggestions || [] );
                            } catch ( apiError ) {
                              console.error( "Animal ID search API error:", apiError );
                              toast.error( "Tespit no ile hayvan aranırken bir hata oluştu." );
                              setAnimalIdSuggestions( [] );
                            } finally {
                              setLoadingAnimalIdSearch( false );
                            }
                          }, 500 );
                        } else {
                          if ( debounceTimeoutRef.current ) clearTimeout( debounceTimeoutRef.current );
                          setAnimalIdSuggestions( [] );
                        }
                      } else if ( reason === 'clear' ) {
                        if ( debounceTimeoutRef.current ) clearTimeout( debounceTimeoutRef.current );
                        setAnimalIdSuggestions( [] );
                        // setSelectedAnimalForIdAutocomplete(null); // onChange halleder
                      } else if ( reason === 'reset' && !selectedAnimalForIdAutocomplete ) {
                        if ( debounceTimeoutRef.current ) clearTimeout( debounceTimeoutRef.current );
                        // setAnimalIdSuggestions([]); // Önerileri temizleme kaldırıldı
                        setInputValueForId( '' );
                      }
                    }}
                    onChange={( event, newValue ) => {
                      handleAddAnimalToList( event, newValue, 'animalId' );
                      // setAnimalIdSuggestions([]);
                    }}
                    loading={loadingAnimalIdSearch}
                    disabled={isOverallDisabled}
                    // filterOptions prop'u kaldırıldı.
                    renderInput={( params ) => (
                      <TextField
                        {...params}
                        label="Tespit No ile Hayvan Seçin (Min 2 krk)"
                        variant="outlined"
                        // error yönetimi burada da eklenebilir, ancak genel selectedAnimals hatası yeterli olabilir.
                        helperText={!isEditMode ? "Satmak için tespit no girin" : ""}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingAnimalIdSearch ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Toplu Fiyat Girişi */}
              {/* Eğer düzenleme modundaysa ve hayvan seçimi alanları gizliyse, toplu fiyat tam genişlikte olsun */}
              <Grid item xs={12} md={isEditMode ? 12 : ( selectedAnimalsForSale.length > 0 ? 12 : 6 )}>
                <TextField
                  fullWidth
                  label="Toplu Satış Fiyatı (₺)"
                  variant="outlined"
                  type="number"
                  value={totalSalePrice}
                  onChange={( e ) => setTotalSalePrice( e.target.value )}
                  disabled={isOverallDisabled || selectedAnimalsForSale.length === 0 || isEditMode}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleDistributeTotalPrice}
                  disabled={isOverallDisabled || selectedAnimalsForSale.length === 0 || !totalSalePrice || parseFloat( totalSalePrice ) <= 0 || isEditMode}
                  sx={{ mt: 1 }}
                >
                  Fiyatı Dağıt
                </Button>
              </Grid>

              {/* Seçilen Hayvanlar Listesi */}
              {selectedAnimalsForSale.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Satılacak Hayvanlar Listesi
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small" aria-label="seçilen hayvanlar tablosu">
                      <TableHead>
                        <TableRow>
                          <TableCell>Küpe No</TableCell>
                          <TableCell>Tespit No</TableCell> {/* Updated header */}
                          <TableCell>Kategori</TableCell> {/* Updated header */}
                          <TableCell>Gebelik Durumu</TableCell> {/* Added header */}
                          <TableCell align="right">Fiyat (₺)</TableCell>
                          <TableCell align="center">Sil</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAnimalsForSale.map( ( item, index ) => (
                          <TableRow key={item.animal.id}>
                            <TableCell component="th" scope="row">
                              {item.animal.ear_tag || '-'}
                            </TableCell>
                            <TableCell>{item.animal.tespitno || '-'}</TableCell> {/* Use item.animal.tespitno */}
                            <TableCell>{item.animal.kategori || '-'}</TableCell> {/* Use item.animal.kategori */}
                            <TableCell>{item.animal.gebelikdurum || '-'}</TableCell> {/* Use item.animal.gebelikdurum */}
                            <TableCell align="right">
                              <TextField
                                type="text" // Changed to text to handle formatted string
                                variant="outlined"
                                size="small"
                                value={item.price}
                                onChange={( e ) => handleAnimalPriceChange( item.animal.id, e.target.value )}
                                error={!!errors[`animal_price_${index}`]}
                                helperText={errors[`animal_price_${index}`]}
                                sx={{ maxWidth: 120 }}
                                disabled={isFormProcessing || isInitialDataLoading} // Sadece ana yükleme/işlem durumlarında disable
                                InputProps={{
                                  inputProps: { min: 0 }
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => handleRemoveAnimalFromList( item.animal.id )}
                                color="error"
                                disabled={isOverallDisabled || ( isEditMode && selectedAnimalsForSale.length <= 1 )} // Düzenleme modunda son hayvan silinemez
                                // isOverallDisabled zaten isEditMode içeriyor.
                                // Bu ek kontrol, düzenleme modunda listeyi boş bırakmamak için.
                                aria-label={`hayvan ${item.animal.ear_tag} sil`}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ) )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {/* Alıcı Bilgisi */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="buyer"
                  name="buyer"
                  label="Alıcı"
                  variant="outlined"
                  value={formData.buyer}
                  onChange={handleChange}
                  error={!!errors.buyer}
                  helperText={errors.buyer}
                  disabled={isOverallDisabled}
                />
              </Grid>

              {/* Satış Türü */}
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <Typography variant="subtitle2" gutterBottom>
                    Satış Türü
                  </Typography>
                  <RadioGroup
                    row
                    name="sale_type"
                    value={formData.sale_type}
                    onChange={handleChange}
                  >
                    <FormControlLabel
                      value="DAMIZLIK"
                      control={<Radio disabled={isOverallDisabled} />}
                      label="Damızlık"
                    />
                    <FormControlLabel
                      value="KESIM"
                      control={<Radio disabled={isOverallDisabled} />}
                      label="Kesim"
                    />
                  </RadioGroup>
                  {errors.sale_type && (
                    <FormHelperText error>{errors.sale_type}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Satış Tarihi */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Satış Tarihi"
                  value={formData.sale_date}
                  onChange={handleDateChange}
                  renderInput={( params ) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      error={!!errors.sale_date}
                      helperText={errors.sale_date}
                    />
                  )}
                  disabled={isOverallDisabled}
                />
              </Grid>

              {/* Durum (Sadece düzenleme modunda) */}
              {isEditMode && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="status-label">Durum</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Durum"
                      disabled={isOverallDisabled}
                    >
                      <MenuItem value="BEKLEMEDE">Beklemede</MenuItem>
                      <MenuItem value="TAMAMLANDI">Tamamlandı</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Notlar */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Notlar"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={formData.notes}
                  onChange={handleChange}
                  error={!!errors.notes}
                  helperText={errors.notes}
                  disabled={isOverallDisabled}
                />
              </Grid>

              {/* Seçili Hayvanın Detayları (Eğer varsa) bölümü kaldırıldı. Bilgiler artık yukarıdaki tabloda. */}
              {/* {selectedAnimal && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Seçili Hayvan Bilgileri
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Hayvan ID
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.animal_id || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Küpe No
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.ear_tag || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Cinsiyet
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.gender === 'ERKEK' ? 'Erkek' : 'Dişi'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="textSecondary">
                            Kategori
                          </Typography>
                          <Typography variant="body1">
                            {selectedAnimal.category || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )} */}

              {/* Form Butonları */}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  {isEditMode && ( // Sil butonu sadece düzenleme modunda görünür
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteClick} // Silme onay dialogunu aç
                      disabled={isOverallDisabled}
                      startIcon={<DeleteIcon />}
                    >
                      Sil
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    disabled={isOverallDisabled}
                    startIcon={<CancelIcon />}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isOverallDisabled}
                    startIcon={isOverallDisabled ? <CircularProgress size={24} /> : <SaveIcon />}
                  >
                    {isOverallDisabled ? 'Kaydediliyor...' : ( isEditMode ? 'Güncelle' : 'Kaydet' )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Silme Onay Dialogu */}
        <Dialog
          open={openDeleteConfirm}
          onClose={handleCloseDeleteConfirm}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">{"Satış Kaydını Sil"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Bu satış kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteConfirm} color="secondary" disabled={formSubmitting}>
              İptal
            </Button>
            <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={formSubmitting}>
              Sil
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
};

export default SaleForm;
