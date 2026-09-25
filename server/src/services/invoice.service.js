const prisma = require('../prisma');

/**
 * Generates a concurrency-safe invoice number using a Prisma transaction.
 * Format: {prefix}/{financialYear}/{sequence:6digits}
 * Example: TE/2026-27/000001
 */
const generateInvoiceNumber = async (tx, prefix = 'TE') => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1–12
  const startYear = month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const endYearShort = ((startYear + 1) % 100).toString().padStart(2, '0');
  const financialYear = `${startYear}-${endYearShort}`;
  const numberPrefix = `${prefix}/${financialYear}/`;

  // Find the highest existing number with this prefix (within the transaction for locking)
  const lastInvoice = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: numberPrefix } },
    orderBy: { invoiceNumber: 'desc' },
  });

  let nextSequence = 1;
  if (lastInvoice) {
    const sequenceStr = lastInvoice.invoiceNumber.replace(numberPrefix, '');
    const sequenceNum = parseInt(sequenceStr, 10);
    if (!isNaN(sequenceNum)) {
      nextSequence = sequenceNum + 1;
    }
  }

  const paddedSequence = nextSequence.toString().padStart(6, '0');
  return `${numberPrefix}${paddedSequence}`;
};

/**
 * Creates a full commercial invoice for an order.
 * Uses a Prisma transaction to prevent duplicate invoice numbers.
 */
const createInvoiceForOrder = async (orderId, adminUserId) => {
  return await prisma.$transaction(async (tx) => {

    // 1. Fetch order with all required relations
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { product: true } },
        user: true,
        payment: true,
      }
    });

    if (!order) throw new Error('Order not found');

    // 2. Check for existing invoice
    const existingInvoice = await tx.invoice.findFirst({ where: { orderId } });
    if (existingInvoice) throw new Error(`Invoice already exists for this order (${existingInvoice.invoiceNumber})`);

    // 3. Get Invoice Settings
    let settings = await tx.invoiceSettings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = {
        companyName: 'TAMILARASU ENTERPRISES',
        businessType: 'Import • Export • Trading',
        defaultCurrency: 'INR',
        invoicePrefix: 'TE',
      };
    }

    // 4. Get additional site config (letterpad, docx template)
    const configs = await tx.siteConfig.findMany({
      where: { key: { in: ['invoice_letterpad', 'invoice_docx_template'] } }
    });
    const configMap = configs.reduce((acc, c) => { acc[c.key] = c.value; return acc; }, {});

    // 5. Build snapshots (immutable copy of data at time of invoice creation)
    const companySnapshot = {
      name:                          settings.companyName      || 'TAMILARASU ENTERPRISES',
      businessType:                  settings.businessType     || 'Import • Export • Trading',
      address:                       settings.address          || '',
      phone:                         settings.phone            || '',
      email:                         settings.email            || '',
      gstin:                         settings.gstin            || '',
      pan:                           settings.pan              || '',
      bankName:                      settings.bankName         || '',
      branch:                        settings.branch           || '',
      accountName:                   settings.accountName      || '',
      accountNumber:                 settings.accountNumber    || '',
      ifsc:                          settings.ifsc             || '',
      swiftBic:                      settings.swiftBic         || '',
      declarationText:               settings.declarationText  || '',
      gstExportDeclaration:          settings.gstExportDeclaration || '',
      authorizedSignatoryName:       settings.authorizedSignatoryName       || '',
      authorizedSignatoryDesignation: settings.authorizedSignatoryDesignation || '',
      defaultPaymentTerms:           settings.defaultPaymentTerms  || '',
      defaultIncoterms:              settings.defaultIncoterms     || '',
      footerText:                    settings.footerText       || '',
      logoUrl:                       settings.logoUrl          || '',
      invoice_letterpad:             configMap.invoice_letterpad    || '',
      invoice_docx_template:         configMap.invoice_docx_template || '',
    };

    const customerSnapshot = {
      name:    order.user.name,
      phone:   order.user.phone  || '',
      email:   order.user.email  || '',
      country: order.user.country || order.country || '',
      address: order.user.address || '',
      gstVat:  '', // can be added to User model later
    };

    const billingAddressSnapshot = {
      address: order.billingAddress || order.user.address || '',
      country: order.country || order.user.country || '',
    };

    const shippingAddressSnapshot = {
      address: order.shippingAddress || order.billingAddress || '',
      country: order.country || order.user.country || '',
    };

    // 6. Calculate invoice line items
    let subtotal = 0;
    let totalTax = 0;
    const invoiceItemsData = [];

    for (const item of order.orderItems) {
      const taxRate       = item.product.taxRate || 0;
      const quantity      = item.quantity;
      const unitPrice     = item.price;
      const taxableAmount = quantity * unitPrice;

      // For exports: use IGST. For domestic/default: split into CGST/SGST
      const isExport      = order.country && order.country.toLowerCase() !== 'india';
      const taxAmount     = (taxableAmount * taxRate) / 100;
      const igstAmount    = isExport ? taxAmount : 0;
      const cgstAmount    = isExport ? 0 : taxAmount / 2;
      const sgstAmount    = isExport ? 0 : taxAmount / 2;

      const lineTotal = taxableAmount + taxAmount;

      subtotal += taxableAmount;
      totalTax += taxAmount;

      invoiceItemsData.push({
        productId:    item.productId,
        description:  item.product.name,
        hsnSac:       item.product.hsnCode || '',
        quantity,
        unitPrice,
        taxRate,
        taxableAmount,
        igstAmount,
        cgstAmount,
        sgstAmount,
        lineTotal,
      });
    }

    const freight      = 0;
    const insurance    = 0;
    const fobValue     = subtotal; // FOB = value of goods before freight/insurance
    const totalCifValue = fobValue + freight + insurance;
    const grandTotal   = subtotal + totalTax + freight + insurance;
    const currency     = settings.defaultCurrency || 'INR';

    // Determine payment status from payment record
    const paymentStatus = order.payment?.paymentStatus || 'UNPAID';

    // 7. Generate concurrency-safe invoice number
    const invoiceNumber = await generateInvoiceNumber(tx, settings.invoicePrefix || 'TE');

    // 8. Create the invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId:          order.id,
        userId:           order.userId,
        status:           'ISSUED',
        currency,
        subtotal,
        taxableAmount:    subtotal,
        cgstAmount:       invoiceItemsData.reduce((s, i) => s + i.cgstAmount, 0),
        sgstAmount:       invoiceItemsData.reduce((s, i) => s + i.sgstAmount, 0),
        igstAmount:       invoiceItemsData.reduce((s, i) => s + i.igstAmount, 0),
        totalTax,
        freight,
        insurance,
        fobValue,
        totalCifValue,
        grandTotal,
        balanceDue:       grandTotal,
        paymentStatus,
        // Export shipping fields — populated from order if available
        countryOfOrigin:       'India',
        countryOfDestination:  order.country || null,
        incoterms:             settings.defaultIncoterms  || null,
        paymentTerms:          settings.defaultPaymentTerms || null,
        taxTreatment:          (order.country && order.country.toLowerCase() !== 'india')
                                 ? 'EXPORT_LUT'
                                 : 'DOMESTIC',
        gstDeclaration:        settings.gstExportDeclaration || null,
        // Snapshots
        companySnapshot,
        customerSnapshot,
        billingAddressSnapshot,
        shippingAddressSnapshot,
        items: { create: invoiceItemsData }
      },
      include: { items: true, order: true }
    });

    return invoice;
  }, {
    timeout: 30000,
    maxWait:  15000,
    isolationLevel: 'Serializable', // Prevents duplicate invoice numbers under concurrency
  });
};

module.exports = { createInvoiceForOrder };
