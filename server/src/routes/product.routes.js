const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct } = require('../controllers/product.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticateUser, requireAdmin, createProduct);

module.exports = router;