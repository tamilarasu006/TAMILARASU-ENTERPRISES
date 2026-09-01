const errorResponse = require('../utils/errorResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

// Registration
const register = async (req, res) => {
  try {
    console.log(`[AUTH] Registration started`);
    let { name, email, password, phone } = req.body;
    
    // Normalize
    email = email?.toLowerCase().trim();
    phone = phone?.trim();

    // Check duplicate
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ success: false, message: 'Email already exists' });
      if (existingUser.phone === phone) return res.status(400).json({ success: false, message: 'Mobile number already exists' });
    }
    
    console.log(`[AUTH] User validation successful for ${email}`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, emailVerified: false }
    });
    
    res.status(201).json({ success: true, message: 'Registration successful. Please verify your account.' });
  } catch (error) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('email')) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      if (target.includes('phone')) {
         return res.status(400).json({ success: false, message: 'Mobile number already exists' });
      }
      return res.status(400).json({ success: false, message: 'Account already exists' });
    }
    return errorResponse(res, 500, 'Registration failed', error);
  }
};

// Login
const login = async (req, res) => {
  try {
    let { email, password } = req.body; // 'email' field can be email or phone
    const identifier = email?.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid email/mobile number or password.' });
    
    // If admin, bypass strict customer verification
    if (user.role === 'ADMIN') {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ success: true, message: 'Login successful', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token } });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid email/mobile number or password.' });
    
    // Check verification status for customers
    if (!user.emailVerified) {
       return res.status(403).json({ 
         success: false, 
         message: 'Please verify your email before logging in.', 
         code: 'UNVERIFIED_ACCOUNT',
         data: { email: user.email, phone: user.phone, emailVerified: user.emailVerified }
       });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, message: 'Login successful', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token } });
  } catch (error) {
    return errorResponse(res, 500, 'Login failed', error);
  }
};

// Logout 
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// Send Email OTP
const sendEmailOtp = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    if (user.emailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    await sendOTP(user.id, user.email, user.phone, 'EMAIL');
    res.json({ success: true, message: 'OTP sent to email successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

// Verify Email OTP
const verifyEmailOtp = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    await verifyOTP(user.id, 'EMAIL', otp);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() }
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const identifier = email?.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] }
    });

    if (user) {
      await sendOTP(user.id, user.email, user.phone, 'RESET');
    }
    res.json({ success: true, message: 'If an account exists for the provided information, verification instructions have been sent.' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to process request', error);
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const identifier = email?.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] }
    });
    
    if (!user) return res.status(400).json({ success: false, message: 'Invalid request' });
    
    await verifyOTP(user.id, 'RESET', otp);
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const identifier = email?.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid request' });

    const record = await prisma.oTPVerification.findFirst({
      where: { userId: user.id, channel: 'RESET' },
      orderBy: { createdAt: 'desc' }
    });

    if (!record || !record.verifiedAt) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Please verify OTP first.' });
    }

    // Re-check the OTP itself, not just "was verified at some point"
    const isValid = await bcrypt.compare(otp || '', record.otpHash);
    if (!isValid) {
      return res.status(403).json({ success: false, message: 'Invalid OTP.' });
    }

    // Verified state must be fresh (used within 10 minutes of verification)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (record.verifiedAt < tenMinutesAgo) {
      await prisma.oTPVerification.delete({ where: { id: record.id } });
      return res.status(403).json({ success: false, message: 'Verification expired. Please request a new OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    await prisma.oTPVerification.delete({ where: { id: record.id } });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Test Endpoints
const testEmail = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }
    const { email } = req.body;
    await sendEmail(email, "Test Email from TAMILARASU ENTERPRISES", "This is a diagnostic test email.");
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

const testSms = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not available in production' });
    }
    const { phone } = req.body;
    await sendSMS(phone, "This is a diagnostic test SMS from TAMILARASU ENTERPRISES.");
    res.json({ success: true, message: 'Test SMS sent successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

module.exports = { 
  register, 
  login, 
  logout, 
  sendEmailOtp, 
  verifyEmailOtp, 
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  me,
  testEmail,
  testSms
};