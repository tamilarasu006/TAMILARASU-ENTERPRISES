const express = require('express');
const router = express.Router();
const { registerFarmer, loginFarmer, getDashboardStats, addProduct, getMyProducts, deleteProduct } = require('../controllers/farmer.controller');
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/register', registerFarmer);
router.post('/login', loginFarmer);

// Protected Farmer Routes
router.get('/dashboard', authenticateUser, requireRoles(['FARMER']), getDashboardStats);
router.post('/products', authenticateUser, requireRoles(['FARMER']), upload.array('images', 5), addProduct);
router.get('/products/my', authenticateUser, requireRoles(['FARMER']), getMyProducts);
router.delete('/products/:id', authenticateUser, requireRoles(['FARMER']), deleteProduct);

module.exports = router;
