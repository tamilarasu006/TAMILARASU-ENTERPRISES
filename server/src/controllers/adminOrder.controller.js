const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');

const getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true } }, orderItems: { include: { product: true } }, invoices: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch orders', error);
  }
};

const VALID_STATUSES = ['PENDING', 'QUOTED', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

// Transitions are not strictly enforced for admins to allow corrections

const updateOrderStatus = async (req, res) => {
  try {
    const { status, internalNotes, quotedAmount, reason } = req.body;
    
    const updateData = {};
    const current = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status && status !== current.status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      }

      updateData.status = status;
      updateData.history = {
        create: {
          oldStatus: current.status,
          newStatus: status,
          reason: reason || 'Admin updated order status',
          actorId: req.user.id
        }
      };
    }
    
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    
    if (quotedAmount !== undefined) {
      if (quotedAmount === '' || quotedAmount === null) {
        updateData.quotedAmount = null;
      } else {
        updateData.quotedAmount = parseFloat(quotedAmount);
      }
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, message: 'Order updated', data: order });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update order', error);
  }
};

module.exports = { getAllOrders, updateOrderStatus };