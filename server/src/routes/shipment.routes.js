const express = require('express');
const router = express.Router();
const { authenticateUser, requireRoles } = require('../middleware/auth.middleware');
const uploadDocument = require('../middleware/uploadDocument.middleware');
const {
  createShipment,
  getAllShipments,
  updateShipment,
  addShipmentEvent,
  addExportDocument,
  deleteExportDocument,
  getShipmentById,
  getMyShipments
} = require('../controllers/shipment.controller');

// ================= CUSTOMER ROUTES =================
router.use(authenticateUser);

router.get('/my-shipments', getMyShipments);
router.get('/:id', getShipmentById);

// ================= ADMIN ROUTES =================
const requireShippingAdmin = requireRoles(['SHIPPING_ADMIN', 'ORDER_ADMIN', 'SALES_ADMIN']);

router.post('/admin', requireShippingAdmin, createShipment);
router.get('/admin/list', requireShippingAdmin, getAllShipments);
router.put('/admin/:id', requireShippingAdmin, updateShipment);
router.post('/admin/:id/events', requireShippingAdmin, addShipmentEvent);
router.post('/admin/:id/documents', requireShippingAdmin, uploadDocument.single('document'), addExportDocument);
router.delete('/admin/documents/:documentId', requireShippingAdmin, deleteExportDocument);

module.exports = router;
