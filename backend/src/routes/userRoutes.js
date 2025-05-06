const express = require('express');
const UserController = require('../controllers/userController');
const { checkPermission } = require('../middleware/checkPermission');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Debug log
router.use((req, res, next) => {
    console.log(`[DEBUG] userRoutes.js'e istek geldi: ${req.method} ${req.path}`);
    next();
});

// Tüm rotalar için auth middleware'i kullan
router.use(authMiddleware);

// Ana kullanıcı yönetimi rotaları
router.get('/', checkPermission('USER_READ'), UserController.listUsers);
router.get('/:id', checkPermission('USER_READ'), UserController.getUserById);
router.post('/', checkPermission('USER_CREATE'), UserController.createUser);
router.put('/:id', checkPermission('USER_UPDATE'), UserController.updateUser);
router.delete('/:id', checkPermission('USER_DELETE'), UserController.deleteUser);

// Özel kullanıcı işlemleri
router.put('/:id/password', checkPermission('USER_UPDATE'), UserController.changePassword);
router.put('/:id/status', checkPermission('USER_UPDATE'), UserController.changeStatus);

// Kullanıcı işlem logları
router.get('/:id/logs', checkPermission('USER_READ'), UserController.getUserLogs);
router.get('/logs/all', checkPermission('USER_READ'), UserController.getAllLogs);

// Rol yönetimi rotaları
router.post('/role', checkPermission('ROLE_MANAGE'), UserController.assignRole);
router.delete('/role', checkPermission('ROLE_MANAGE'), UserController.removeRole);

module.exports = router;
