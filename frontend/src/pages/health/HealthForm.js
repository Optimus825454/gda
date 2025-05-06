import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHealth } from '../../contexts/HealthContext';
// Varsayılan UI bileşenleri olmadığı için temel HTML elemanları kullanılacak
// Gerçek uygulamada Material UI, Chakra UI, Shadcn/ui gibi kütüphanelerden bileşenler kullanılabilir

const HealthForm = () => {
    const { recordId } = useParams(); // Düzenleme için URL'den ID al
    const navigate = useNavigate();
    const { createHealthRecord, updateHealthRecord, getHealthRecordById, loading, error } = useHealth();

    const [formData, setFormData] = useState( {
        animal_id: '', // Bu alanın nasıl doldurulacağı önemli (örn. önceki sayfadan veya seçici ile)
        record_type: '', // Örn: 'Aşılama', 'Tedavi', 'Muayene'
        record_date: new Date().toISOString().split( 'T' )[0], // Bugünün tarihi
        description: '',
        treatment: '', // Uygulanan tedavi
        vet_name: '', // Veteriner adı
        notes: '', // Ek notlar
    } );
    const [formError, setFormError] = useState( '' );

    const isEditing = Boolean( recordId );

    useEffect( () => {
        if ( isEditing ) {
            const fetchRecord = async () => {
                const record = await getHealthRecordById( recordId );
                if ( record ) {
                    // Tarih formatını YYYY-MM-DD'ye çevir
                    const formattedDate = record.record_date
                        ? new Date( record.record_date ).toISOString().split( 'T' )[0]
                        : '';
                    setFormData( {
                        animal_id: record.animal_id || '',
                        record_type: record.record_type || '',
                        record_date: formattedDate,
                        description: record.description || '',
                        treatment: record.treatment || '',
                        vet_name: record.vet_name || '',
                        notes: record.notes || '',
                    } );
                } else {
                    setFormError( 'Sağlık kaydı bulunamadı.' );
                }
            };
            fetchRecord();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, recordId, getHealthRecordById] ); // getHealthRecordById bağımlılıklara eklendi

    const handleChange = ( e ) => {
        const { name, value } = e.target;
        setFormData( prev => ( { ...prev, [name]: value } ) );
    };

    const validateForm = () => {
        if ( !formData.animal_id || !formData.record_type || !formData.record_date || !formData.description ) {
            setFormError( 'Hayvan ID, Kayıt Tipi, Tarih ve Açıklama alanları zorunludur.' );
            return false;
        }
        setFormError( '' );
        return true;
    };

    const handleSubmit = async ( e ) => {
        e.preventDefault();
        if ( !validateForm() ) return;

        let success = false;
        if ( isEditing ) {
            success = await updateHealthRecord( recordId, formData );
        } else {
            success = await createHealthRecord( formData );
        }

        if ( success ) {
            navigate( '/health' ); // Başarılı olursa listeleme sayfasına yönlendir
        }
        // Context'teki error state'i zaten hata mesajını gösterecektir
    };

    // Basit Stil Tanımları (Normalde CSS dosyası veya UI kütüphanesi kullanılır)
    const styles = {
        container: { padding: '20px', maxWidth: '600px', margin: 'auto' },
        formGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
        input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' },
        textarea: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' },
        button: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
        cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
        error: { color: 'red', marginBottom: '15px' },
        loading: { fontStyle: 'italic' }
    };

    return (
        <div style={styles.container}>
            <h2>{isEditing ? 'Sağlık Kaydını Düzenle' : 'Yeni Sağlık Kaydı Ekle'}</h2>
            <form onSubmit={handleSubmit}>
                {/* Hayvan ID alanı - Bu alanın nasıl doldurulacağı projeye göre değişir */}
                {/* Belki bir dropdown veya önceki sayfadan gelen bir değer olabilir */}
                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="animal_id">Hayvan ID:</label>
                    <input
                        style={styles.input}
                        type="text"
                        id="animal_id"
                        name="animal_id"
                        value={formData.animal_id}
                        onChange={handleChange}
                        required
                        // Düzenleme modunda değiştirilemez yapabilirsiniz
                        readOnly={isEditing}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="record_type">Kayıt Tipi:</label>
                    <input
                        style={styles.input}
                        type="text"
                        id="record_type"
                        name="record_type"
                        value={formData.record_type}
                        onChange={handleChange}
                        placeholder="Örn: Aşılama, Tedavi, Muayene"
                        required
                    />
                    {/* Alternatif olarak select dropdown kullanılabilir */}
                    {/* <select name="record_type" value={formData.record_type} onChange={handleChange} required>
                        <option value="">Seçiniz...</option>
                        <option value="Aşılama">Aşılama</option>
                        <option value="Tedavi">Tedavi</option>
                        <option value="Muayene">Muayene</option>
                        <option value="Doğum">Doğum</option>
                    </select> */}
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="record_date">Kayıt Tarihi:</label>
                    <input
                        style={styles.input}
                        type="date"
                        id="record_date"
                        name="record_date"
                        value={formData.record_date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="description">Açıklama:</label>
                    <textarea
                        style={styles.textarea}
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="treatment">Uygulanan Tedavi:</label>
                    <textarea
                        style={styles.textarea}
                        id="treatment"
                        name="treatment"
                        value={formData.treatment}
                        onChange={handleChange}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="vet_name">Veteriner Adı:</label>
                    <input
                        style={styles.input}
                        type="text"
                        id="vet_name"
                        name="vet_name"
                        value={formData.vet_name}
                        onChange={handleChange}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label} htmlFor="notes">Ek Notlar:</label>
                    <textarea
                        style={styles.textarea}
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>

                {formError && <p style={styles.error}>{formError}</p>}
                {error && <p style={styles.error}>{error}</p>} {/* Context'ten gelen API hatası */}

                <div>
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Kaydediliyor...' : ( isEditing ? 'Güncelle' : 'Kaydet' )}
                    </button>
                    <button type="button" style={styles.cancelButton} onClick={() => navigate( '/health' )} disabled={loading}>
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HealthForm;
