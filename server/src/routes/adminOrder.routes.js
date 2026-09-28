const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/adminOrder.controller');
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);
router.get('/', requireRoles(['ORDER_ADMIN', 'SALES_ADMIN', 'ACCOUNTS_ADMIN', 'SHIPPING_ADMIN']), getAllOrders);
router.put('/:id', requireRoles(['ORDER_ADMIN']), updateOrderStatus);

module.exports = router;