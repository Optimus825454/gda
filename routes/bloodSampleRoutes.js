const express = require('express');
const BloodSampleController = require('../controllers/BloodSampleController');

const router = express.Router();

// Ana rota dosyasına giriş logu
router.use((req, res, next) => {
    console.log(`[DEBUG] bloodSampleRoutes.js'e istek geldi: ${req.method} ${req.path}`);
    next();
});

// CRUD işlemleri
router.post('/', BloodSampleController.create);
router.get('/', BloodSampleController.list);
router.get('/:id', BloodSampleController.getById);
router.put('/:id', BloodSampleController.update);
router.delete('/:id', BloodSampleController.delete);

module.exports = router; 