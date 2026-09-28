const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  googleAuth,
  firebasePhoneLogin,
  sendEmailOtp, 
  verifyEmailOtp, 
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  me,
  requestLoginOtp,
  loginWithOtp,
  sendMobileOtp,
  verifyMobileOtp,
  testEmail,
  testSms 
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleAuth);
router.post('/firebase/phone', firebasePhoneLogin);
router.post('/login/otp/request', requestLoginOtp);
router.post('/login/otp/verify', loginWithOtp);

router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);

router.post('/send-mobile-otp', sendMobileOtp);
router.post('/verify-mobile-otp', verifyMobileOtp);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

const { authenticateUser } = require('../middleware/auth.middleware');
router.post('/change-password', authenticateUser, changePassword);

router.get('/me', me);

router.post('/test-email', testEmail);
router.post('/test-sms', testSms);

module.exports = router;