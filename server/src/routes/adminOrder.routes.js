const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/adminOrder.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticateUser, requireAdmin);
router.get('/', getAllOrders);
router.put('/:id', updateOrderStatus);

module.exports = router;