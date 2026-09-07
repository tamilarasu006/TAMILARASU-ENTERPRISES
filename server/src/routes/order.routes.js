const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, confirmOrder } = require('../controllers/order.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

const { scanOrderQR } = require('../controllers/qr.controller');

router.post('/', authenticateUser, createOrder);
router.get('/my-orders', authenticateUser, getMyOrders);
router.put('/:id/confirm', authenticateUser, confirmOrder);
router.get('/qr/:token', authenticateUser, scanOrderQR);

module.exports = router;