/**
 * shelterRoutes.js - Barınak ve padok yönetimi için API rotaları
 */

const express = require('express');
const ShelterController = require('../controllers/ShelterController');
const PaddockController = require('../controllers/PaddockController');
const { checkPermission } = require('../middleware/permissions');
const { PERMISSIONS } = require('../config/permissionConstants');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Barınak rotaları
// Tüm barınakları listele
router.get('/shelters', checkPermission(PERMISSIONS.READ_SHELTER), ShelterController.getAllShelters);

// Barınak detayını getir
router.get('/shelters/:id', checkPermission(PERMISSIONS.READ_SHELTER), ShelterController.getShelterById);

// Yeni barınak ekle
router.post('/shelters', checkPermission(PERMISSIONS.WRITE_SHELTER), ShelterController.createShelter);

// Barınak güncelle
router.put('/shelters/:id', checkPermission(PERMISSIONS.WRITE_SHELTER), ShelterController.updateShelter);

// Barınak sil
router.delete('/shelters/:id', checkPermission(PERMISSIONS.WRITE_SHELTER), ShelterController.deleteShelter);

// Barınaktaki hayvanları listele
router.get('/shelters/:id/animals', checkPermission(PERMISSIONS.READ_SHELTER), ShelterController.getShelterAnimals);

// Barınağa hayvan ata
router.post('/shelters/:id/assign-animals', checkPermission(PERMISSIONS.WRITE_SHELTER), ShelterController.assignAnimalsToShelter);

// Padok rotaları
// Tüm padokları listele
router.get('/paddocks', checkPermission(PERMISSIONS.READ_SHELTER), PaddockController.getAllPaddocks);

// Barınağa ait padokları listele
router.get('/shelters/:shelterId/paddocks', checkPermission(PERMISSIONS.READ_SHELTER), PaddockController.getPaddocksByShelterId);

// Padok detayını getir
router.get('/paddocks/:id', checkPermission(PERMISSIONS.READ_SHELTER), PaddockController.getPaddockById);

// Padoktaki hayvanları listele
router.get('/paddocks/:id/animals', checkPermission(PERMISSIONS.READ_SHELTER), PaddockController.getPaddockAnimals);

// Yeni padok ekle
router.post('/paddocks', checkPermission(PERMISSIONS.WRITE_SHELTER), PaddockController.createPaddock);

// Padok güncelle
router.put('/paddocks/:id', checkPermission(PERMISSIONS.WRITE_SHELTER), PaddockController.updatePaddock);

// Padok sil
router.delete('/paddocks/:id', checkPermission(PERMISSIONS.WRITE_SHELTER), PaddockController.deletePaddock);

// Padoğa hayvan ata
router.post('/paddocks/:id/assign-animals', checkPermission(PERMISSIONS.WRITE_SHELTER), PaddockController.assignAnimals);

module.exports = router;