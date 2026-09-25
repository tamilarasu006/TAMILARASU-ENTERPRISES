const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const axios = require('axios');

const generateInvoiceDOCX = async (invoice, res) => {
  try {
    const company = invoice.companySnapshot || {};
    const customer = invoice.customerSnapshot || {};
    const billingAddress = invoice.billingAddressSnapshot || {};
    const shippingAddress = invoice.shippingAddressSnapshot || {};

    let templateUrl = company.invoice_docx_template;

    if (!templateUrl) {
      // Fallback for older invoices that didn't snapshot the template
      const prisma = require('../prisma');
      const docxConfig = await prisma.siteConfig.findUnique({ where: { key: 'invoice_docx_template' } });
      if (docxConfig && docxConfig.value) {
        templateUrl = docxConfig.value;
      }
    }

    if (!templateUrl) {
      throw new Error("No DOCX template has been set in Invoice Settings.");
    }

    // 1. Download the DOCX template from the URL
    const response = await axios.get(templateUrl, { responseType: 'arraybuffer' });
    const content = Buffer.from(response.data, 'binary');

    // 2. Load the zip into PizZip
    const zip = new PizZip(content);

    // 3. Initialize Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 4. Prepare data for the template
    const dueDate = new Date(invoice.invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const rs = 'Rs.'; // Or ₹ if the font supports it

    // Map items for the table
    const items = invoice.items.map(item => ({
      description: item.description,
      qty: item.quantity.toString(),
      unit: 'Nos',
      rate: `${rs}${item.unitPrice.toFixed(2)}`,
      gst: `${item.taxRate}%`,
      amount: `${rs}${item.lineTotal.toFixed(2)}`
    }));

    const data = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB'),
      dueDate: dueDate.toLocaleDateString('en-GB'),
      
      // Company info
      companyName: company.name || 'TAMILARASU ENTERPRISES',
      companyAddress: company.address || '',
      companyCity: company.city || '',
      companyGstin: company.gstin ? `GSTIN: ${company.gstin}` : '',
      companyPhone: company.phone || '',
      companyEmail: company.email || '',

      // Customer info
      customerName: customer.name || 'Customer Name',
      customerAddress: billingAddress.address && billingAddress.address !== 'TBD' ? billingAddress.address : '',
      customerCity: billingAddress.city || '',
      customerState: billingAddress.state || '',
      customerZip: billingAddress.postalCode || '',
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',

      // Items array for {#items} ... {/items}
      items: items,

      // Totals
      subtotal: `${rs}${invoice.subtotal.toFixed(2)}`,
      grandTotal: `${rs}${invoice.grandTotal.toFixed(2)}`
    };

    // Calculate taxes for display
    const hasCgst = invoice.items.some(i => i.cgstAmount > 0);
    if (hasCgst) {
      let cgst = invoice.items.reduce((sum, item) => sum + item.cgstAmount, 0);
      let sgst = invoice.items.reduce((sum, item) => sum + item.sgstAmount, 0);
      data.taxLabel1 = `CGST`;
      data.taxAmount1 = `${rs}${cgst.toFixed(2)}`;
      data.taxLabel2 = `SGST`;
      data.taxAmount2 = `${rs}${sgst.toFixed(2)}`;
    } else if (invoice.totalTax > 0) {
      data.taxLabel1 = `IGST`;
      data.taxAmount1 = `${rs}${invoice.totalTax.toFixed(2)}`;
      data.taxLabel2 = '';
      data.taxAmount2 = '';
    } else {
      data.taxLabel1 = '';
      data.taxAmount1 = '';
      data.taxLabel2 = '';
      data.taxAmount2 = '';
    }

    // 5. Render the document
    doc.render(data);

    // 6. Generate buffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 7. Send the response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.docx`);
    res.send(buf);

  } catch (error) {
    console.error("Error generating DOCX:", error);
    res.status(500).json({ success: false, message: 'Failed to generate DOCX invoice. Make sure a valid template is uploaded.' });
  }
};

module.exports = { generateInvoiceDOCX };
