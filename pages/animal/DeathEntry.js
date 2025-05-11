import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/label';
import { Calendar } from '../../components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/Popover';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeathEntry = () => {
    const [earTagEnd, setEarTagEnd] = useState('');
    const [suggestedAnimals, setSuggestedAnimals] = useState([]);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [deathDate, setDeathDate] = useState(null);
    const [deathReason, setDeathReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const earTagInputRef = useRef(null);

    // Hayvan önerilerini getirme
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (earTagEnd.length === 2) {
                setIsLoading(true);
                setError('');
                try {
                    const response = await axios.get(`/api/animals/death-suggestions/${earTagEnd}`);
                    setSuggestedAnimals(response.data.data || []);
                } catch (err) {
                    console.error('Öneri getirme hatası:', err);
                    setError('Öneri getirilirken bir hata oluştu.');
                    setSuggestedAnimals([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestedAnimals([]);
                setSelectedAnimal(null);
                setError('');
            }
        };

        const debounceTimeout = setTimeout(() => {
            fetchSuggestions();
        }, 300); // 300ms gecikme ile arama yap

        return () => clearTimeout(debounceTimeout); // Temizleme

    }, [earTagEnd]);

    const handleAnimalSelect = (animal) => {
        setSelectedAnimal(animal);
        setSuggestedAnimals([]); // Seçim sonrası önerileri temizle
        setEarTagEnd(animal.earTag.slice(-2)); // Inputu seçilen hayvanın son 2 hanesiyle doldur
    };

    const handleSaveDeath = async () => {
        if (!selectedAnimal || !deathDate || !deathReason) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/animals/death', {
                animalId: selectedAnimal.id,
                deathDate: format(deathDate, 'yyyy-MM-dd'),
                deathReason: deathReason,
            });

            if (response.data.success) {
                toast.success(`${selectedAnimal.name} adlı hayvanın ölüm bilgisi başarıyla kaydedildi.`);
                // Formu temizle
                setEarTagEnd('');
                setSuggestedAnimals([]);
                setSelectedAnimal(null);
                setDeathDate(null);
                setDeathReason('');
            } else {
                setError(response.data.error || 'Ölüm bilgisi kaydedilirken bir hata oluştu.');
                toast.error(response.data.error || 'Ölüm bilgisi kaydedilirken bir hata oluştu.');
            }
        } catch (err) {
            console.error('Ölüm bilgisi kaydetme hatası:', err);
            setError('Ölüm bilgisi kaydedilirken bir hata oluştu.');
            toast.error('Ölüm bilgisi kaydedilirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Ölüm Girişi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div>
                            <Label htmlFor="earTagEnd">Kulak Numarasının Son 2 Hanesi</Label>
                            <Input
                                id="earTagEnd"
                                type="text"
                                placeholder="Son 2 hane"
                                value={earTagEnd}
                                onChange={(e) => setEarTagEnd(e.target.value)}
                                maxLength={2}
                                className="w-full"
                                ref={earTagInputRef}
                            />
                            {isLoading && earTagEnd.length === 2 && <p className="text-sm text-muted-foreground">Hayvanlar aranıyor...</p>}
                            {suggestedAnimals.length > 0 && (
                                <ul className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-background z-10">
                                    {suggestedAnimals.map(animal => (
                                        <li
                                            key={animal.id}
                                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                                            onClick={() => handleAnimalSelect(animal)}
                                        >
                                            {animal.earTag} - {animal.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {!isLoading && earTagEnd.length === 2 && suggestedAnimals.length === 0 && <p className="text-sm text-muted-foreground">Hayvan bulunamadı.</p>}
                        </div>

                        {selectedAnimal && (
                            <div className="border rounded-md p-4 mt-2 bg-muted/40">
                                <h4 className="font-semibold mb-2">Seçilen Hayvan Detayları</h4>
                                <p><strong>Küpe No:</strong> {selectedAnimal.earTag}</p>
                                <p><strong>Adı:</strong> {selectedAnimal.name}</p>
                                <p><strong>Cinsi:</strong> {selectedAnimal.breed}</p>
                                <p><strong>Doğum Tarihi:</strong> {selectedAnimal.birthDate}</p>
                                {/* TODO: Add more animal details as needed */}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="deathDate">Ölüm Tarihi</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={`w-full justify-start text-left font-normal ${
                                            !deathDate && "text-muted-foreground"
                                        }`}
                                    >
                                        {deathDate ? format(deathDate, "PPP", { locale: tr }) : <span>Tarih Seçin</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={deathDate}
                                        onSelect={setDeathDate}
                                        initialFocus
                                        locale={tr}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label htmlFor="deathReason">Ölüm Nedeni</Label>
                            <Input
                                id="deathReason"
                                type="text"
                                placeholder="Ölüm nedeni"
                                value={deathReason}
                                onChange={(e) => setDeathReason(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <Button onClick={handleSaveDeath} className="w-full" disabled={isLoading || !selectedAnimal || !deathDate || !deathReason}>
                            {isLoading ? 'Kaydediliyor...' : 'Ölüm Bilgisini Kaydet'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DeathEntry;
