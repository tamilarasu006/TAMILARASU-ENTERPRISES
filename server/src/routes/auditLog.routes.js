const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLogFilters } = require('../controllers/auditLog.controller');
const { authenticateUser, requireSuperAdmin } = require('../middleware/auth.middleware');

router.use(authenticateUser, requireSuperAdmin);

router.get('/', getAuditLogs);
router.get('/filters', getAuditLogFilters);

module.exports = router;
