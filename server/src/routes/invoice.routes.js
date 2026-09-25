const express = require('express');
const router = express.Router();
const { 
  generateInvoice, 
  getInvoices, 
  getInvoiceById,
  updateInvoice, 
  finalizeInvoice,
  emailInvoice,
  downloadInvoicePDF, 
  downloadInvoiceDOCX,
  getMyInvoices 
} = require('../controllers/invoice.controller');
const { authenticateUser, requireAdmin } = require('../middleware/auth.middleware');

// ── Customer Routes ───────────────────────────────────────────────────────────
router.get('/my-invoices', authenticateUser, getMyInvoices);
router.get('/:id/pdf',     authenticateUser, downloadInvoicePDF);
router.get('/:id/docx',    authenticateUser, downloadInvoiceDOCX);
router.get('/:id',         authenticateUser, getInvoiceById);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.post('/order/:orderId/generate', authenticateUser, requireAdmin, generateInvoice);
router.put('/:id',                      authenticateUser, requireAdmin, updateInvoice);
router.post('/:id/finalize',            authenticateUser, requireAdmin, finalizeInvoice);
router.post('/:id/email',               authenticateUser, requireAdmin, emailInvoice);
router.get('/',                         authenticateUser, requireAdmin, getInvoices);

module.exports = router;
