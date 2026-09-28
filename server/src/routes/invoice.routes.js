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
  getMyInvoices,
  logPayment
} = require('../controllers/invoice.controller');
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');

// ── Customer Routes ───────────────────────────────────────────────────────────
router.get('/my-invoices', authenticateUser, getMyInvoices);
router.get('/:id/pdf',     authenticateUser, downloadInvoicePDF);
router.get('/:id/docx',    authenticateUser, downloadInvoiceDOCX);
router.get('/:id',         authenticateUser, getInvoiceById);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.post('/order/:orderId/generate', authenticateUser, requireRoles(['ACCOUNTS_ADMIN']), generateInvoice);
router.put('/:id',                      authenticateUser, requireRoles(['ACCOUNTS_ADMIN']), updateInvoice);
router.post('/:id/finalize',            authenticateUser, requireRoles(['ACCOUNTS_ADMIN']), finalizeInvoice);
router.post('/:id/payment',             authenticateUser, requireRoles(['ACCOUNTS_ADMIN']), logPayment);
router.post('/:id/email',               authenticateUser, requireRoles(['ACCOUNTS_ADMIN', 'SALES_ADMIN']), emailInvoice);
router.get('/',                         authenticateUser, requireRoles(['ACCOUNTS_ADMIN', 'SALES_ADMIN', 'ORDER_ADMIN']), getInvoices);

module.exports = router;
