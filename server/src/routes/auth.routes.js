const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  sendEmailOtp, 
  verifyEmailOtp, 
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  me,
  testEmail,
  testSms 
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);


router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

const { authenticateUser } = require('../middleware/auth.middleware');
router.post('/change-password', authenticateUser, changePassword);

router.get('/me', me);

router.post('/test-email', testEmail);
router.post('/test-sms', testSms);

module.exports = router;