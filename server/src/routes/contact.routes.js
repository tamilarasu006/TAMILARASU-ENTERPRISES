const express = require('express');
const router = express.Router();
const { submitContact, getContactMessages, markMessageRead, deleteMessage } = require('../controllers/contact.controller');
const { authenticateUser, requireSuperAdmin } = require('../middleware/auth.middleware');

// Public route for submitting contact form
router.post('/', submitContact);

// Admin routes for managing messages
router.get('/', authenticateUser, requireSuperAdmin, getContactMessages);
router.put('/:id/read', authenticateUser, requireSuperAdmin, markMessageRead);
router.delete('/:id', authenticateUser, requireSuperAdmin, deleteMessage);

module.exports = router;
