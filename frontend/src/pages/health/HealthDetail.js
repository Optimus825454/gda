import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    ArrowLeft,
    CalendarDays,
    User,
    FileText,
    Heart,
    Clipboard,
    Cat,
    Pencil,
    Trash2
} from 'lucide-react';

const HealthDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [healthRecord, setHealthRecord] = useState( null );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );

    useEffect( () => {
        const fetchHealthRecord = async () => {
            setLoading( true );
            try {
                // Gerçek API çağrısı burada yapılacak
                // Şimdilik örnek veri kullanıyoruz
                const mockData = {
                    id: '1',
                    animal_id: 'A001',
                    animal_name: 'Sarıkız',
                    animal_type: 'İnek',
                    animal_breed: 'Holstein',
                    animal_age: 3,
                    animal_gender: 'Dişi',
                    date: '2025-04-15',
                    type: 'Aşılama',
                    description: 'Şap aşısı yapıldı',
                    details: 'Yıllık rutin şap aşısı uygulandı. Hayvan tepki göstermedi.',
                    veterinarian: 'Dr. Ahmet Yılmaz',
                    location: 'Ahır',
                    medications: [
                        { name: 'Şap Aşısı', dosage: '5ml', frequency: 'Tek doz' }
                    ],
                    cost: 750,
                    notes: 'Sorunsuz tamamlandı',
                    follow_up_date: '2026-04-15',
                    created_at: '2025-04-15T10:30:00',
                    updated_at: '2025-04-15T10:30:00'
                };

                // Kısa bir gecikme ekleyerek yükleme durumunu simüle et
                setTimeout( () => {
                    setHealthRecord( mockData );
                    setLoading( false );
                }, 800 );

            } catch ( err ) {
                console.error( 'Sağlık kaydını getirirken hata:', err );
                setError( 'Sağlık kaydı yüklenirken bir hata oluştu.' );
                setLoading( false );
            }
        };

        fetchHealthRecord();
    }, [id] );

    const handleDelete = async () => {
        if ( window.confirm( 'Bu kaydı silmek istediğinize emin misiniz?' ) ) {
            try {
                // API çağrısı burada yapılacak
                // await deleteHealthRecord(id);
                navigate( '/health' );
                alert( 'Kayıt başarıyla silindi' );
            } catch ( err ) {
                console.error( 'Kayıt silinirken hata:', err );
                alert( 'Kayıt silinirken bir hata oluştu' );
            }
        }
    };

    if ( loading ) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                        Yükleniyor...
                    </span>
                </div>
            </div>
        );
    }

    if ( error ) {
        return (
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-lg text-center mt-8">
                    <p className="text-lg font-medium">{error}</p>
                    <button
                        onClick={() => navigate( '/health' )}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <ArrowLeft className="h-4 w-4" /> Listeye Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 max-w-6xl animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <button
                        onClick={() => navigate( '/health' )}
                        className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" /> Listeye Dön
                    </button>
                    <h1 className="text-2xl font-semibold tracking-tight">Sağlık Kaydı Detayı</h1>
                    <p className="text-sm text-muted-foreground mt-1">ID: {id}</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to={`/health/edit/${id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Pencil className="h-4 w-4" /> Düzenle
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                    >
                        <Trash2 className="h-4 w-4" /> Sil
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Hayvan Bilgileri */}
                <div className="md:col-span-4">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Cat className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">Hayvan Bilgileri</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-border pb-2">
                                    <span className="text-muted-foreground text-sm">Hayvan ID:</span>
                                    <span className="font-medium">{healthRecord.animal_id}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-2">
                                    <span className="text-muted-foreground text-sm">Adı:</span>
                                    <span className="font-medium">{healthRecord.animal_name}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-2">
                                    <span className="text-muted-foreground text-sm">Tür:</span>
                                    <span className="font-medium">{healthRecord.animal_type}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-2">
                                    <span className="text-muted-foreground text-sm">Irk:</span>
                                    <span className="font-medium">{healthRecord.animal_breed}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-border pb-2">
                                    <span className="text-muted-foreground text-sm">Yaş:</span>
                                    <span className="font-medium">{healthRecord.animal_age} yaş</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm">Cinsiyet:</span>
                                    <span className="font-medium">{healthRecord.animal_gender}</span>
                                </div>
                            </div>

                            <Link
                                to={`/animals/${healthRecord.animal_id}`}
                                className="mt-6 inline-flex justify-center w-full items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                            >
                                Hayvan Profilini Görüntüle
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-8 space-y-6">
                    {/* İşlem Detayları */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">İşlem Detayları</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="rounded-md bg-muted p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">Tarih</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format( new Date( healthRecord.date ), 'dd MMMM yyyy', { locale: tr } )}
                                    </p>
                                </div>

                                <div className="rounded-md bg-muted p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Heart className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">İşlem Türü</span>
                                    </div>
                                    <p className="text-sm font-medium">{healthRecord.type}</p>
                                </div>
                            </div>

                            <div className="rounded-md bg-muted p-3 mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-medium text-muted-foreground">Açıklama</span>
                                </div>
                                <p className="text-sm">{healthRecord.description}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-md bg-muted p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">Veteriner</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {healthRecord.veterinarian || 'Belirtilmemiş'}
                                    </p>
                                </div>

                                <div className="rounded-md bg-muted p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium text-muted-foreground">Kontrol Tarihi</span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {healthRecord.follow_up_date ?
                                            format( new Date( healthRecord.follow_up_date ), 'dd MMMM yyyy', { locale: tr } ) :
                                            'Belirlenmemiş'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* İlaçlar ve Detaylar */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">İlaçlar ve Tedavi Detayları</h2>
                            <div className="border-b border-border mb-4"></div>

                            {healthRecord.medications && healthRecord.medications.length > 0 ? (
                                <ul className="space-y-2 mb-4">
                                    {healthRecord.medications.map( ( med, index ) => (
                                        <li key={index} className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50">
                                            <Heart className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">{med.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Doz: {med.dosage}, Kullanım: {med.frequency}
                                                </p>
                                            </div>
                                        </li>
                                    ) )}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground mb-4">
                                    İlaç kaydı bulunmamaktadır.
                                </p>
                            )}

                            <div className="border-b border-border mb-4"></div>

                            <h3 className="font-medium mb-2">Detaylı Bilgi</h3>
                            <p className="text-sm mb-6 whitespace-pre-wrap">
                                {healthRecord.details || 'Detaylı bilgi girilmemiş.'}
                            </p>

                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-muted-foreground">Maliyet:</p>
                                    <p className="font-semibold">
                                        {healthRecord.cost ? `${healthRecord.cost.toLocaleString( 'tr-TR' )} ₺` : 'Belirtilmemiş'}
                                    </p>
                                </div>

                                <div className="text-right text-xs text-muted-foreground">
                                    <p>Oluşturma: {format( new Date( healthRecord.created_at ), 'dd.MM.yyyy HH:mm' )}</p>
                                    {healthRecord.updated_at !== healthRecord.created_at && (
                                        <p>Güncelleme: {format( new Date( healthRecord.updated_at ), 'dd.MM.yyyy HH:mm' )}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notlar */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clipboard className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold">Notlar</h2>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                                {healthRecord.notes || 'Not girilmemiş.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthDetail;