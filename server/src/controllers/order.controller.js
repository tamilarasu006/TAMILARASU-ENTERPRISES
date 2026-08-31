const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');

const generateOrderNumber = () => {
  return 'EXP-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000).toString();
};

const createOrder = async (req, res) => {
  const { items, shippingAddress, billingAddress, company, country, message, preferredDeliveryDate } = req.body;
  const userId = req.user.id;
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one order item is required.' });
  }

  try {
    console.log('[ORDER] B2B Inquiry received from user:', userId);
    
    // Calculate total amount from DB to prevent client-side price manipulation
    let calculatedTotal = 0;
    const orderItemsData = [];
    
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }
      if (!product.isActive || !product.isAvailable) {
        return res.status(400).json({ success: false, message: `${product.name} is no longer available for order.` });
      }
      if (product.minimumOrderQuantity > item.quantity) {
         return res.status(400).json({ success: false, message: `Minimum order quantity for ${product.name} is ${product.minimumOrderQuantity}` });
      }
      const subtotal = product.price * item.quantity;
      calculatedTotal += subtotal;
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal
      });
    }
    
    console.log('[ORDER] Total calculated on server:', calculatedTotal);

    // Database Transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          totalAmount: calculatedTotal,
          shippingAddress,
          billingAddress,
          company,
          country,
          message,
          preferredDeliveryDate,
          orderItems: {
            create: orderItemsData
          }
        },
        include: { orderItems: true, user: { select: { name: true, email: true } } }
      });
      
      return newOrder;
    });
    
    console.log('[ORDER] Created in DB:', order.orderNumber);
    
    // Notify admin via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('new_order', { orderNumber: order.orderNumber, customerName: order.user.name, company: order.company, totalAmount: order.totalAmount });
      console.log('[ORDER] Emitted socket notification to admins.');
    }
    
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    console.error('[ORDER] Error:', error.message);
    return errorResponse(res, 500, 'Unable to create order', error);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { orderItems: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch orders', error);
  }
};

const confirmOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    if (order.status !== 'QUOTED') {
      return res.status(400).json({ success: false, message: 'Only quoted orders can be confirmed.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' }
    });
    
    // Notify admin via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('order_confirmed', { orderNumber: order.orderNumber, status: 'CONFIRMED' });
    }

    res.json({ success: true, message: 'Order confirmed successfully', data: updatedOrder });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to confirm order', error);
  }
};

module.exports = { createOrder, getMyOrders, confirmOrder };