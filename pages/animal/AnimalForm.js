import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimal, createAnimal, updateAnimal } from '../../utils/animalService';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';

const AnimalForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [animal, setAnimal] = useState({
        id: null,
        animal_id: null,
        kupeno: '',
        isim: '',
        dogtar: '',
        cinsiyet: '',
        irk: '',
        amac: '',
        durum: '',
        fiyat: null,
        notlar: '',
        resim_url: '',
        kategori: '',
        anano: '',
        babano: '',
        gebelikdurum: '',
        tespitno: '',
        tohtar: '',
        sagmal: 0,
        created_at: '',
        updated_at: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            setLoading(true);
            getAnimal(id)
                .then(data => {
                    setAnimal(data.data);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Hayvan bilgileri yüklenirken bir hata oluştu.');
                    setLoading(false);
                });
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setAnimal(prevAnimal => ({
            ...prevAnimal,
            [name]: newValue
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const operation = id ? updateAnimal(id, animal) : createAnimal(animal);

        operation
            .then(() => {
                setLoading(false);
                navigate('/animals');
            })
            .catch(err => {
                setError(`Hayvan ${id ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`);
                setLoading(false);
            });
    };

    if (loading && id) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const cinsiyetOptions = ['Erkek', 'Dişi'];
    const kategoriOptions = ['İnek', 'Düve', 'Buzağı', 'Dana', 'Tosun'];
    const durumOptions = ['Aktif', 'Satıldı', 'Kesildi', 'Öldü', 'Gebe', 'Kuru'];
    const amacOptions = ['Süt', 'Et', 'Damızlık'];
    const gebelikDurumOptions = ['Gebe', 'Gebe Değil', 'Belirsiz'];

    return (
        <div className="container mx-auto p-4 space-y-6 max-w-4xl bg-[#0B1437] min-h-screen">
            <Card className="bg-[#111C44] border-none shadow-lg">
                <CardHeader className="border-b border-gray-700">
                    <CardTitle className="text-2xl font-bold text-white text-center">
                        {id ? 'Hayvanı Düzenle' : 'Yeni Hayvan Ekle'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        {/* Temel Bilgiler */}
                        <div className="bg-[#1B254B] rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-white">Temel Bilgiler</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="kupeno" className="text-gray-300">Küpe No</Label>
                                    <Input
                                        type="text"
                                        id="kupeno"
                                        name="kupeno"
                                        value={animal.kupeno || ''}
                                        onChange={handleChange}
                                        required
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="isim" className="text-gray-300">İsim</Label>
                                    <Input
                                        type="text"
                                        id="isim"
                                        name="isim"
                                        value={animal.isim || ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dogtar" className="text-gray-300">Doğum Tarihi</Label>
                                    <Input
                                        type="date"
                                        id="dogtar"
                                        name="dogtar"
                                        value={animal.dogtar ? animal.dogtar.split('T')[0] : ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cinsiyet" className="text-gray-300">Cinsiyet</Label>
                                    <select
                                        id="cinsiyet"
                                        name="cinsiyet"
                                        value={animal.cinsiyet || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-md border border-gray-700 bg-[#111C44] text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Seçiniz</option>
                                        {cinsiyetOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="irk" className="text-gray-300">Irk</Label>
                                    <Input
                                        type="text"
                                        id="irk"
                                        name="irk"
                                        value={animal.irk || ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kategori" className="text-gray-300">Kategori</Label>
                                    <select
                                        id="kategori"
                                        name="kategori"
                                        value={animal.kategori || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-700 bg-[#111C44] text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Seçiniz</option>
                                        {kategoriOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Durum ve Amaç Bilgileri */}
                        <div className="bg-[#1B254B] rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-white">Durum ve Amaç Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="durum" className="text-gray-300">Durum</Label>
                                    <select
                                        id="durum"
                                        name="durum"
                                        value={animal.durum || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-700 bg-[#111C44] text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Seçiniz</option>
                                        {durumOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amac" className="text-gray-300">Amaç</Label>
                                    <select
                                        id="amac"
                                        name="amac"
                                        value={animal.amac || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-700 bg-[#111C44] text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Seçiniz</option>
                                        {amacOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gebelikdurum" className="text-gray-300">Gebelik Durumu</Label>
                                    <select
                                        id="gebelikdurum"
                                        name="gebelikdurum"
                                        value={animal.gebelikdurum || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-gray-700 bg-[#111C44] text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Seçiniz</option>
                                        {gebelikDurumOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tespitno" className="text-gray-300">Tespit No</Label>
                                    <Input
                                        type="text"
                                        id="tespitno"
                                        name="tespitno"
                                        value={animal.tespitno || ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tohtar" className="text-gray-300">Tohumlama Tarihi</Label>
                                    <Input
                                        type="date"
                                        id="tohtar"
                                        name="tohtar"
                                        value={animal.tohtar ? animal.tohtar.split('T')[0] : ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sagmal" className="text-gray-300">Sağmal</Label>
                                    <Input
                                        type="number"
                                        id="sagmal"
                                        name="sagmal"
                                        value={animal.sagmal || 0}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ebeveyn Bilgileri */}
                        <div className="bg-[#1B254B] rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-white">Ebeveyn Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="anano" className="text-gray-300">Ana No</Label>
                                    <Input
                                        type="text"
                                        id="anano"
                                        name="anano"
                                        value={animal.anano || ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="babano" className="text-gray-300">Baba No</Label>
                                    <Input
                                        type="text"
                                        id="babano"
                                        name="babano"
                                        value={animal.babano || ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Diğer Bilgiler */}
                        <div className="bg-[#1B254B] rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-white">Diğer Bilgiler</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fiyat" className="text-gray-300">Fiyat</Label>
                                    <Input
                                        type="number"
                                        id="fiyat"
                                        name="fiyat"
                                        value={animal.fiyat || ''}
                                        onChange={handleChange}
                                        className="bg-[#111C44] border-gray-700 text-white text-center focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notlar" className="text-gray-300">Notlar</Label>
                                    <textarea
                                        id="notlar"
                                        name="notlar"
                                        value={animal.notlar || ''}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full rounded-md border border-gray-700 bg-[#111C44] text-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/animals')}
                                className="w-32 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-700"
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-32 bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : id ? (
                                    'Güncelle'
                                ) : (
                                    'Kaydet'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnimalForm;