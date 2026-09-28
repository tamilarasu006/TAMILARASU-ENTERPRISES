const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');

const generateShipmentNumber = async () => {
  const count = await prisma.shipment.count();
  return `SHP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// ================= ADMIN APIs =================

const createShipment = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const shipmentNumber = await generateShipmentNumber();

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId,
        status: 'READY_TO_SHIP',
        events: {
          create: {
            status: 'READY_TO_SHIP',
            description: 'Shipment created and ready to be processed',
            location: 'Warehouse'
          }
        }
      },
      include: { events: true }
    });

    const { createNotification } = require('./notification.controller');
    await createNotification(
      order.userId,
      'Shipment Created',
      `Your order ${order.orderNumber} is ready to ship. Tracking No: ${shipmentNumber}`,
      'SHIPMENT',
      `/orders`
    );

    res.status(201).json({ success: true, message: 'Shipment created successfully', data: shipment });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create shipment', error);
  }
};

const getAllShipments = async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: { 
        order: { select: { orderNumber: true, user: { select: { name: true, companyName: true } } } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shipments });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch shipments', error);
  }
};

const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert dates if provided
    if (updateData.etd) updateData.etd = new Date(updateData.etd);
    if (updateData.eta) updateData.eta = new Date(updateData.eta);
    if (updateData.grossWeight) updateData.grossWeight = parseFloat(updateData.grossWeight);
    if (updateData.netWeight) updateData.netWeight = parseFloat(updateData.netWeight);
    if (updateData.packages) updateData.packages = parseInt(updateData.packages, 10);

    const shipment = await prisma.shipment.update({
      where: { id },
      data: updateData
    });
    res.json({ success: true, message: 'Shipment updated successfully', data: shipment });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update shipment', error);
  }
};

const addShipmentEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, description, eventDate } = req.body;

    const shipment = await prisma.shipment.findUnique({ where: { id }, include: { order: { select: { userId: true, orderNumber: true } } } });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const updated = await prisma.$transaction(async (tx) => {
      const event = await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: status || shipment.status,
          location,
          description,
          eventDate: eventDate ? new Date(eventDate) : new Date()
        }
      });

      // Update the parent shipment status to the latest event status
      if (status && status !== shipment.status) {
        await tx.shipment.update({
          where: { id },
          data: { status }
        });
      }

      return event;
    });

    const { createNotification } = require('./notification.controller');
    await createNotification(
      shipment.order.userId,
      'Shipment Update',
      `New tracking milestone for order ${shipment.order.orderNumber}: ${status || shipment.status} at ${location || 'unknown location'}.`,
      'SHIPMENT',
      `/orders`
    );

    res.status(201).json({ success: true, message: 'Tracking milestone added', data: updated });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to add tracking milestone', error);
  }
};

const addExportDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, url } = req.body;

    if (!type || !title || (!url && !req.file)) {
      return res.status(400).json({ success: false, message: 'Type, title, and document (file or url) are required' });
    }

    const documentUrl = req.file ? req.file.path : url;

    const document = await prisma.exportDocument.create({
      data: {
        shipmentId: id,
        type,
        title,
        url: documentUrl,
        uploadedBy: req.user.id
      }
    });

    res.status(201).json({ success: true, message: 'Export document attached successfully', data: document });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to attach export document', error);
  }
};

const deleteExportDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    await prisma.exportDocument.delete({ where: { id: documentId } });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete document', error);
  }
};

// ================= CUSTOMER APIs =================

const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        documents: true,
        order: { select: { userId: true, orderNumber: true } }
      }
    });

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    // Ensure customer is viewing their own shipment
    if (req.user.role === 'CUSTOMER' && shipment.order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this shipment' });
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch shipment details', error);
  }
};

const getMyShipments = async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where: { order: { userId: req.user.id } },
      include: { events: { orderBy: { eventDate: 'desc' }, take: 1 }, order: { select: { orderNumber: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shipments });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch shipments', error);
  }
};

module.exports = {
  createShipment,
  getAllShipments,
  updateShipment,
  addShipmentEvent,
  addExportDocument,
  deleteExportDocument,
  getShipmentById,
  getMyShipments
};
