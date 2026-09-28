const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.get('/', authenticateUser, getMyNotifications);
router.put('/read-all', authenticateUser, markAllAsRead);
router.put('/:id/read', authenticateUser, markAsRead);

module.exports = router;
