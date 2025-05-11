import api from './api'; // api dosyasını kullanacağız

export const getAnimal = async ( id ) => {
    const response = await api.get( `/animals/${id}` );
    return response.data;
};

export const createAnimal = async ( animalData ) => {
    const response = await api.post( '/animals', animalData );
    return response.data;
};

export const updateAnimal = async ( id, animalData ) => {
    const response = await api.put( `/animals/${id}`, animalData );
    return response.data;
};

export const deleteAnimal = async ( id ) => {
    const response = await api.delete( `/animals/${id}` );
    return response.data;
};

export const getAllAnimals = async () => {
    const response = await api.get( '/animals' );
    return response.data;
};