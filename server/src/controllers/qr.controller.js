const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');

const scanOrderQR = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR Token is required' });
    }

    const order = await prisma.order.findUnique({
      where: { qrToken: token },
      include: {
        orderItems: { include: { product: true } },
        user: { select: { name: true, email: true, phone: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR code' });
    }

    if (!order.qrEnabled) {
      return res.status(403).json({ success: false, message: 'This QR code has been disabled' });
    }

    // Access Control: Admin can view any order. Customer can only view their own order.
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[QR] Error scanning QR:', error.message);
    return errorResponse(res, 500, 'Failed to scan QR code', error);
  }
};

module.exports = { scanOrderQR };
