const express = require('express');
const router = express.Router();
const { submitContact, getContactMessages, markMessageRead, deleteMessage } = require('../controllers/contact.controller');
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');

// Public route for submitting contact form
router.post('/', submitContact);

// Admin routes for managing messages
router.get('/', authenticateUser, requireRoles(['SALES_ADMIN']), getContactMessages);
router.put('/:id/read', authenticateUser, requireRoles(['SALES_ADMIN']), markMessageRead);
router.delete('/:id', authenticateUser, requireRoles(['SALES_ADMIN']), deleteMessage);

module.exports = router;
