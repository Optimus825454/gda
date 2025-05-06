/**
 * shelterService.js - Barınak ve padok işlemleri için API istekleri
 */

import api from './api';

// Barınaklar
export const getAllShelters = () => api.get('/shelters');
export const getShelterById = (id) => api.get(`/shelters/${id}`);
export const createShelter = (data) => api.post('/shelters', data);
export const updateShelter = (id, data) => api.put(`/shelters/${id}`, data);
export const deleteShelter = (id) => api.delete(`/shelters/${id}`);

// Padoklar
export const getPaddocksByShelter = (shelterId) => api.get(`/shelters/${shelterId}/paddocks`);
export const getPaddockById = (id) => api.get(`/paddocks/${id}`);
export const createPaddock = (data) => api.post('/paddocks', data);
export const updatePaddock = (id, data) => api.put(`/paddocks/${id}`, data);
export const deletePaddock = (id) => api.delete(`/paddocks/${id}`);

// Hayvan atama işlemleri
export const getUnassignedAnimals = () => api.get('/animals/unassigned');
export const assignAnimalsToPaddock = (paddockId, animalIds) => 
  api.post(`/paddocks/${paddockId}/assign`, { animalIds });
export const unassignAnimalsFromPaddock = (paddockId, animalIds) => 
  api.post(`/paddocks/${paddockId}/unassign`, { animalIds });

// Barınak istatistikleri
export const getShelterStats = () => api.get('/shelters/stats');