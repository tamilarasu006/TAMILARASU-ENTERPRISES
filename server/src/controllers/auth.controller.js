const errorResponse = require('../utils/errorResponse');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Registration
const register = async (req, res) => {
  try {
    console.log(`[AUTH] Registration started`);
    let { name, email, password, phone, country, companyName } = req.body;
    
    // Normalize
    email = email?.toLowerCase().trim();
    phone = phone?.trim();
    country = country?.trim();
    companyName = companyName?.trim();

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
      data: { name, email, password: hashedPassword, phone, country, companyName, emailVerified: false }
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
    const { email, phone, password } = req.body;
    
    // Determine if input is email or phone
    const identifier = email?.toLowerCase().trim() || phone?.trim();
    
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid email/mobile number or password.' });
    
    // If admin, bypass strict customer verification
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role.endsWith('_ADMIN')) {
      if (!user.password) return res.status(400).json({ success: false, message: 'Invalid credentials' });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ success: true, message: 'Login successful', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token } });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Please use "Continue with Google" to log in.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid email/mobile number or password.' });
    
    // Check verification status for customers
    if (!user.emailVerified) {
      const { sendOTP } = require('../services/otpService');
      
      await sendOTP(user.id, user.email, user.phone, 'EMAIL');
      
      
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email to continue. A new verification code has been sent.',
        requiresVerification: true,
        userId: user.id,
        email: user.email
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  } catch (error) {
    console.error('[AUTH] Login Error:', error);
    return errorResponse(res, 500, 'Login failed', error);
  }
};

// Logout 
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// Google Auth
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Google credential missing' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, name, sub: googleId, email_verified } = payload;
    const identifier = email.toLowerCase().trim();

    if (!email_verified) {
      return res.status(403).json({ success: false, message: 'Google email is not verified' });
    }

    let user = await prisma.user.findUnique({ where: { email: identifier } });

    if (user) {
      // Don't allow admins to login via Google customer portal
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role.endsWith('_ADMIN')) {
        return res.status(403).json({ success: false, message: 'Admin accounts cannot login via Google' });
      }
      
      // Link account safely if not linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerified: true }
        });
      }
    } else {
      // Create new user (password is null)
      user = await prisma.user.create({
        data: {
          name,
          email: identifier,
          googleId,
          authProvider: 'GOOGLE',
          emailVerified: true
        }
      });
    }

    // Generate token matching normal login
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, message: 'Login successful', data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token } });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return errorResponse(res, 500, 'Google authentication failed', error);
  }
};

const admin = require('../config/firebaseAdmin');

// Firebase Phone Login
const firebasePhoneLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Firebase ID token is required' });

    if (!admin) {
      return res.status(500).json({ success: false, message: 'Firebase Admin not configured on server' });
    }

    // Verify ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number } = decodedToken;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'No phone number found in Firebase token' });
    }

    // Find or create user
    // We lookup by firebaseUid first, then phone
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: uid },
          { phone: phone_number }
        ]
      }
    });

    if (user) {
      // User exists. Link firebaseUid if missing and ensure phoneVerified is true
      if (user.firebaseUid !== uid || !user.phoneVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: uid, phoneVerified: true }
        });
      }
      
      // DO NOT GRANT ADMIN via phone login if they don't have it
      // Proceed with normal login
    } else {
      // Create new customer account
      user = await prisma.user.create({
        data: {
          name: `User ${phone_number.slice(-4)}`,
          phone: phone_number,
          email: `${uid}@temp.tamilarasu.com`, // Temp email to bypass unique constraint if needed
          firebaseUid: uid,
          phoneVerified: true,
          authProvider: 'FIREBASE',
          role: 'CUSTOMER'
        }
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Mobile login successful',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
        token
      }
    });

  } catch (error) {
    console.error('Firebase Auth Error:', error);
    return errorResponse(res, 401, 'Firebase authentication failed', error);
  }
};


// Request Login OTP
const requestLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    const user = await prisma.user.findFirst({ where: { phone: phone.trim() } });
    if (!user) return res.status(400).json({ success: false, message: 'No account found with this mobile number' });

    await sendOTP(user.id, user.email, user.phone, 'MOBILE_LOGIN');
    res.json({ success: true, message: 'Login OTP sent successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to send login OTP', error);
  }
};

// Login with OTP
const loginWithOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    const user = await prisma.user.findFirst({ where: { phone: phone.trim() } });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    await verifyOTP(user.id, 'MOBILE_LOGIN', otp);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  } catch (error) {
    return errorResponse(res, 400, error.message || 'Login failed', error);
  }
};

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

// Send Mobile OTP
const sendMobileOtp = async (req, res) => {
  try {
    const phone = req.body.phone?.trim();
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    if (user.phoneVerified) return res.status(400).json({ success: false, message: 'Mobile already verified' });

    await sendOTP(user.id, user.email, user.phone, 'MOBILE');
    res.json({ success: true, message: 'OTP sent to mobile successfully' });
  } catch (error) {
    return errorResponse(res, 400, error.message || 'Failed to send Mobile OTP', error);
  }
};

// Verify Mobile OTP
const verifyMobileOtp = async (req, res) => {
  try {
    const phone = req.body.phone?.trim();
    const { otp } = req.body;
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    await verifyOTP(user.id, 'MOBILE', otp);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true }
    });

    res.json({ success: true, message: 'Mobile verified successfully' });
  } catch (error) {
    return errorResponse(res, 400, error.message || 'Failed to verify Mobile OTP', error);
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

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.password) {
      if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password is required' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: user.password ? 'Password changed successfully' : 'Password set successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update password', error);
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
};