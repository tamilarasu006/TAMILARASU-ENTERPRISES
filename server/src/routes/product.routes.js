const express = require('express');
const router = express.Router();
const { getProducts, getAdminProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct } = require('../controllers/product.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', getProducts);
router.get('/admin', authenticateUser, requireAdmin, getAdminProducts);
router.get('/:id', getProductById);
router.post('/', authenticateUser, requireAdmin, upload.single('image'), createProduct);
router.put('/:id', authenticateUser, requireAdmin, upload.single('image'), updateProduct);
router.patch('/:id/status', authenticateUser, requireAdmin, updateProductStatus);
router.delete('/:id', authenticateUser, requireAdmin, deleteProduct);

module.exports = router;