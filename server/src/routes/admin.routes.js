const express = require('express');
const router = express.Router();
const { getAdmins, removeAdmin } = require('../controllers/admin.controller');
const { createInvitation, validateInvitation, acceptInvitation, resendInvitation, revokeInvitation } = require('../controllers/invitation.controller');
const { authenticateUser, requireSuperAdmin } = require('../middleware/auth.middleware');

// Public endpoints
router.get('/invitations/validate', validateInvitation);
router.post('/invitations/accept', acceptInvitation);

// Protected endpoints
router.use(authenticateUser, requireSuperAdmin);

// Admin Management
router.get('/list', getAdmins);
router.delete('/:id', removeAdmin);

// Invitation Management
router.post('/invitations', createInvitation);
router.post('/invitations/:id/resend', resendInvitation);
router.post('/invitations/:id/revoke', revokeInvitation);

module.exports = router;
