const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');
const { sendEmail } = require('../services/emailService');

const ADMIN_FRONTEND_URL = process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173';
const EXPIRY_HOURS = parseInt(process.env.ADMIN_INVITATION_EXPIRY_HOURS || '72', 10);

// Helper: Hash a token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Create a new admin invitation
const createInvitation = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const identifier = email?.toLowerCase().trim();

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const assignedRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: identifier }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // 2. Revoke any existing active invitations for this email
    await prisma.adminInvitation.updateMany({
      where: {
        email: identifier,
        revokedAt: null,
        acceptedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    // 3. Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

    // 4. Save to DB
    const invitation = await prisma.adminInvitation.create({
      data: {
        name,
        email: identifier,
        role: assignedRole,
        tokenHash,
        expiresAt,
        invitedById: req.user.id
      }
    });

    // 5. Send email
    const inviteLink = `${ADMIN_FRONTEND_URL}/admin/accept-invite?token=${rawToken}`;
    const subject = 'You’re invited to join TAMILARASU ENTERPRISES Admin Portal';
    
    // Explicit format requested by user
    const text = `TAMILARASU ENTERPRISES\n\nHello ${name || 'there'},\n\nYou have been invited by the Super Admin to join the TAMILARASU ENTERPRISES Admin Portal.\n\nYour account details:\n\nEmail: ${identifier}\nRole: ${assignedRole}\n\nClick the button below to accept your invitation and create your password.\n\n[ JOIN ADMIN PORTAL ]\n${inviteLink}\n\nInvitation expires in ${EXPIRY_HOURS} hours.\n\nIf you did not expect this invitation, you can safely ignore this email.\n\nRegards,\nTAMILARASU ENTERPRISES\nAdmin Team`;

    await sendEmail(identifier, subject, text);

    res.status(201).json({
      success: true,
      message: 'Admin invitation sent successfully'
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create invitation', error);
  }
};

// Validate invitation token
const validateInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const tokenHash = hashToken(token);

    const invitation = await prisma.adminInvitation.findUnique({
      where: { tokenHash }
    });

    if (!invitation) {
      return res.status(404).json({ valid: false, message: 'This invitation is invalid or expired.' });
    }

    if (invitation.revokedAt) {
      return res.status(400).json({ valid: false, message: 'This invitation has been revoked by the Super Admin.' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ valid: false, message: 'This invitation has already been accepted.' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ valid: false, message: 'This invitation has expired. Please ask the Super Admin to send a new invitation.' });
    }

    res.json({
      valid: true,
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to validate invitation', error);
  }
};

// Accept invitation and create password
const acceptInvitation = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Token, password, and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const tokenHash = hashToken(token);

    const invitation = await prisma.adminInvitation.findUnique({
      where: { tokenHash }
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'This invitation is invalid or expired.' });
    }

    if (invitation.revokedAt) {
      return res.status(400).json({ success: false, message: 'This invitation has been revoked by the Super Admin.' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ success: false, message: 'This invitation has already been accepted.' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ success: false, message: 'This invitation has expired. Please ask the Super Admin to send a new invitation.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Mark invitation accepted
      await tx.adminInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      });

      // 2. Check if an unactivated user exists
      let user = await tx.user.findUnique({
        where: { email: invitation.email }
      });

      if (user) {
        // Activate existing user safely
        await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            emailVerified: true,
            emailVerifiedAt: new Date(),
            role: invitation.role,
            name: user.name || invitation.name
          }
        });
      } else {
        // Create new user
        await tx.user.create({
          data: {
            name: invitation.name || 'Admin User',
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role,
            authProvider: 'LOCAL',
            emailVerified: true,
            emailVerifiedAt: new Date()
          }
        });
      }
    });

    res.json({ success: true, message: 'Your admin account has been activated successfully.' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to accept invitation', error);
  }
};

// Resend invitation
const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const oldInvitation = await prisma.adminInvitation.findUnique({
      where: { id }
    });

    if (!oldInvitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (oldInvitation.acceptedAt) {
      return res.status(400).json({ success: false, message: 'Cannot resend an already accepted invitation' });
    }

    // Revoke old invitation
    await prisma.adminInvitation.update({
      where: { id },
      data: { revokedAt: new Date() }
    });

    // Create new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

    // Create new invitation record
    const newInvitation = await prisma.adminInvitation.create({
      data: {
        name: oldInvitation.name,
        email: oldInvitation.email,
        role: oldInvitation.role,
        tokenHash,
        expiresAt,
        invitedById: req.user.id
      }
    });

    // Send email
    const inviteLink = `${ADMIN_FRONTEND_URL}/admin/accept-invite?token=${rawToken}`;
    const subject = 'You’re invited to join TAMILARASU ENTERPRISES Admin Portal';
    
    const text = `TAMILARASU ENTERPRISES\n\nHello ${oldInvitation.name || 'there'},\n\nYou have been invited by the Super Admin to join the TAMILARASU ENTERPRISES Admin Portal.\n\nYour account details:\n\nEmail: ${oldInvitation.email}\nRole: ${oldInvitation.role}\n\nClick the button below to accept your invitation and create your password.\n\n[ JOIN ADMIN PORTAL ]\n${inviteLink}\n\nInvitation expires in ${EXPIRY_HOURS} hours.\n\nIf you did not expect this invitation, you can safely ignore this email.\n\nRegards,\nTAMILARASU ENTERPRISES\nAdmin Team`;

    await sendEmail(oldInvitation.email, subject, text);

    res.json({ success: true, message: 'Invitation resent successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to resend invitation', error);
  }
};

// Revoke invitation
const revokeInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.adminInvitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ success: false, message: 'Cannot revoke an accepted invitation' });
    }

    await prisma.adminInvitation.update({
      where: { id },
      data: { revokedAt: new Date() }
    });

    res.json({ success: true, message: 'Invitation revoked successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to revoke invitation', error);
  }
};

module.exports = {
  createInvitation,
  validateInvitation,
  acceptInvitation,
  resendInvitation,
  revokeInvitation
};
