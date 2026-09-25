const { createInvoiceForOrder } = require('../services/invoice.service');
const { generateInvoicePDF, numberToWords } = require('../services/pdf.service');
const { sendEmail } = require('../services/emailService');
const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminUserId = req.user.id;

    const invoice = await createInvoiceForOrder(orderId, adminUserId);

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('[INVOICE] Generation Error:', error.message);
    if (error.message.includes('not found') || error.message.includes('already exists')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    return errorResponse(res, 500, 'Unable to generate invoice', error);
  }
};

const getInvoices = async (req, res) => {
  try {
    const { status, orderId, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch invoices', error);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        order: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Security: customers can only see their own invoices
    if (req.user.role === 'CUSTOMER' && invoice.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch invoice', error);
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'FINALIZED') return res.status(400).json({ success: false, message: 'Cannot edit a finalized invoice' });

    // Ensure we don't accidentally update read-only/sensitive fields directly through this generic update if we don't want to
    const allowedFields = [
      'preCarriage', 'placeOfReceipt', 'countryOfOrigin', 'countryOfDestination',
      'portOfLoading', 'portOfDischarge', 'vesselFlightNo', 'notifyParty',
      'incoterms', 'paymentTerms', 'taxTreatment', 'gstDeclaration',
      'fobValue', 'freight', 'insurance', 'totalCifValue', 'grandTotal', 'totalTax',
      'subtotal', 'currency'
    ];

    const data = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        data[key] = updateData[key];
      }
    }
    
    if (updateData.customerSnapshot) data.customerSnapshot = updateData.customerSnapshot;
    if (updateData.billingAddressSnapshot) data.billingAddressSnapshot = updateData.billingAddressSnapshot;
    if (updateData.shippingAddressSnapshot) data.shippingAddressSnapshot = updateData.shippingAddressSnapshot;
    if (updateData.companySnapshot) data.companySnapshot = updateData.companySnapshot;

    // Handle items if they are passed
    if (updateData.items && Array.isArray(updateData.items)) {
      // Simplest way is to delete old and recreate
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      data.items = {
        create: updateData.items.map(item => ({
          productId: item.productId,
          description: item.description,
          hsnSac: item.hsnSac,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          taxRate: parseFloat(item.taxRate) || 0,
          taxableAmount: parseFloat(item.taxableAmount) || 0,
          cgstAmount: parseFloat(item.cgstAmount) || 0,
          sgstAmount: parseFloat(item.sgstAmount) || 0,
          igstAmount: parseFloat(item.igstAmount) || 0,
          lineTotal: parseFloat(item.lineTotal) || 0,
        }))
      };
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data,
      include: { items: true, order: true, user: { select: { name: true, email: true } } }
    });

    res.json({ success: true, message: 'Invoice updated successfully', data: updated });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, 'Failed to update invoice', error);
  }
};

const finalizeInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'FINALIZED') {
      return res.status(400).json({ success: false, message: 'Invoice is already finalized' });
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot finalize a cancelled invoice' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        finalizedById: req.user.id,
      },
      include: { items: true, order: true }
    });

    res.json({ success: true, message: 'Invoice finalized successfully', data: updated });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to finalize invoice', error);
  }
};

const emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, order: true, user: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const recipientEmail = invoice.user?.email;
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'No email address found for this customer' });
    }

    // Generate PDF buffer in memory
    const { PassThrough } = require('stream');
    const chunks = [];
    await new Promise((resolve, reject) => {
      const pt = new PassThrough();
      pt.on('data', chunk => chunks.push(chunk));
      pt.on('end', () => resolve());
      pt.on('error', reject);
      
      generateInvoicePDF(invoice, pt).catch(reject);
    });

    const pdfBuffer = Buffer.concat(chunks);
    const co = invoice.companySnapshot || {};
    const filename = `TAMILARASU_ENTERPRISES_Invoice_${(invoice.invoiceNumber || '').replace(/\//g, '-')}.pdf`;

    // Send email with attachment via nodemailer
    const nodemailer = require('nodemailer');
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      return res.status(503).json({ success: false, message: 'Email service is not configured. Please set EMAIL_HOST, EMAIL_USERNAME, EMAIL_PASSWORD in server .env' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465',
      auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
    });

    const subject = `Commercial Invoice — ${co.name || 'TAMILARASU ENTERPRISES'} — ${invoice.invoiceNumber}`;
    const customerName = invoice.user?.name || 'Customer';

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"${co.name || 'TAMILARASU ENTERPRISES'}" <noreply@tamilarasu.com>`,
      to: recipientEmail,
      subject,
      html: `
        <p>Dear ${customerName},</p>
        <p>Please find attached your Commercial Invoice <strong>${invoice.invoiceNumber}</strong> from ${co.name || 'TAMILARASU ENTERPRISES'}.</p>
        <p>Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}<br/>
        Order No: ${invoice.order?.orderNumber || '—'}<br/>
        Amount: ${invoice.currency} ${(invoice.grandTotal || 0).toFixed(2)}</p>
        <p>For any queries, please contact us at ${co.email || process.env.EMAIL_USERNAME}.</p>
        <p>Thank you for your business.</p>
        <p>Warm regards,<br/>${co.authorizedSignatoryName || 'Team'}<br/>${co.name || 'TAMILARASU ENTERPRISES'}</p>
      `,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    res.json({ success: true, message: `Invoice emailed to ${recipientEmail}` });
  } catch (error) {
    console.error('[INVOICE] Email Error:', error.message);
    if (!res.headersSent) {
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        return res.status(503).json({ success: false, message: 'Email authentication failed. Check EMAIL_USERNAME and EMAIL_PASSWORD.' });
      }
      return errorResponse(res, 500, 'Failed to send invoice email', error);
    }
  }
};

const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, order: true, user: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'CUSTOMER' && invoice.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const action = req.query.action === 'preview' ? 'inline' : 'attachment';
    const filename = `TAMILARASU_ENTERPRISES_Invoice_${(invoice.invoiceNumber || '').replace(/\//g, '-')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${action}; filename="${filename}"`);

    await generateInvoicePDF(invoice, res);
  } catch (error) {
    console.error('[INVOICE] PDF Error:', error.message);
    if (!res.headersSent) {
      return errorResponse(res, 500, 'Failed to generate PDF', error);
    }
  }
};

const { generateInvoiceDOCX } = require('../services/docx.service');

const downloadInvoiceDOCX = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, order: true, user: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'CUSTOMER' && invoice.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await generateInvoiceDOCX(invoice, res);
  } catch (error) {
    console.error('[INVOICE] DOCX Error:', error.message);
    if (!res.headersSent) {
      return errorResponse(res, 500, 'Failed to generate DOCX', error);
    }
  }
};

const getMyInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      include: {
        order: { select: { orderNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch your invoices', error);
  }
};

module.exports = {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  finalizeInvoice,
  emailInvoice,
  downloadInvoicePDF,
  downloadInvoiceDOCX,
  getMyInvoices
};
