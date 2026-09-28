const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');

// Generate unique quotation number
const generateQuotationNumber = async () => {
  const count = await prisma.quotation.count();
  return `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// ================= CUSTOMER APIs =================

// Create RFQ from Cart
const createQuotation = async (req, res) => {
  try {
    const { items, notes, incoterms, portOfDischarge } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items provided for quotation' });
    }

    // Validate products and calculate initial total based on listed price
    let totalAmount = 0;
    const quotationItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }
      
      const quantity = parseInt(item.quantity, 10);
      if (quantity < product.minimumOrderQuantity) {
        return res.status(400).json({ success: false, message: `Minimum order quantity for ${product.name} is ${product.minimumOrderQuantity}` });
      }

      // If priceOnRequest is true, we leave the unitPrice as 0 and it will be updated by sales admin
      const unitPrice = product.priceOnRequest ? 0 : product.price;
      const subtotal = unitPrice * quantity;
      
      totalAmount += subtotal;

      quotationItemsData.push({
        productId: product.id,
        quantity,
        unitPrice,
        subtotal
      });
    }

    const quotationNumber = await generateQuotationNumber();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        userId: req.user.id,
        status: 'DRAFT',
        totalAmount,
        notes,
        incoterms,
        portOfDischarge,
        items: {
          create: quotationItemsData
        },
        history: {
          create: {
            status: 'DRAFT',
            actorId: req.user.id,
            notes: 'RFQ created by customer'
          }
        }
      },
      include: {
        items: true,
        user: { select: { name: true } }
      }
    });

    const { createNotification } = require('./notification.controller');
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'SALES_ADMIN'] } } });
    for (const admin of admins) {
      await createNotification(admin.id, 'New RFQ Received', `Quotation ${quotationNumber} requested by ${quotation.user.name}.`, 'QUOTATION', `/admin/quotations/${quotation.id}`);
    }

    res.status(201).json({ success: true, message: 'Quotation request submitted successfully', data: quotation });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create quotation', error);
  }
};

// Customer view their own quotations
const getMyQuotations = async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: quotations });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch quotations', error);
  }
};

// Customer Accept Quotation -> Convert to Order
const acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quotation = await prisma.quotation.findFirst({
      where: { id, userId: req.user.id },
      include: { items: true }
    });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    if (quotation.status !== 'SENT' && quotation.status !== 'NEGOTIATION') {
      return res.status(400).json({ success: false, message: 'Quotation cannot be accepted in its current state' });
    }

    if (quotation.validUntil && new Date(quotation.validUntil) < new Date()) {
      return res.status(400).json({ success: false, message: 'Quotation has expired' });
    }

    // Begin transaction: Update quotation to ACCEPTED and create Order
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update quotation
      const updatedQuote = await tx.quotation.update({
        where: { id },
        data: { 
          status: 'ACCEPTED',
          history: {
            create: {
              status: 'ACCEPTED',
              actorId: req.user.id,
              notes: 'Customer accepted the quotation'
            }
          }
        }
      });

      // 2. Generate Order Number
      const orderCount = await tx.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

      // 3. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user.id,
          status: 'PENDING',
          totalAmount: updatedQuote.totalAmount,
          quotedAmount: updatedQuote.totalAmount, // Map quotation amount as quotedAmount
          internalNotes: `Generated from Quotation ${updatedQuote.quotationNumber}`,
          orderItems: {
            create: quotation.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.unitPrice,
              subtotal: item.subtotal
            }))
          },
          history: {
            create: {
              newStatus: 'PENDING',
              actorId: req.user.id,
              reason: 'Order automatically created from accepted quotation'
            }
          }
        }
      });

      return { updatedQuote, newOrder };
    });

    const { createNotification } = require('./notification.controller');
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'SALES_ADMIN'] } } });
    for (const admin of admins) {
      await createNotification(admin.id, 'Quotation Accepted', `Quotation ${quotation.quotationNumber} accepted. Order ${result.newOrder.orderNumber} created.`, 'ORDER', `/admin/orders/${result.newOrder.id}`);
    }

    res.json({ success: true, message: 'Quotation accepted and Order created', data: result.newOrder });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to accept quotation', error);
  }
};

// Customer Reject Quotation
const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const quotation = await prisma.quotation.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    
    await prisma.quotation.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        history: {
          create: {
            status: 'REJECTED',
            actorId: req.user.id,
            notes: notes || 'Rejected by customer'
          }
        }
      }
    });

    res.json({ success: true, message: 'Quotation rejected' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to reject quotation', error);
  }
};


// ================= ADMIN APIs =================

const getAllQuotations = async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { 
        user: { select: { name: true, email: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: quotations });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch quotations', error);
  }
};

const getQuotationById = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { 
        user: { select: { name: true, email: true, companyName: true, phone: true } },
        items: { include: { product: { select: { name: true, hsnCode: true } } } },
        history: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch quotation', error);
  }
};

// Admin updates quotation prices, freight, insurance, etc
const updateQuotationAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      items, 
      freight, 
      insurance, 
      taxes, 
      incoterms, 
      portOfLoading, 
      portOfDischarge, 
      paymentTerms, 
      notes,
      validUntil 
    } = req.body;
    
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    let newTotalAmount = (parseFloat(freight) || 0) + (parseFloat(insurance) || 0) + (parseFloat(taxes) || 0);

    // Using a transaction to update items safely
    await prisma.$transaction(async (tx) => {
      
      // Update each item
      if (items && items.length > 0) {
        for (const inputItem of items) {
          const existingItem = quotation.items.find(i => i.id === inputItem.id);
          if (existingItem) {
            const unitPrice = parseFloat(inputItem.unitPrice) || 0;
            const subtotal = unitPrice * existingItem.quantity;
            newTotalAmount += subtotal;
            
            await tx.quotationItem.update({
              where: { id: existingItem.id },
              data: { unitPrice, subtotal }
            });
          } else {
             newTotalAmount += existingItem.subtotal;
          }
        }
      } else {
        // If items not sent in request, compute existing item totals
        quotation.items.forEach(i => {
           newTotalAmount += i.subtotal;
        });
      }

      await tx.quotation.update({
        where: { id },
        data: {
          freight: parseFloat(freight) ?? quotation.freight,
          insurance: parseFloat(insurance) ?? quotation.insurance,
          taxes: parseFloat(taxes) ?? quotation.taxes,
          totalAmount: newTotalAmount,
          incoterms,
          portOfLoading,
          portOfDischarge,
          paymentTerms,
          notes,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'NEGOTIATION', // Moves to negotiation when admin edits
          history: {
            create: {
              status: 'NEGOTIATION',
              actorId: req.user.id,
              notes: 'Admin updated quotation details and pricing'
            }
          }
        }
      });
    });

    res.json({ success: true, message: 'Quotation updated successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update quotation', error);
  }
};

// Admin manually sends quotation (email trigger could go here)
const sendQuotationToCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: 'SENT',
        history: {
          create: {
            status: 'SENT',
            actorId: req.user.id,
            notes: 'Admin finalized and sent quotation to customer'
          }
        }
      }
    });

    const { createNotification } = require('./notification.controller');
    await createNotification(
      quotation.userId,
      'Quotation Sent',
      `Your quotation ${quotation.quotationNumber} has been priced and is ready for your review.`,
      'QUOTATION',
      `/quotations/${quotation.id}`
    );

    res.json({ success: true, message: 'Quotation marked as SENT' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to send quotation', error);
  }
};

// Admin manually reject (or cancel) quotation
const cancelQuotationAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    await prisma.quotation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        history: {
          create: {
            status: 'CANCELLED',
            actorId: req.user.id,
            notes: notes || 'Admin cancelled the quotation'
          }
        }
      }
    });
    res.json({ success: true, message: 'Quotation cancelled' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to cancel quotation', error);
  }
};

module.exports = {
  createQuotation,
  getMyQuotations,
  acceptQuotation,
  rejectQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotationAdmin,
  sendQuotationToCustomer,
  cancelQuotationAdmin
};
