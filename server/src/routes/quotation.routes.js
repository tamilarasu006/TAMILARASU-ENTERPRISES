const express = require('express');
const router = express.Router();
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');
const {
  createQuotation,
  getMyQuotations,
  acceptQuotation,
  rejectQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotationAdmin,
  sendQuotationToCustomer,
  cancelQuotationAdmin
} = require('../controllers/quotation.controller');

// ================= CUSTOMER ROUTES =================
router.use(authenticateUser);

router.post('/', createQuotation);
router.get('/my-quotations', getMyQuotations);
router.post('/:id/accept', acceptQuotation);
router.post('/:id/reject', rejectQuotation);

// ================= ADMIN ROUTES =================
// Only SALES_ADMIN (and SUPER_ADMIN implicitly) can manage quotations
const requireSalesAdmin = requireRoles(['SALES_ADMIN']);

router.get('/admin/list', requireSalesAdmin, getAllQuotations);
router.get('/admin/:id', requireSalesAdmin, getQuotationById);
router.put('/admin/:id', requireSalesAdmin, updateQuotationAdmin);
router.post('/admin/:id/send', requireSalesAdmin, sendQuotationToCustomer);
router.post('/admin/:id/cancel', requireSalesAdmin, cancelQuotationAdmin);

module.exports = router;
