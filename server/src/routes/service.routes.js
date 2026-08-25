const express = require('express');
const router = express.Router();
const { getAllServices, getAdminServices, getServiceById, createService, updateService, updateServiceStatus, deleteService } = require('../controllers/service.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', getAllServices);
router.get('/admin', authenticateUser, requireAdmin, getAdminServices);
router.get('/:id', getServiceById);
router.post('/', authenticateUser, requireAdmin, upload.single('image'), createService);
router.put('/:id', authenticateUser, requireAdmin, upload.single('image'), updateService);
router.patch('/:id/status', authenticateUser, requireAdmin, updateServiceStatus);
router.delete('/:id', authenticateUser, requireAdmin, deleteService);

module.exports = router;
