/**
 * validation.js - İstek doğrulama middleware'leri
 */

const { body, param, query, validationResult } = require( 'express-validator' );

// Doğrulama sonuçlarını işleyen middleware
const handleValidationErrors = ( req, res, next ) => {
    const errors = validationResult( req );
    if ( !errors.isEmpty() ) {
        return res.status( 400 ).json( { errors: errors.array() } );
    }
    next();
};

// Örnek doğrulama kuralları

// Kullanıcı oluşturma doğrulaması
const validateCreateUser = [
    body( 'email' ).isEmail().withMessage( 'Geçerli bir e-posta adresi girin' ),
    body( 'password' ).isLength( { min: 6 } ).withMessage( 'Şifre en az 6 karakter olmalı' ),
    body( 'username' ).trim().notEmpty().withMessage( 'Kullanıcı adı boş olamaz' ),
    body( 'firstName' ).trim().notEmpty().withMessage( 'Ad boş olamaz' ),
    body( 'lastName' ).trim().notEmpty().withMessage( 'Soyad boş olamaz' ),
    handleValidationErrors
];

// Kullanıcı güncelleme doğrulaması
const validateUpdateUser = [
    param( 'id' ).isUUID().withMessage( 'Geçersiz kullanıcı ID formatı' ),
    body( 'email' ).optional().isEmail().withMessage( 'Geçerli bir e-posta adresi girin' ),
    body( 'username' ).optional().trim().notEmpty().withMessage( 'Kullanıcı adı boş olamaz' ),
    body( 'firstName' ).optional().trim().notEmpty().withMessage( 'Ad boş olamaz' ),
    body( 'lastName' ).optional().trim().notEmpty().withMessage( 'Soyad boş olamaz' ),
    body( 'isActive' ).optional().isBoolean().withMessage( 'Aktiflik durumu boolean olmalı' ),
    handleValidationErrors
];

// Hayvan oluşturma doğrulaması
const validateCreateAnimal = [
    body( 'animalId' ).trim().notEmpty().withMessage( 'Hayvan kimlik numarası boş olamaz' ),
    body( 'type' ).trim().notEmpty().withMessage( 'Hayvan türü boş olamaz' ),
    body( 'birthDate' ).optional().isISO8601().toDate().withMessage( 'Geçerli bir doğum tarihi girin' ),
    body( 'gender' ).optional().isIn( ['E', 'F'] ).withMessage( 'Cinsiyet E veya F olmalı' ),
    body( 'weight' ).optional().isFloat( { gt: 0 } ).withMessage( 'Ağırlık pozitif bir sayı olmalı' ),
    handleValidationErrors
];

// Hayvan güncelleme doğrulaması
const validateUpdateAnimal = [
    param( 'id' ).isUUID().withMessage( 'Geçersiz hayvan ID formatı' ),
    body( 'animalId' ).optional().trim().notEmpty().withMessage( 'Hayvan kimlik numarası boş olamaz' ),
    body( 'type' ).optional().trim().notEmpty().withMessage( 'Hayvan türü boş olamaz' ),
    body( 'birthDate' ).optional().isISO8601().toDate().withMessage( 'Geçerli bir doğum tarihi girin' ),
    body( 'gender' ).optional().isIn( ['E', 'F'] ).withMessage( 'Cinsiyet E veya F olmalı' ),
    body( 'weight' ).optional().isFloat( { gt: 0 } ).withMessage( 'Ağırlık pozitif bir sayı olmalı' ),
    handleValidationErrors
];

// Lokasyon oluşturma doğrulaması
const validateCreateLocation = [
    body( 'name' ).trim().notEmpty().withMessage( 'Lokasyon adı boş olamaz' ),
    body( 'type' ).isIn( ['AHIR', 'PADOK'] ).withMessage( 'Lokasyon tipi AHIR veya PADOK olmalı' ),
    body( 'capacity' ).optional().isInt( { gt: 0 } ).withMessage( 'Kapasite pozitif bir tam sayı olmalı' ),
    handleValidationErrors
];

// Lokasyon güncelleme doğrulaması
const validateUpdateLocation = [
    param( 'id' ).isUUID().withMessage( 'Geçersiz lokasyon ID formatı' ),
    body( 'name' ).optional().trim().notEmpty().withMessage( 'Lokasyon adı boş olamaz' ),
    body( 'type' ).optional().isIn( ['AHIR', 'PADOK'] ).withMessage( 'Lokasyon tipi AHIR veya PADOK olmalı' ),
    body( 'capacity' ).optional().isInt( { gt: 0 } ).withMessage( 'Kapasite pozitif bir tam sayı olmalı' ),
    body( 'status' ).optional().isIn( ['AKTIF', 'PASIF'] ).withMessage( 'Durum AKTIF veya PASIF olmalı' ),
    handleValidationErrors
];

// Lojistik operasyon oluşturma doğrulaması
const validateCreateOperation = [
    body( 'batchNumber' ).trim().notEmpty().withMessage( 'Parti numarası boş olamaz' ),
    body( 'processType' ).isIn( ['KESIM', 'PARCALAMA', 'PAKETLEME'] ).withMessage( 'Geçersiz işlem tipi' ),
    body( 'animalIds' ).isArray( { min: 1 } ).withMessage( 'En az bir hayvan ID\'si gereklidir' ),
    body( 'animalIds.*' ).isUUID().withMessage( 'Geçersiz hayvan ID formatı' ),
    body( 'startDate' ).isISO8601().toDate().withMessage( 'Geçerli bir başlangıç tarihi girin' ),
    handleValidationErrors
];

// Lojistik operasyon durum güncelleme doğrulaması
const validateUpdateOperationStatus = [
    param( 'id' ).isUUID().withMessage( 'Geçersiz operasyon ID formatı' ),
    body( 'status' ).isIn( ['BEKLEMEDE', 'ISLEMDE', 'TAMAMLANDI', 'IPTAL'] ).withMessage( 'Geçersiz operasyon durumu' ),
    handleValidationErrors
];

// Sevkiyat oluşturma doğrulaması
const validateCreateShipment = [
    body( 'shipmentNumber' ).trim().notEmpty().withMessage( 'Sevkiyat numarası boş olamaz' ),
    body( 'batchNumbers' ).isArray( { min: 1 } ).withMessage( 'En az bir parti numarası gereklidir' ),
    body( 'batchNumbers.*' ).trim().notEmpty().withMessage( 'Parti numarası boş olamaz' ),
    body( 'vehicleType' ).isIn( ['KAMYON', 'KAMYONET', 'TIR'] ).withMessage( 'Geçersiz araç tipi' ),
    body( 'vehiclePlate' ).trim().notEmpty().withMessage( 'Araç plakası boş olamaz' ),
    body( 'originLocation' ).trim().notEmpty().withMessage( 'Çıkış lokasyonu boş olamaz' ),
    body( 'destinationLocation' ).trim().notEmpty().withMessage( 'Varış lokasyonu boş olamaz' ),
    body( 'plannedDepartureTime' ).isISO8601().toDate().withMessage( 'Geçerli bir planlanan çıkış zamanı girin' ),
    handleValidationErrors
];

// Sevkiyat durum güncelleme doğrulaması
const validateUpdateShipmentStatus = [
    param( 'id' ).isUUID().withMessage( 'Geçersiz sevkiyat ID formatı' ),
    body( 'status' ).isIn( ['PLANLANMIS', 'YUKLENIYOR', 'YOLDA', 'TESLIM_EDILDI', 'IPTAL'] ).withMessage( 'Geçersiz sevkiyat durumu' ),
    body( 'locationUpdate' ).optional().trim().notEmpty().withMessage( 'Lokasyon güncellemesi boş olamaz' ),
    handleValidationErrors
];

// Çevresel veri güncelleme doğrulaması
const validateUpdateEnvironmentalData = [
    param( 'id' ).isUUID().withMessage( 'Geçersiz ID formatı' ),
    query( 'type' ).isIn( ['operation', 'shipment'] ).withMessage( 'Geçersiz tip belirtildi (operation veya shipment olmalı)' ),
    body( 'temperature' ).optional().isFloat().withMessage( 'Sıcaklık sayı olmalı' ),
    body( 'humidity' ).optional().isFloat( { min: 0, max: 100 } ).withMessage( 'Nem oranı 0-100 arasında sayı olmalı' ),
    handleValidationErrors
];


module.exports = {
    handleValidationErrors,
    validateCreateUser,
    validateUpdateUser,
    validateCreateAnimal,
    validateUpdateAnimal,
    validateCreateLocation,
    validateUpdateLocation,
    validateCreateOperation,
    validateUpdateOperationStatus,
    validateCreateShipment,
    validateUpdateShipmentStatus,
    validateUpdateEnvironmentalData
};