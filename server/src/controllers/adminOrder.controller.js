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
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, internalNotes, quotedAmount } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
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
    res.status(500).json({ success: false, message: 'Failed to update order', error: error.message });
  }
};

module.exports = { getAllOrders, updateOrderStatus };