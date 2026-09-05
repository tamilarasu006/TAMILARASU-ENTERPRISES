const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

// All profile routes require authentication
router.use(authenticateUser);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

router.post('/change-email/request', profileController.requestEmailChange);
router.post('/change-email/verify', profileController.verifyEmailChange);

router.post('/change-phone/request', profileController.requestPhoneChange);
router.post('/change-phone/verify', profileController.verifyPhoneChange);

module.exports = router;
