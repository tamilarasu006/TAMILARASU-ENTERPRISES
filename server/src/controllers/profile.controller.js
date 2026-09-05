const prisma = require('../prisma');
const { sendOTP, verifyOTP } = require('../services/otpService');
const errorResponse = require('../utils/errorResponse');

// Helper to calculate profile completion
const calculateProfileCompletion = (user) => {
  let score = 0;
  if (user.name) score += 10;
  if (user.email) score += 10;
  if (user.emailVerified) score += 10;
  if (user.phone) score += 10;
  if (user.phoneVerified) score += 10;
  if (user.profileImage) score += 10;
  if (user.address) score += 10;
  if (user.city) score += 10;
  if (user.state) score += 5;
  if (user.country) score += 5;
  if (user.postalCode) score += 10;

  // Max score is exactly 100 based on these fields
  return Math.min(100, score);
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const completion = calculateProfileCompletion(user);

    // Remove sensitive data
    delete user.password;
    delete user.otpVerifications;

    res.json({
      success: true,
      data: {
        ...user,
        completion
      }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch profile', error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, companyName, address, city, state, country, postalCode } = req.body;
    
    // We do NOT allow updating email or phone directly here
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        companyName,
        address,
        city,
        state,
        country,
        postalCode
      }
    });

    delete updatedUser.password;
    const completion = calculateProfileCompletion(updatedUser);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...updatedUser,
        completion
      }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update profile', error);
  }
};

exports.requestEmailChange = async (req, res) => {
  try {
    let { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, message: 'New email is required' });
    
    newEmail = newEmail.toLowerCase().trim();

    // Check if new email is already in use by someone else
    const existingUser = await prisma.user.findFirst({
      where: { email: newEmail }
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }

    // Save pending email
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pendingEmail: newEmail }
    });

    // Send OTP to the NEW email
    await sendOTP(req.user.id, newEmail, null, 'EMAIL');

    res.json({ success: true, message: 'OTP sent to your new email address.' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to request email change', error);
  }
};

exports.verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.pendingEmail) {
      return res.status(400).json({ success: false, message: 'No pending email change request found.' });
    }

    // Verify OTP
    await verifyOTP(user.id, 'EMAIL', otp);

    // Update email
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        pendingEmail: null
      }
    });

    delete updatedUser.password;
    res.json({ success: true, message: 'Email updated successfully', data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};

exports.requestPhoneChange = async (req, res) => {
  try {
    let { newPhone } = req.body;
    if (!newPhone) return res.status(400).json({ success: false, message: 'New mobile number is required' });
    
    newPhone = newPhone.trim();

    // Check if phone is already in use
    const existingUser = await prisma.user.findFirst({
      where: { phone: newPhone }
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ success: false, message: 'This mobile number is already in use.' });
    }

    // Send OTP to new phone via SMS
    await sendOTP(req.user.id, null, newPhone, 'MOBILE');

    res.json({ success: true, message: 'OTP sent to your new mobile number.' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to request phone change', error);
  }
};

exports.verifyPhoneChange = async (req, res) => {
  try {
    const { otp, newPhone } = req.body;
    if (!otp || !newPhone) return res.status(400).json({ success: false, message: 'OTP and new mobile number are required' });

    // Verify OTP
    await verifyOTP(req.user.id, 'MOBILE', otp);

    // Update phone
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        phone: newPhone.trim(),
        phoneVerified: true
      }
    });

    delete updatedUser.password;
    res.json({ success: true, message: 'Mobile number updated successfully', data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, code: error.code });
  }
};
