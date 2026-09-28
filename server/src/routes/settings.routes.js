const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getInvoiceSettings, updateInvoiceSettings } = require('../controllers/settings.controller');
const { authenticateUser, requireSuperAdmin, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', authenticateUser, requireSuperAdmin, getSettings);
router.post('/', authenticateUser, requireSuperAdmin, updateSettings);

router.get('/invoice', authenticateUser, requireSuperAdmin, getInvoiceSettings);
router.put('/invoice', authenticateUser, requireSuperAdmin, updateInvoiceSettings);

const upload = require('../middleware/upload.middleware');
router.post('/upload', authenticateUser, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ success: true, url: req.file.path });
});

const uploadDocx = require('../middleware/uploadDocx.middleware');
router.post('/upload/docx', authenticateUser, requireAdmin, uploadDocx.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No DOCX file uploaded' });
  }
  res.json({ success: true, url: req.file.path });
});

module.exports = router;
