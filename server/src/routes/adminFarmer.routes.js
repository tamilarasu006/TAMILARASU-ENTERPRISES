const express = require('express');
const router = express.Router();
const { getAllFarmerProducts, updateFarmerProductStatus } = require('../controllers/adminFarmer.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticateUser, requireAdmin);

router.get('/products', getAllFarmerProducts);
router.patch('/products/:id/status', updateFarmerProductStatus);

module.exports = router;
