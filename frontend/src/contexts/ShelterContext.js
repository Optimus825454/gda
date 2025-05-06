import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    fetchShelters, 
    createShelter, 
    updateShelter, 
    fetchShelterById,
    removeAnimalsFromPaddock, 
    transferAnimalsBetweenPaddocks 
} from '../utils/shelterService';

const ShelterContext = createContext();

export const ShelterProvider = ({ children }) => {
    const [shelters, setShelters] = useState([]);
    const [currentShelter, setCurrentShelter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Tüm barınakları getir
    const getAllShelters = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchShelters();
            setShelters(data);
            return data;
        } catch (err) {
            setError(err.message || 'Barınak listesi alınamadı');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Barınak detaylarını getir
    const getShelterById = async (shelterId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchShelterById(shelterId);
            setCurrentShelter(data);
            return data;
        } catch (err) {
            setError(err.message || 'Barınak detayları alınamadı');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Yeni barınak oluştur
    const addShelter = async (shelterData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await createShelter(shelterData);
            getAllShelters(); // Listeyi güncelle
            return data;
        } catch (err) {
            setError(err.message || 'Barınak oluşturulamadı');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Barınak güncelle
    const editShelter = async (shelterId, shelterData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await updateShelter(shelterId, shelterData);
            
            // Güncel listeyi al
            getAllShelters();
            
            // Eğer düzenlenen barınak şu an görüntülenen barınak ise, detayları da güncelle
            if (currentShelter && currentShelter.id === shelterId) {
                await getShelterById(shelterId);
            }
            
            return data;
        } catch (err) {
            setError(err.message || 'Barınak güncellenemedi');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Padoktan hayvanları çıkar
    const handleRemoveAnimalsFromPaddock = async (paddockId, animalIds) => {
        setLoading(true);
        setError(null);
        try {
            await removeAnimalsFromPaddock(paddockId, animalIds);
            
            // Barınak detaylarını güncelle
            if (currentShelter) {
                await getShelterById(currentShelter.id);
            }
            
            return true;
        } catch (err) {
            setError(err.message || 'Hayvanlar padoktan çıkarılamadı');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Padoklar arası hayvan transferi
    const handleTransferAnimalsBetweenPaddocks = async (sourcePaddockId, targetPaddockId, animalIds) => {
        setLoading(true);
        setError(null);
        try {
            await transferAnimalsBetweenPaddocks(sourcePaddockId, targetPaddockId, animalIds);
            
            // Barınak detaylarını güncelle
            if (currentShelter) {
                await getShelterById(currentShelter.id);
            }
            
            return true;
        } catch (err) {
            setError(err.message || 'Hayvanlar transfer edilemedi');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // İlk yükleme
    useEffect(() => {
        getAllShelters();
    }, []);

    return (
        <ShelterContext.Provider
            value={{
                shelters,
                currentShelter,
                loading,
                error,
                setError,
                getAllShelters,
                getShelterById,
                addShelter,
                editShelter,
                removeAnimalsFromPaddock: handleRemoveAnimalsFromPaddock,
                transferAnimalsBetweenPaddocks: handleTransferAnimalsBetweenPaddocks
            }}
        >
            {children}
        </ShelterContext.Provider>
    );
};

// Custom hook
export const useShelter = () => {
    const context = useContext(ShelterContext);
    if (!context) {
        throw new Error('useShelter must be used within a ShelterProvider');
    }
    return context;
};

export default ShelterContext;