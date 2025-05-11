import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FaCow, FaCalendar, FaTint, FaWeight, FaChartLine } from 'react-icons/fa';
import { PiDropHalfBottomLight } from 'react-icons/pi';

const EditAnimal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnimal();
    }, [id]);

    const fetchAnimal = async () => {
        try {
            const response = await fetch(`/api/animals/${id}`);
            if (!response.ok) throw new Error('Hayvan bilgileri alınamadı');
            const data = await response.json();
            setAnimal(data);
        } catch (error) {
            console.error('Hayvan bilgileri alınırken hata:', error);
            toast.error('Hayvan bilgileri alınamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/animals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(animal)
            });
            if (!response.ok) throw new Error('Güncelleme başarısız');
            toast.success('Hayvan bilgileri güncellendi');
            navigate('/animals');
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            toast.error('Güncelleme başarısız');
        }
    };

    if (loading) return <div>Yükleniyor...</div>;
    if (!animal) return <div>Hayvan bulunamadı</div>;

    return (
        <div className="container mx-auto p-4 bg-slate-900 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-slate-100">Hayvan Detayları</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Temel Bilgiler */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-2">
                            <FaCow className="text-slate-400" />
                            <h3 className="font-semibold text-slate-100">Temel Bilgiler</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-slate-400">Küpe No</Label>
                                <div className="font-semibold text-slate-200">{animal.kupeno}</div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Cinsiyet</Label>
                                <div className="font-semibold text-slate-200">{animal.cinsiyet}</div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Irk</Label>
                                <div className="font-semibold text-slate-200">{animal.irk}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Doğum Bilgileri */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-2">
                            <FaCalendar className="text-slate-400" />
                            <h3 className="font-semibold text-slate-100">Doğum Bilgileri</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-slate-400">Doğum Tarihi</Label>
                                <div className="font-semibold text-slate-200">
                                    {animal.dogtar ? format(new Date(animal.dogtar), 'dd MMMM yyyy', { locale: tr }) : '-'}
                                </div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Anne No</Label>
                                <div className="font-semibold text-slate-200">{animal.anne_no || '-'}</div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Baba No</Label>
                                <div className="font-semibold text-slate-200">{animal.baba_no || '-'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Süt Verimi Bilgileri - İnek ise */}
                {animal.cinsiyet === 'Dişi' && animal.sut_verimi && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center space-x-2">
                                <PiDropHalfBottomLight className="text-slate-400" />
                                <h3 className="font-semibold text-slate-100">Süt Verimi</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <Label className="text-slate-400">Buzağılama Tarihi</Label>
                                    <div className="font-semibold text-slate-200">
                                        {animal.sut_verimi.buzagilama_tarihi ? 
                                            format(new Date(animal.sut_verimi.buzagilama_tarihi), 'dd MMMM yyyy', { locale: tr }) : 
                                            '-'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-slate-400">Sağmal Gün</Label>
                                    <div className="font-semibold text-slate-200">{animal.sut_verimi.sagmal_gun || 0} gün</div>
                                </div>
                                <div>
                                    <Label className="text-slate-400">Günlük Süt Ortalaması</Label>
                                    <div className="font-semibold text-slate-200">
                                        {animal.sut_verimi.gunluk_sut_ortalamasi ? 
                                            `${animal.sut_verimi.gunluk_sut_ortalamasi} lt` : 
                                            '-'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-slate-400">Son Ölçüm Tarihi</Label>
                                    <div className="font-semibold text-slate-200">
                                        {animal.sut_verimi.olcum_tarihi ? 
                                            format(new Date(animal.sut_verimi.olcum_tarihi), 'dd MMMM yyyy', { locale: tr }) : 
                                            '-'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Anne Süt Verimi - Dişi buzağı ise */}
                {animal.cinsiyet === 'Dişi' && animal.anne_sut_verimi && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center space-x-2">
                                <FaChartLine className="text-slate-400" />
                                <h3 className="font-semibold text-slate-100">Anne Süt Verimi</h3>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <Label className="text-slate-400">Anne Günlük Süt Ortalaması</Label>
                                    <div className="font-semibold text-slate-200">
                                        {animal.anne_sut_verimi.gunluk_sut_ortalamasi ? 
                                            `${animal.anne_sut_verimi.gunluk_sut_ortalamasi} lt` : 
                                            '-'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-slate-400">Son Ölçüm Tarihi</Label>
                                    <div className="font-semibold text-slate-200">
                                        {animal.anne_sut_verimi.olcum_tarihi ? 
                                            format(new Date(animal.anne_sut_verimi.olcum_tarihi), 'dd MMMM yyyy', { locale: tr }) : 
                                            '-'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Sağlık Bilgileri */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-2">
                            <FaTint className="text-slate-400" />
                            <h3 className="font-semibold text-slate-100">Sağlık Bilgileri</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-slate-400">Sağlık Durumu</Label>
                                <div className="font-semibold text-slate-200">{animal.saglik_durumu || 'Sağlıklı'}</div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Son Aşı Tarihi</Label>
                                <div className="font-semibold text-slate-200">
                                    {animal.son_asi_tarihi ? 
                                        format(new Date(animal.son_asi_tarihi), 'dd MMMM yyyy', { locale: tr }) : 
                                        '-'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ağırlık Bilgileri */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-2">
                            <FaWeight className="text-slate-400" />
                            <h3 className="font-semibold text-slate-100">Ağırlık Bilgileri</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <Label className="text-slate-400">Doğum Ağırlığı</Label>
                                <div className="font-semibold text-slate-200">{animal.dogum_agirligi ? `${animal.dogum_agirligi} kg` : '-'}</div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Güncel Ağırlık</Label>
                                <div className="font-semibold text-slate-200">{animal.guncel_agirlik ? `${animal.guncel_agirlik} kg` : '-'}</div>
                            </div>
                            <div>
                                <Label className="text-slate-400">Son Tartım Tarihi</Label>
                                <div className="font-semibold text-slate-200">
                                    {animal.son_tartim_tarihi ? 
                                        format(new Date(animal.son_tartim_tarihi), 'dd MMMM yyyy', { locale: tr }) : 
                                        '-'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Form Kartı */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-slate-100">Bilgileri Düzenle</h3>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-slate-400" htmlFor="kupeno">Küpe No</Label>
                                <Input
                                    id="kupeno"
                                    value={animal.kupeno || ''}
                                    onChange={(e) => setAnimal({ ...animal, kupeno: e.target.value })}
                                    className="bg-slate-700 border-slate-600 text-slate-200"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-400" htmlFor="cinsiyet">Cinsiyet</Label>
                                <Select
                                    id="cinsiyet"
                                    value={animal.cinsiyet || ''}
                                    onChange={(e) => setAnimal({ ...animal, cinsiyet: e.target.value })}
                                    className="bg-slate-700 border-slate-600 text-slate-200"
                                >
                                    <option value="Erkek">Erkek</option>
                                    <option value="Dişi">Dişi</option>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-slate-400" htmlFor="irk">Irk</Label>
                                <Input
                                    id="irk"
                                    value={animal.irk}
                                    onChange={(e) => setAnimal({ ...animal, irk: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-slate-400" htmlFor="dogtar">Doğum Tarihi</Label>
                                <Input
                                    id="dogtar"
                                    type="date"
                                    value={animal.dogtar ? animal.dogtar.split('T')[0] : ''}
                                    onChange={(e) => setAnimal({ ...animal, dogtar: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-slate-400" htmlFor="anne_no">Anne No</Label>
                                <Input
                                    id="anne_no"
                                    value={animal.anne_no || ''}
                                    onChange={(e) => setAnimal({ ...animal, anne_no: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-slate-400" htmlFor="baba_no">Baba No</Label>
                                <Input
                                    id="baba_no"
                                    value={animal.baba_no || ''}
                                    onChange={(e) => setAnimal({ ...animal, baba_no: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button
                                type="button"
                                onClick={() => navigate('/animals')}
                                variant="outline"
                                className="bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600"
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Kaydet
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default EditAnimal; 