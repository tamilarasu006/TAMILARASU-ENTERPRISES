const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../services/emailService');

// Get all admins and pending invitations
const getAdmins = async (req, res) => {
  try {
    const activeAdmins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    const pendingInvitations = await prisma.adminInvitation.findMany({
      where: {
        acceptedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true
      }
    });

    const formattedActive = activeAdmins.map(admin => ({
      ...admin,
      status: 'ACTIVE',
      isInvitation: false
    }));

    const formattedInvitations = pendingInvitations.map(inv => {
      let status = 'PENDING';
      if (inv.revokedAt) status = 'REVOKED';
      else if (new Date() > inv.expiresAt) status = 'EXPIRED';

      return {
        id: inv.id,
        name: inv.name || 'Pending Admin',
        email: inv.email,
        role: inv.role,
        createdAt: inv.createdAt,
        status,
        isInvitation: true
      };
    });

    // Merge and sort by newest first
    const allAdmins = [...formattedActive, ...formattedInvitations].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ success: true, data: allAdmins });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch admins', error);
  }
};

// Delete an admin
const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting oneself
    if (id === req.user.id) {
       return res.status(400).json({ success: false, message: 'You cannot remove yourself' });
    }

    const admin = await prisma.user.findUnique({ where: { id } });
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
       return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (admin.role === 'SUPER_ADMIN') {
       return res.status(403).json({ success: false, message: 'Cannot remove a super admin' });
    }

    // Delete related OTP verifications to avoid foreign key constraint violations
    await prisma.oTPVerification.deleteMany({ where: { userId: id } });

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'Admin removed successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to remove admin', error);
  }
};

module.exports = {
  getAdmins,
  removeAdmin
};
