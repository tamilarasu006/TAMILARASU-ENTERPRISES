const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const authenticateUser = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token && req.query.token) {
      token = req.query.token;
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Super Admin access required' });
  }
};

module.exports = { authenticateUser, requireAdmin, requireSuperAdmin };