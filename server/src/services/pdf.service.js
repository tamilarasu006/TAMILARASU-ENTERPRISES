/**
 * pdf.service.js
 * Generates a Commercial Invoice PDF matching Commercial_Invoice_TE.docx layout.
 * Sections: Header → Seller → Buyer → Consignee → Shipping → Terms →
 *           Items Table → Financial Summary → Bank Details →
 *           GST Declaration → Legal Declaration → Footer
 */
const PDFDocument = require('pdfkit-table');
const path = require('path');
const axios = require('axios');

// ─── Utilities ────────────────────────────────────────────────────────────────

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function chunkToWords(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + chunkToWords(n % 100) : '');
}

function numberToWords(amount, currency = 'INR') {
  if (!amount || isNaN(amount)) return 'Zero Only';
  const n = Math.round(amount);
  if (n === 0) return 'Zero Only';

  // Indian numbering system for INR
  if (currency === 'INR') {
    const crore = Math.floor(n / 10000000);
    const lakh  = Math.floor((n % 10000000) / 100000);
    const thou  = Math.floor((n % 100000) / 1000);
    const rest  = n % 1000;
    let words = '';
    if (crore) words += chunkToWords(crore) + ' Crore ';
    if (lakh)  words += chunkToWords(lakh)  + ' Lakh ';
    if (thou)  words += chunkToWords(thou)  + ' Thousand ';
    if (rest)  words += chunkToWords(rest);
    return 'Rupees ' + words.trim() + ' Only';
  }

  // Generic for USD / other
  const billions  = Math.floor(n / 1000000000);
  const millions  = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const units     = n % 1000;
  let words = '';
  if (billions)  words += chunkToWords(billions)  + ' Billion ';
  if (millions)  words += chunkToWords(millions)  + ' Million ';
  if (thousands) words += chunkToWords(thousands) + ' Thousand ';
  if (units)     words += chunkToWords(units);
  const label = currency === 'USD' ? 'US Dollars' : currency;
  return label + ' ' + words.trim() + ' Only';
}

function fmt(num) { return (num || 0).toFixed(2); }

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Colours & Fonts ──────────────────────────────────────────────────────────
const NAVY    = '#1a2e5a';
const LIGHT   = '#e8edf5';
const WHITE   = '#ffffff';
const BLACK   = '#111111';
const GREY    = '#555555';
const LGREY   = '#888888';
const BORDER  = '#c0c8d8';

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function hLine(doc, x, y, w, color = BORDER) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(color).lineWidth(0.5).stroke();
}

function sectionHeader(doc, label, x, y, w, h = 14) {
  doc.rect(x, y, w, h).fill(NAVY);
  doc.fillColor(WHITE).font('Bold').fontSize(7.5)
     .text(label.toUpperCase(), x + 4, y + 3, { width: w - 8, lineBreak: false });
  doc.fillColor(BLACK);
  return y + h;
}

function labelVal(doc, label, value, x, y, labelW, valW) {
  doc.font('Regular').fontSize(8).fillColor(LGREY)
     .text(label, x, y, { width: labelW, lineBreak: false });
  doc.font('Regular').fontSize(8).fillColor(BLACK)
     .text(value || '—', x + labelW, y, { width: valW, lineBreak: false });
  return y + 12;
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
const generateInvoicePDF = async (invoice, res) => {
  return new Promise(async (resolve, reject) => {
    try {
      const A4W = 595.28;
      const A4H = 841.89;
      const M   = 30;       // margin
      const CW  = A4W - M * 2;

      const company  = invoice.companySnapshot  || {};
      const customer = invoice.customerSnapshot || {};
      const billing  = invoice.billingAddressSnapshot  || {};
      const shipping = invoice.shippingAddressSnapshot || {};

      // ── Try loading company logo ──
      let logoBuffer = null;
      if (company.logoUrl) {
        try {
          const r = await axios.get(company.logoUrl, { responseType: 'arraybuffer', timeout: 5000 });
          logoBuffer = Buffer.from(r.data, 'binary');
        } catch (_) { /* no logo — continue */ }
      }

      // ── Try loading letterpad background ──
      let bgBuffer = null;
      if (company.invoice_letterpad) {
        try {
          const r = await axios.get(company.invoice_letterpad, { responseType: 'arraybuffer', timeout: 5000 });
          bgBuffer = Buffer.from(r.data, 'binary');
        } catch (_) { /* continue */ }
      }

      const doc = new PDFDocument({ margin: M, size: 'A4', bufferPages: true, autoFirstPage: true });

      // Background on every page
      const drawBg = () => {
        if (bgBuffer) doc.image(bgBuffer, 0, 0, { width: A4W, height: A4H });
      };
      drawBg();
      doc.on('pageAdded', drawBg);

      // Fonts
      try {
        doc.registerFont('Regular', path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'));
        doc.registerFont('Bold',    path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf'));
      } catch (_) {
        doc.registerFont('Regular', 'Helvetica');
        doc.registerFont('Bold',    'Helvetica-Bold');
      }

      doc.pipe(res);

      let y = M;

      // ══════════════════════════════════════════════════════════════════════
      // HEADER — Logo + Company + "COMMERCIAL INVOICE" title
      // ══════════════════════════════════════════════════════════════════════
      const logoW = 70;
      const logoH = 45;

      if (logoBuffer) {
        doc.image(logoBuffer, M, y, { width: logoW, height: logoH });
      }

      const textX = logoBuffer ? M + logoW + 10 : M;
      const textW = CW - (logoBuffer ? logoW + 10 : 0);

      doc.font('Bold').fontSize(15).fillColor(NAVY)
         .text((company.name || 'TAMILARASU ENTERPRISES').toUpperCase(), textX, y + 2, { width: textW });
      doc.font('Regular').fontSize(9).fillColor(GREY)
         .text(company.businessType || 'Import • Export • Trading', textX, doc.y, { width: textW });

      const addrLines = (company.address || '').split('\n').filter(Boolean);
      doc.font('Regular').fontSize(8).fillColor(BLACK);
      addrLines.forEach(line => doc.text(line, textX, doc.y, { width: textW }));
      if (company.email) doc.text(`Email: ${company.email}`, textX, doc.y, { width: textW });
      if (company.phone) doc.text(`Phone: ${company.phone}`, textX, doc.y, { width: textW });
      if (company.gstin) doc.font('Bold').fontSize(8).text(`GSTIN: ${company.gstin}`, textX, doc.y, { width: textW });
      if (company.pan)   doc.font('Bold').fontSize(8).text(`PAN: ${company.pan}`,       textX, doc.y, { width: textW });

      // Push y below header block
      y = Math.max(y + logoH + 5, doc.y + 5);

      // Horizontal rule
      doc.rect(M, y, CW, 1).fill(NAVY);
      y += 4;

      // ── "COMMERCIAL INVOICE" centred title ──
      doc.rect(M, y, CW, 18).fill(NAVY);
      doc.fillColor(WHITE).font('Bold').fontSize(12)
         .text('COMMERCIAL INVOICE', M, y + 3, { width: CW, align: 'center' });
      doc.fillColor(BLACK);
      y += 22;

      // ══════════════════════════════════════════════════════════════════════
      // INVOICE META — Invoice No / Date / Order No / Payment Status
      // ══════════════════════════════════════════════════════════════════════
      const metaBoxH = 28;
      doc.rect(M, y, CW, metaBoxH).strokeColor(BORDER).lineWidth(0.5).stroke();

      const metaFields = [
        { label: 'Invoice No:', value: invoice.invoiceNumber || '—' },
        { label: 'Invoice Date:', value: formatDate(invoice.invoiceDate) },
        { label: 'Order No:', value: invoice.order?.orderNumber || '—' },
        { label: 'Payment Status:', value: invoice.paymentStatus || invoice.status || '—' },
      ];
      const mCW = CW / metaFields.length;
      metaFields.forEach((mf, i) => {
        const mx = M + i * mCW;
        if (i > 0) doc.moveTo(mx, y).lineTo(mx, y + metaBoxH).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.font('Regular').fontSize(7).fillColor(LGREY).text(mf.label, mx + 4, y + 4, { width: mCW - 8, lineBreak: false });
        doc.font('Bold').fontSize(8).fillColor(BLACK).text(mf.value, mx + 4, y + 13, { width: mCW - 8, lineBreak: false });
      });
      y += metaBoxH + 4;

      // ══════════════════════════════════════════════════════════════════════
      // SECTIONS 1–3: SELLER | BUYER | CONSIGNEE  (3-column row)
      // ══════════════════════════════════════════════════════════════════════
      const colW3 = CW / 3;
      const sec123StartY = y;

      // Draw outer border
      const drawInfoBlock = (colIndex, headerLabel, lines) => {
        const cx = M + colIndex * colW3;
        const headerY = sectionHeader(doc, headerLabel, cx, y, colW3);
        let ty = headerY + 3;
        lines.forEach(([lbl, val]) => {
          if (!lbl) {
            // plain text line
            doc.font('Regular').fontSize(8).fillColor(BLACK)
               .text(val || '', cx + 4, ty, { width: colW3 - 8 });
            ty = doc.y;
          } else {
            doc.font('Bold').fontSize(7.5).fillColor(LGREY)
               .text(lbl, cx + 4, ty, { width: 60, lineBreak: false });
            doc.font('Regular').fontSize(8).fillColor(BLACK)
               .text(val || '—', cx + 4 + 60, ty, { width: colW3 - 8 - 60, lineBreak: false });
            ty += 11;
          }
        });
        return ty;
      };

      // Section 1: Seller / Exporter
      const sel1 = drawInfoBlock(0, '1. Seller / Exporter Details', [
        [null, (company.name || 'TAMILARASU ENTERPRISES')],
        [null, company.address || ''],
        ['GSTIN:', company.gstin || '—'],
        ['PAN:', company.pan || '—'],
        ['Phone:', company.phone || '—'],
        ['Email:', company.email || '—'],
      ]);

      // Section 2: Buyer / Importer
      const sel2 = drawInfoBlock(1, '2. Buyer / Importer (Billed To)', [
        [null, customer.name || '—'],
        [null, billing.address || customer.address || ''],
        ['Country:', customer.country || billing.country || '—'],
        ['GST/VAT:', customer.gstVat || '—'],
        ['Phone:', customer.phone || '—'],
        ['Email:', customer.email || '—'],
      ]);

      // Section 3: Consignee / Ship To
      const consigneeName = invoice.notifyParty || customer.name || '—';
      const sameAsBuyer   = !invoice.notifyParty;
      const sel3 = drawInfoBlock(2, '3. Consignee / Ship To', [
        [null, consigneeName],
        [null, sameAsBuyer ? '(Same as Buyer)' : (shipping.address || '')],
        ['Country:', shipping.country || customer.country || '—'],
        ['Notify Party:', invoice.notifyParty || '—'],
      ]);

      const maxSecY = Math.max(sel1, sel2, sel3) + 4;

      // Vertical separators
      [1, 2].forEach(i => {
        doc.moveTo(M + i * colW3, sec123StartY).lineTo(M + i * colW3, maxSecY).strokeColor(BORDER).lineWidth(0.5).stroke();
      });
      // Outer rect
      doc.rect(M, sec123StartY, CW, maxSecY - sec123StartY).strokeColor(BORDER).lineWidth(0.5).stroke();

      y = maxSecY + 4;

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 4: SHIPPING & ROUTING
      // ══════════════════════════════════════════════════════════════════════
      const shipFields = [
        ['Pre-Carriage By',       invoice.preCarriage        || '—'],
        ['Place of Receipt',      invoice.placeOfReceipt     || '—'],
        ['Country of Origin',     invoice.countryOfOrigin    || 'India'],
        ['Country of Dest.',      invoice.countryOfDestination || '—'],
        ['Port of Loading',       invoice.portOfLoading      || '—'],
        ['Port of Discharge',     invoice.portOfDischarge    || '—'],
        ['Vessel / Flight No.',   invoice.vesselFlightNo     || '—'],
      ];

      const shipRowH = 22;
      const shipColW = CW / shipFields.length;
      const shipHeaderY = sectionHeader(doc, '4. Shipping & Routing Details', M, y, CW);
      y = shipHeaderY;

      // outer box
      doc.rect(M, shipHeaderY - 14, CW, 14 + shipRowH).strokeColor(BORDER).lineWidth(0.5).stroke();

      shipFields.forEach((sf, i) => {
        const sx = M + i * shipColW;
        if (i > 0) doc.moveTo(sx, y).lineTo(sx, y + shipRowH).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.font('Regular').fontSize(6.5).fillColor(LGREY).text(sf[0], sx + 3, y + 2, { width: shipColW - 6, lineBreak: false });
        doc.font('Bold').fontSize(8).fillColor(BLACK).text(sf[1], sx + 3, y + 10, { width: shipColW - 6, lineBreak: false });
      });
      y += shipRowH + 4;

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 5: TERMS OF DELIVERY & PAYMENT
      // ══════════════════════════════════════════════════════════════════════
      const termsFields = [
        ['Incoterms 2020',   invoice.incoterms    || company.defaultIncoterms  || '—'],
        ['Payment Terms',    invoice.paymentTerms || company.defaultPaymentTerms || '—'],
        ['Currency of Sale', invoice.currency     || 'INR'],
        ['Tax Treatment',    invoice.taxTreatment || '—'],
      ];
      const tColW = CW / termsFields.length;
      const tHdrY = sectionHeader(doc, '5. Terms of Delivery & Payment', M, y, CW);
      const tRowH = 22;
      doc.rect(M, tHdrY - 14, CW, 14 + tRowH).strokeColor(BORDER).lineWidth(0.5).stroke();

      termsFields.forEach((tf, i) => {
        const tx = M + i * tColW;
        if (i > 0) doc.moveTo(tx, tHdrY).lineTo(tx, tHdrY + tRowH).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.font('Regular').fontSize(6.5).fillColor(LGREY).text(tf[0], tx + 3, tHdrY + 2, { width: tColW - 6, lineBreak: false });
        doc.font('Bold').fontSize(8).fillColor(BLACK).text(tf[1], tx + 3, tHdrY + 10, { width: tColW - 6, lineBreak: false });
      });
      y = tHdrY + tRowH + 4;

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 6: ITEMIZED TABLE
      // ══════════════════════════════════════════════════════════════════════
      y = sectionHeader(doc, '6. Itemized Description of Goods', M, y, CW) - 14 + 14;

      // Table via pdfkit-table
      const tableData = (invoice.items || []).map((item, idx) => ({
        sno:   (idx + 1).toString(),
        desc:  item.description || '',
        hsn:   item.hsnSac || '—',
        qty:   item.quantity.toString(),
        unit:  item.unit || 'Nos',
        rate:  fmt(item.unitPrice),
        taxable: fmt(item.taxableAmount),
        igst:  item.taxRate ? `${item.taxRate}%` : '0%',
        tax:   fmt(item.igstAmount || item.cgstAmount + (item.sgstAmount || 0)),
        total: fmt(item.lineTotal),
      }));

      const colWidths = {
        sno:     CW * 0.04,
        desc:    CW * 0.22,
        hsn:     CW * 0.08,
        qty:     CW * 0.05,
        unit:    CW * 0.06,
        rate:    CW * 0.09,
        taxable: CW * 0.10,
        igst:    CW * 0.06,
        tax:     CW * 0.09,
        total:   CW * 0.11,
      };

      const table = {
        headers: [
          { label: 'S.No', property: 'sno',     width: colWidths.sno,     align: 'center', headerAlign: 'center' },
          { label: 'Description of Goods', property: 'desc', width: colWidths.desc, align: 'left', headerAlign: 'left' },
          { label: 'HSN/SAC', property: 'hsn',  width: colWidths.hsn,     align: 'center', headerAlign: 'center' },
          { label: 'Qty',    property: 'qty',    width: colWidths.qty,     align: 'center', headerAlign: 'center' },
          { label: 'Unit',   property: 'unit',   width: colWidths.unit,    align: 'center', headerAlign: 'center' },
          { label: `Unit Price\n(${invoice.currency})`, property: 'rate', width: colWidths.rate, align: 'right', headerAlign: 'right' },
          { label: `Taxable Value\n(${invoice.currency})`, property: 'taxable', width: colWidths.taxable, align: 'right', headerAlign: 'right' },
          { label: 'IGST %', property: 'igst',  width: colWidths.igst,    align: 'right', headerAlign: 'right' },
          { label: `Tax Amt\n(${invoice.currency})`, property: 'tax', width: colWidths.tax, align: 'right', headerAlign: 'right' },
          { label: `Total\n(${invoice.currency})`, property: 'total', width: colWidths.total, align: 'right', headerAlign: 'right' },
        ],
        data: tableData,
      };

      const tableStartY = y;
      await doc.table(table, {
        prepareHeader: () => doc.font('Bold').fontSize(7).fillColor(BLACK),
        prepareRow:    () => doc.font('Regular').fontSize(8).fillColor(BLACK),
        width: CW,
        x: M,
        y: tableStartY,
        padding: 4,
        divider: {
          header:     { disabled: false, width: 0.5, opacity: 1 },
          horizontal: { disabled: false, width: 0.5, opacity: 0.4 },
        },
        headerColor: LIGHT,
      });

      y = doc.y + 4;

      // ══════════════════════════════════════════════════════════════════════
      // FINANCIAL SUMMARY — FOB / Freight / Insurance / CIF
      // ══════════════════════════════════════════════════════════════════════
      const fobValue      = invoice.fobValue      || invoice.subtotal      || 0;
      const freightVal    = invoice.freight        || 0;
      const insuranceVal  = invoice.insurance      || 0;
      const cifValue      = invoice.totalCifValue  || (fobValue + freightVal + insuranceVal);
      const grandTotal    = invoice.grandTotal      || 0;
      const totalTax      = invoice.totalTax        || 0;

      const summaryRows = [
        ['FOB Value',         fmt(fobValue)],
        ['Freight Charges',   fmt(freightVal)],
        ['Insurance Premium', fmt(insuranceVal)],
        ['TOTAL CIF VALUE',   fmt(cifValue)],
        ['Total Tax (IGST)',  fmt(totalTax)],
        ['GRAND TOTAL',       fmt(grandTotal)],
      ];

      const sumLabelW = 100;
      const sumValW   = 80;
      const sumX      = M + CW - sumLabelW - sumValW;
      const sumLineH  = 14;

      const wordsText = numberToWords(grandTotal, invoice.currency);
      // Amount in words box (left side)
      const wordBoxH = summaryRows.length * sumLineH;
      doc.rect(M, y, CW - sumLabelW - sumValW - 5, wordBoxH).strokeColor(BORDER).lineWidth(0.5).stroke();
      doc.font('Regular').fontSize(7.5).fillColor(LGREY).text('Total Value in Words:', M + 4, y + 4);
      doc.font('Bold').fontSize(8).fillColor(NAVY).text(wordsText, M + 4, doc.y + 2, { width: CW - sumLabelW - sumValW - 12 });

      // Summary rows (right side)
      summaryRows.forEach(([label, val], i) => {
        const sy = y + i * sumLineH;
        const isBold = label === 'GRAND TOTAL' || label === 'TOTAL CIF VALUE';
        doc.rect(sumX, sy, sumLabelW + sumValW, sumLineH).strokeColor(BORDER).lineWidth(0.5).stroke();
        if (isBold) doc.rect(sumX, sy, sumLabelW + sumValW, sumLineH).fill(LIGHT);
        doc.font(isBold ? 'Bold' : 'Regular').fontSize(7.5)
           .fillColor(isBold ? NAVY : GREY)
           .text(label, sumX + 3, sy + 3, { width: sumLabelW, lineBreak: false });
        doc.font(isBold ? 'Bold' : 'Regular').fontSize(8)
           .fillColor(isBold ? NAVY : BLACK)
           .text(`${invoice.currency} ${val}`, sumX + sumLabelW + 3, sy + 3, { width: sumValW - 6, align: 'right', lineBreak: false });
      });

      y += wordBoxH + 6;

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 8: BANK DETAILS
      // ══════════════════════════════════════════════════════════════════════

      // Check remaining page space — add page if needed
      if (y > A4H - 200) { doc.addPage(); y = M; }

      const bankHdrY = sectionHeader(doc, '8. Bank Details for Remittance', M, y, CW);
      const bankFields = [
        ['Bank Name:',    company.bankName     || '—'],
        ['Branch:',       company.branch       || '—'],
        ['Account Name:', company.accountName  || '—'],
        ['Account No.:',  company.accountNumber || '—'],
        ['IFSC Code:',    company.ifsc         || '—'],
        ['SWIFT/BIC:',    company.swiftBic     || '—'],
      ];
      const bankColW = CW / 3;
      let bankY = bankHdrY + 2;
      for (let i = 0; i < bankFields.length; i++) {
        const col = Math.floor(i / 2);
        const row = i % 2;
        const bx = M + col * bankColW;
        const by = bankHdrY + row * 13 + 2;
        doc.font('Regular').fontSize(7.5).fillColor(LGREY).text(bankFields[i][0], bx + 4, by, { width: 65, lineBreak: false });
        doc.font('Bold').fontSize(8).fillColor(BLACK).text(bankFields[i][1], bx + 70, by, { width: bankColW - 74, lineBreak: false });
        bankY = Math.max(bankY, by + 13);
      }
      doc.rect(M, bankHdrY - 14, CW, 14 + 28).strokeColor(BORDER).lineWidth(0.5).stroke();
      y = bankHdrY - 14 + 14 + 32;

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 9: GST EXPORT DECLARATION
      // ══════════════════════════════════════════════════════════════════════
      if (y > A4H - 150) { doc.addPage(); y = M; }

      const gstDeclarationText = invoice.gstDeclaration
        || company.gstExportDeclaration
        || 'Supply meant for export under bond / Letter of Undertaking (LUT) without payment of Integrated Tax as per Section 16(3)(a) of IGST Act, 2017.';

      const gstHdrY = sectionHeader(doc, '9. GST Export Declaration', M, y, CW);
      doc.rect(M, y, CW, 14 + 30).strokeColor(BORDER).lineWidth(0.5).stroke();
      doc.font('Regular').fontSize(7.5).fillColor(LGREY).text(`GSTIN: ${company.gstin || '—'}  |  Tax Treatment: ${invoice.taxTreatment || '—'}`, M + 4, gstHdrY + 2);
      doc.font('Regular').fontSize(8).fillColor(BLACK).text(gstDeclarationText, M + 4, doc.y + 3, { width: CW - 8 });
      y = doc.y + 8;

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 10: LEGAL DECLARATIONS & AUTHORISATION
      // ══════════════════════════════════════════════════════════════════════
      if (y > A4H - 100) { doc.addPage(); y = M; }

      const declText = company.declarationText
        || `We declare that the information and particulars stated in this invoice are true and correct to the best of our knowledge and based on the records of ${company.name || 'TAMILARASU ENTERPRISES'}.`;

      const legalHdrY = sectionHeader(doc, '10. Legal Declarations & Authorisation', M, y, CW);
      const legalBoxH = 60;
      doc.rect(M, y, CW, 14 + legalBoxH).strokeColor(BORDER).lineWidth(0.5).stroke();

      const declColW = CW * 0.6;
      const sigColW  = CW - declColW;
      const sigX     = M + declColW;

      doc.font('Regular').fontSize(8).fillColor(BLACK)
         .text(declText, M + 4, legalHdrY + 4, { width: declColW - 8 });

      // Vertical divider
      doc.moveTo(sigX, legalHdrY).lineTo(sigX, legalHdrY + legalBoxH).strokeColor(BORDER).lineWidth(0.5).stroke();

      // Signature area
      doc.font('Bold').fontSize(8.5).fillColor(NAVY)
         .text(`For ${company.name || 'TAMILARASU ENTERPRISES'}`, sigX + 4, legalHdrY + 4, { width: sigColW - 8 });

      const sigLineY = legalHdrY + legalBoxH - 20;
      doc.moveTo(sigX + 10, sigLineY).lineTo(sigX + sigColW - 10, sigLineY).strokeColor(BORDER).lineWidth(0.5).stroke();
      doc.font('Bold').fontSize(8).fillColor(BLACK)
         .text(company.authorizedSignatoryName || 'Authorized Signatory', sigX + 4, sigLineY + 2, { width: sigColW - 8 });
      if (company.authorizedSignatoryDesignation) {
        doc.font('Regular').fontSize(7).fillColor(LGREY)
           .text(company.authorizedSignatoryDesignation, sigX + 4, doc.y, { width: sigColW - 8 });
      }
      doc.font('Regular').fontSize(7).fillColor(LGREY)
         .text(`Date: ${formatDate(invoice.finalizedAt || invoice.invoiceDate)}`, sigX + 4, doc.y + 2, { width: sigColW - 8 });

      y = legalHdrY + 14 + legalBoxH + 6;

      // ══════════════════════════════════════════════════════════════════════
      // FOOTER (all pages)
      // ══════════════════════════════════════════════════════════════════════
      const footerText = company.footerText
        || `${company.name || 'TAMILARASU ENTERPRISES'} | Phone: ${company.phone || ''} | Email: ${company.email || ''} | GSTIN: ${company.gstin || ''}`;

      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        const savedBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.rect(M, A4H - 22, CW, 0.5).fill(NAVY);
        doc.font('Regular').fontSize(7).fillColor(LGREY)
           .text(footerText, M, A4H - 18, { width: CW, align: 'center', lineBreak: false });
        doc.page.margins.bottom = savedBottom;
      }

      doc.end();
      doc.on('end', resolve);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF, numberToWords };
