import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-toastify';

const DeadAnimalList = () => {
    const [deadAnimals, setDeadAnimals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDeadAnimals = async () => {
            try {
                const response = await axios.get('/api/animals/dead'); // Arka yüz API uç noktası
                if (response.data.success) {
                    setDeadAnimals(response.data.data || []);
                } else {
                    setError(response.data.error || 'Ölen hayvanlar listesi alınamadı.');
                    toast.error(response.data.error || 'Ölen hayvanlar listesi alınamadı.');
                }
            } catch (err) {
                console.error('Ölen hayvanlar listesi getirme hatası:', err);
                setError('Ölen hayvanlar listesi getirilirken bir hata oluştu.');
                toast.error('Ölen hayvanlar listesi getirilirken bir hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeadAnimals();
    }, []);

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Ölen Hayvanlar Listesi</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Ölen hayvanlar yükleniyor...</p>
                    ) : error ? (
                        <p className="text-red-500">Hata: {error}</p>
                    ) : deadAnimals.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Küpe No</TableHead>
                                        <TableHead>Adı</TableHead>
                                        <TableHead>Cinsi</TableHead>
                                        <TableHead>Doğum Tarihi</TableHead>
                                        <TableHead>Ölüm Tarihi</TableHead>
                                        <TableHead>Ölüm Nedeni</TableHead>
                                        {/* TODO: Add more columns as needed */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deadAnimals.map(animal => (
                                        <TableRow key={animal.id}>
                                            <TableCell>{animal.kupeno}</TableCell>
                                            <TableCell>{animal.isim}</TableCell>
                                            <TableCell>{animal.irk}</TableCell>
                                            <TableCell>{animal.dogtar ? format(new Date(animal.dogtar), 'dd.MM.yyyy') : '-'}</TableCell>
                                            <TableCell>{animal.olum_tarihi ? format(new Date(animal.olum_tarihi), 'dd.MM.yyyy') : '-'}</TableCell>
                                            <TableCell>{animal.olum_nedeni || 'Belirtilmemiş'}</TableCell>
                                            {/* TODO: Add more cell data as needed */}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p>Kayıtlı ölen hayvan bulunmamaktadır.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DeadAnimalList; 