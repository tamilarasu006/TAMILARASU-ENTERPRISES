const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../prisma');
const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOTP = async (userId, userEmail, userPhone, channel) => {
  console.log(`[OTP] Initiating OTP send for user ${userId}, channel: ${channel}`);
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAttempts = await prisma.oTPVerification.count({
    where: {
      userId,
      channel,
      createdAt: { gte: oneHourAgo }
    }
  });

  if (recentAttempts >= 5) {
    console.warn(`[OTP] Rate limit exceeded for user ${userId} on channel ${channel}`);
    throw new Error('Maximum OTP requests exceeded. Please try again in an hour.');
  }

  await prisma.oTPVerification.deleteMany({
    where: {
      userId,
      channel,
      verifiedAt: null
    }
  });

  const otp = generateOTP();
  console.log(`[OTP] ${channel} OTP generated: ${otp}`);

  
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.oTPVerification.create({
    data: {
      userId,
      channel,
      otpHash,
      expiresAt
    }
  });
  console.log(`[OTP] ${channel} OTP stored successfully`);

  if (channel === 'EMAIL' || channel === 'RESET') {
    const action = channel === 'RESET' ? 'password reset' : 'verification';
    const subject = channel === 'RESET' ? 'Reset your TAMILARASU ENTERPRISES password' : 'Verify your TAMILARASU ENTERPRISES account';
    const text = `Hello,\n\nYour ${action} OTP is: ${otp}\n\nThis OTP expires in 5 minutes.\n\nIf you did not request this ${action}, ignore this email.\n\nRegards,\nTAMILARASU ENTERPRISES`;
    await sendEmail(userEmail, subject, text);
  }

  return true;
};

const verifyOTP = async (userId, channel, providedOtp) => {
  console.log(`[OTP] Verifying ${channel} OTP for user ${userId}`);
  
  const record = await prisma.oTPVerification.findFirst({
    where: {
      userId,
      channel,
      verifiedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    console.warn(`[OTP] No pending OTP found for user ${userId}, channel ${channel}`);
    throw new Error('No pending OTP found. Please request a new one.');
  }

  if (record.attempts >= 5) {
    console.warn(`[OTP] Max verification attempts exceeded for user ${userId}, channel ${channel}`);
    throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  if (record.expiresAt < new Date()) {
    console.warn(`[OTP] OTP expired for user ${userId}, channel ${channel}`);
    throw new Error('OTP has expired. Please request a new one.');
  }

  const isValid = await bcrypt.compare(providedOtp, record.otpHash);

  if (!isValid) {
    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 }
    });
    console.warn(`[OTP] Invalid OTP provided for user ${userId}, channel ${channel}`);
    throw new Error('Invalid OTP.');
  }

  await prisma.oTPVerification.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() }
  });
  
  console.log(`[OTP] ${channel} OTP successfully verified for user ${userId}`);
  return true;
};

module.exports = {
  sendOTP,
  verifyOTP
};
