const express = require('express');
const router = express.Router();
const { getAllServices, getAdminServices, getServiceById, createService, updateService, updateServiceStatus, deleteService } = require('../controllers/service.controller');
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', getAllServices);
router.get('/admin', authenticateUser, requireRoles(['PRODUCT_ADMIN', 'SALES_ADMIN', 'ORDER_ADMIN']), getAdminServices);
router.get('/:id', getServiceById);
router.post('/', authenticateUser, requireRoles(['PRODUCT_ADMIN']), upload.single('image'), createService);
router.put('/:id', authenticateUser, requireRoles(['PRODUCT_ADMIN']), upload.single('image'), updateService);
router.patch('/:id/status', authenticateUser, requireRoles(['PRODUCT_ADMIN']), updateServiceStatus);
router.delete('/:id', authenticateUser, requireRoles(['PRODUCT_ADMIN']), deleteService);

module.exports = router;
