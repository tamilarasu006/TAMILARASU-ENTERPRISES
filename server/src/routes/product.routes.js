const express = require('express');
const router = express.Router();
const { getProducts, getAdminProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct } = require('../controllers/product.controller');
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', authenticateUser, getProducts);
router.get('/admin', authenticateUser, requireRoles(['PRODUCT_ADMIN', 'SALES_ADMIN', 'ORDER_ADMIN']), getAdminProducts);
router.get('/:id', authenticateUser, getProductById);
router.post('/', authenticateUser, requireRoles(['PRODUCT_ADMIN']), upload.single('image'), createProduct);
router.put('/:id', authenticateUser, requireRoles(['PRODUCT_ADMIN']), upload.single('image'), updateProduct);
router.patch('/:id/status', authenticateUser, requireRoles(['PRODUCT_ADMIN']), updateProductStatus);
router.delete('/:id', authenticateUser, requireRoles(['PRODUCT_ADMIN']), deleteProduct);

module.exports = router;