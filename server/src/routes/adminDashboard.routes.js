const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminDashboard.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticateUser, requireAdmin);
router.get('/stats', getDashboardStats);

module.exports = router;
