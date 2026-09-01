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
      include: { user: { select: { name: true, email: true, phone: true } }, orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch orders', error);
  }
};

const VALID_STATUSES = ['PENDING', 'QUOTED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

// Transitions are not strictly enforced for admins to allow corrections

const updateOrderStatus = async (req, res) => {
  try {
    const { status, internalNotes, quotedAmount } = req.body;
    
    const updateData = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      }
      const current = await prisma.order.findUnique({ where: { id: req.params.id } });
      if (!current) return res.status(404).json({ success: false, message: 'Order not found' });


      updateData.status = status;
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