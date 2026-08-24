const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, confirmOrder } = require('../controllers/order.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/', authenticateUser, createOrder);
router.get('/my-orders', authenticateUser, getMyOrders);
router.put('/:id/confirm', authenticateUser, confirmOrder);

module.exports = router;