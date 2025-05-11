/**
 * animalRoutes.js - Hayvan işlemleri için API rotaları
 */

const express = require( 'express' );
const animalController = require( '../controllers/animalController' );
const Animal = require( '../models/Animal' );

const router = express.Router();

// Ana rota dosyasına giriş logu - GEÇİCİ DEBUG
router.use( ( req, res, next ) => {
    console.log( `[DEBUG] animalRoutes.js'e istek geldi: ${req.method} ${req.path}` );
    next();
} );

// Toplu hayvan şablonunu indirme endpoint'i
router.get( '/template', animalController.downloadTemplate );

// Temel CRUD işlemleri
router.get( '/', animalController.listAnimals );
router.post( '/', animalController.createAnimal );
router.get( '/constants', animalController.getConstants );
router.get( '/search', animalController.searchAnimals ); // Genel arama
router.get( '/search/ear-tag-for-sale', animalController.searchAnimalsForSaleByEarTag ); // Satış için küpe no ile arama
router.get( '/search/animal-id-for-sale', animalController.searchAnimalsForSaleByAnimalId ); // Satış için hayvan ID ile arama

// Rapor endpoint'leri
router.get( '/reports/counts', animalController.getAnimalReportCounts );
router.get( '/reports/pregnant-cows', animalController.getPregnantCows );
router.get( '/reports/pregnant-heifers', animalController.getPregnantHeifers );
router.get( '/reports/dry-cows', animalController.getDryCows );
router.get( '/reports/male-calves', animalController.getMaleCalves );
router.get( '/reports/sold-animals', animalController.getSoldAnimals );
router.get( '/reports/young-females-dam-yield', animalController.getYoungFemalesWithDamYield );
router.get( '/reports/slaughtered-animals', animalController.getSlaughteredAnimals );
router.get( '/reports/slaughter-referral', animalController.getSlaughterReferral );
router.get( '/reports/breeding-stock', animalController.getBreedingStock );
router.get( '/reports/all-cows', animalController.getAllCows );

// Hayvan grupları endpoint'i
router.get( '/groups', animalController.getAnimalGroups );

// ID bazlı işlemler
router.get( '/:id', animalController.getAnimalById );
router.put( '/:id', animalController.updateAnimal );
router.delete( '/:id', animalController.deleteAnimal );

// Kategori ve durum endpoint'leri
router.get( '/category/:category', animalController.listByCategory );
router.get( '/test-result/:result', animalController.listByTestResult );
router.get( '/destination/:company', animalController.listByDestination );

// Ölüm ve Doğum Girişleri
router.get('/death-suggestions/:prefix', animalController.getDeathSuggestions);
router.post('/death-entry', animalController.createDeathEntry);
router.get('/birth-suggestions/:prefix', animalController.getBirthSuggestions);
router.post('/birth-entry', animalController.createBirthEntry);

module.exports = router;
