import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// ─── Amount to words ──────────────────────────────────────────────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function chunkWords(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + chunkWords(n % 100) : '');
}

function numberToWords(amount, currency = 'INR') {
  if (!amount || isNaN(amount)) return 'Zero Only';
  const n = Math.round(amount);
  if (n === 0) return 'Zero Only';
  if (currency === 'INR') {
    const cr  = Math.floor(n / 10000000);
    const lk  = Math.floor((n % 10000000) / 100000);
    const th  = Math.floor((n % 100000) / 1000);
    const rs  = n % 1000;
    let w = '';
    if (cr) w += chunkWords(cr) + ' Crore ';
    if (lk) w += chunkWords(lk) + ' Lakh ';
    if (th) w += chunkWords(th) + ' Thousand ';
    if (rs) w += chunkWords(rs);
    return 'Rupees ' + w.trim() + ' Only';
  }
  const bn = Math.floor(n / 1000000000);
  const mn = Math.floor((n % 1000000000) / 1000000);
  const th = Math.floor((n % 1000000) / 1000);
  const un = n % 1000;
  let w = '';
  if (bn) w += chunkWords(bn) + ' Billion ';
  if (mn) w += chunkWords(mn) + ' Million ';
  if (th) w += chunkWords(th) + ' Thousand ';
  if (un) w += chunkWords(un);
  const label = currency === 'USD' ? 'US Dollars' : currency;
  return label + ' ' + w.trim() + ' Only';
}

function fmt(n) { return (n || 0).toFixed(2); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ num, title }) {
  return (
    <div className="bg-[#1a2e5a] text-white text-xs font-bold uppercase px-2 py-1 tracking-wide">
      {num}. {title}
    </div>
  );
}

// Editable Field component for inline editing
const EditableField = ({ isEditing, value, onChange, placeholder = '—', className = '', type = 'text', readOnly = false }) => {
  if (!isEditing || readOnly) return <span className={className}>{value || placeholder}</span>;
  return (
    <input 
      type={type} 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className={`bg-blue-50 border border-blue-300 rounded px-1 outline-none w-full text-gray-900 ${className}`}
    />
  );
};

const EditableTextarea = ({ isEditing, value, onChange, placeholder = '—', className = '', rows = 2 }) => {
  if (!isEditing) return <span className={className}>{value || placeholder}</span>;
  return (
    <textarea 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      rows={rows}
      className={`bg-blue-50 border border-blue-300 rounded px-1 outline-none w-full text-gray-900 ${className}`}
    />
  );
};

export default function InvoicePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const invoiceRef = useRef();

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(res.data.data);
      setEditData(JSON.parse(JSON.stringify(res.data.data))); // deep copy for editing
    } catch (err) {
      console.error('Failed to fetch invoice', err);
      alert('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = invoiceRef.current;
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `TAMILARASU_ENTERPRISES_Invoice_${(invoice.invoiceNumber || 'Draft').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => window.print();

  const handleEmailInvoice = async () => {
    setEmailing(true);
    setActionMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/invoices/${id}/email`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('✅ Invoice emailed successfully to customer.');
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Failed to send email.'}`);
    } finally {
      setEmailing(false);
    }
  };

  const handleFinalize = async () => {
    if (!confirm('Finalize this invoice? This action locks the invoice number and totals.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API_URL}/api/invoices/${id}/finalize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(res.data.data);
      setEditData(res.data.data);
      setIsEditing(false);
      setActionMsg('✅ Invoice finalized successfully.');
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Failed to finalize invoice.'}`);
    }
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    setActionMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      
      // Compute totals before saving
      let subtotal = 0;
      let totalTax = 0;
      let cgst = 0, sgst = 0, igst = 0;
      
      const newItems = editData.items.map(item => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const taxable = qty * price;
        const tRate = parseFloat(item.taxRate) || 0;
        const taxAmt = (taxable * tRate) / 100;
        
        let i_igst = 0, i_cgst = 0, i_sgst = 0;
        if (editData.taxTreatment === 'DOMESTIC') {
          i_cgst = taxAmt / 2;
          i_sgst = taxAmt / 2;
        } else {
          i_igst = taxAmt;
        }
        
        subtotal += taxable;
        totalTax += taxAmt;
        cgst += i_cgst;
        sgst += i_sgst;
        igst += i_igst;
        
        return {
          ...item,
          taxableAmount: taxable,
          cgstAmount: i_cgst,
          sgstAmount: i_sgst,
          igstAmount: i_igst,
          lineTotal: taxable + taxAmt
        };
      });

      const freight = parseFloat(editData.freight) || 0;
      const insurance = parseFloat(editData.insurance) || 0;
      const fobValue = parseFloat(editData.fobValue) || subtotal;
      const totalCifValue = fobValue + freight + insurance;
      const grandTotal = subtotal + totalTax + freight + insurance;

      const payload = {
        ...editData,
        items: newItems,
        subtotal,
        totalTax,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        freight,
        insurance,
        fobValue,
        totalCifValue,
        grandTotal
      };

      const res = await axios.put(`${API_URL}/api/invoices/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInvoice(res.data.data);
      setEditData(JSON.parse(JSON.stringify(res.data.data)));
      setIsEditing(false);
      setActionMsg('✅ Invoice updated successfully.');
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Failed to update invoice.'}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditData(JSON.parse(JSON.stringify(invoice)));
    setIsEditing(false);
    setActionMsg('');
  };

  const handleSyncSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/settings/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const latest = res.data.data;
      setEditData(prev => ({
        ...prev,
        companySnapshot: {
          ...prev.companySnapshot,
          name: latest.companyName || latest.name,
          businessType: latest.businessType,
          address: latest.address,
          phone: latest.phone,
          email: latest.email,
          gstin: latest.gstin,
          pan: latest.pan,
          bankName: latest.bankName,
          branch: latest.branch,
          accountName: latest.accountName,
          accountNumber: latest.accountNumber,
          ifsc: latest.ifsc,
          swiftBic: latest.swiftBic,
          declarationText: latest.declarationText,
          gstExportDeclaration: latest.gstExportDeclaration,
          authorizedSignatoryName: latest.authorizedSignatoryName,
          authorizedSignatoryDesignation: latest.authorizedSignatoryDesignation,
          footerText: latest.footerText,
          logoUrl: latest.logoUrl,
        }
      }));
      alert('Company settings synced! Click "Save Changes" to apply.');
    } catch (err) {
      alert('Failed to sync company settings.');
    }
  };

  // Change handlers for nested objects
  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };
  const handleCompanyChange = (field, value) => {
    setEditData(prev => ({ ...prev, companySnapshot: { ...prev.companySnapshot, [field]: value } }));
  };
  const handleCustChange = (field, value) => {
    setEditData(prev => ({ ...prev, customerSnapshot: { ...prev.customerSnapshot, [field]: value } }));
  };
  const handleBillChange = (field, value) => {
    setEditData(prev => ({ ...prev, billingAddressSnapshot: { ...prev.billingAddressSnapshot, [field]: value } }));
  };
  const handleShipChange = (field, value) => {
    setEditData(prev => ({ ...prev, shippingAddressSnapshot: { ...prev.shippingAddressSnapshot, [field]: value } }));
  };
  const handleItemChange = (idx, field, value) => {
    const newItems = [...editData.items];
    newItems[idx][field] = value;
    setEditData(prev => ({ ...prev, items: newItems }));
  };
  const addItem = () => {
    const newItems = [...(editData.items || []), {
      productId: 'manual',
      description: 'New Item',
      hsnSac: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      unit: 'Nos'
    }];
    setEditData(prev => ({ ...prev, items: newItems }));
  };
  const removeItem = (idx) => {
    const newItems = [...editData.items];
    newItems.splice(idx, 1);
    setEditData(prev => ({ ...prev, items: newItems }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Invoice...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found.</div>;

  const data = isEditing ? editData : invoice;
  const isFinalized = invoice.status === 'FINALIZED';
  
  const co = data.companySnapshot  || {};
  const cu = data.customerSnapshot || {};
  const bi = data.billingAddressSnapshot  || {};
  const sh = data.shippingAddressSnapshot || {};

  // For display (calculates dynamically in edit mode)
  let subtotal = 0;
  let totalTax = 0;
  (data.items || []).forEach(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    subtotal += (qty * price);
    totalTax += ((qty * price) * taxRate) / 100;
  });

  const fobValue     = isEditing ? (parseFloat(data.fobValue) || subtotal) : (data.fobValue || subtotal);
  const freightVal   = parseFloat(data.freight) || 0;
  const insuranceVal = parseFloat(data.insurance) || 0;
  const cifValue     = isEditing ? (fobValue + freightVal + insuranceVal) : (data.totalCifValue || (fobValue + freightVal + insuranceVal));
  const grandTotal   = isEditing ? (subtotal + totalTax + freightVal + insuranceVal) : (data.grandTotal || 0);
  const currency     = data.currency || 'INR';
  const wordsText    = numberToWords(grandTotal, currency);

  return (
    <div className="bg-gray-300 min-h-screen py-6 print:py-0 print:bg-white flex flex-col items-center">

      {/* ── Action Bar (hidden on print) ── */}
      <div className="w-full max-w-[210mm] flex flex-wrap justify-between items-center mb-4 gap-2 print:hidden">
        <button onClick={() => navigate('/invoices')} className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1">
          ← Back to Invoices
        </button>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSyncSettings} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm font-semibold">
                🔄 Sync Settings
              </button>
              <button onClick={cancelEdit} className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500 text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handleSaveEdits} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-semibold">
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </>
          ) : (
            <>
              {!isFinalized && (
                <button onClick={() => setIsEditing(true)} className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 text-sm font-semibold">
                  ✏️ Edit Invoice
                </button>
              )}
              {!isFinalized && (
                <button onClick={handleFinalize} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm font-semibold">
                  ✓ Finalize
                </button>
              )}
              <button onClick={handleEmailInvoice} disabled={emailing} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 text-sm font-semibold disabled:opacity-50">
                {emailing ? 'Sending…' : '✉ Email'}
              </button>
              <button onClick={handlePrint} className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded shadow hover:bg-gray-50 text-sm font-semibold">
                🖨 Print
              </button>
              <button onClick={handleDownloadPDF} className="bg-blue-700 text-white px-4 py-2 rounded shadow hover:bg-blue-800 text-sm font-semibold">
                ⬇ Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className={`w-full max-w-[210mm] mb-3 px-4 py-2 rounded text-sm font-medium print:hidden ${actionMsg.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {actionMsg}
        </div>
      )}

      {/* ── A4 Invoice Document ── */}
      <div
        ref={invoiceRef}
        id="invoice-document"
        className="bg-white shadow-xl print:shadow-none w-[210mm] min-h-[297mm] p-[10mm] text-[9pt] text-gray-800 font-sans mx-auto box-border relative"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {isEditing && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg shadow print:hidden">
            EDIT MODE ACTIVE
          </div>
        )}

        {/* ══ HEADER ══ */}
        <div className="flex items-start border-b-2 border-[#1a2e5a] pb-3 mb-3">
          {/* Logo */}
          <div className="w-20 mr-4 shrink-0">
            {co.logoUrl
              ? <img src={co.logoUrl.startsWith('/') ? `${API_URL}${co.logoUrl}` : co.logoUrl} alt="Logo" className="w-full h-auto object-contain" crossOrigin="anonymous" />
              : <div className="w-20 h-16 bg-[#1a2e5a] rounded flex items-center justify-center">
                  <span className="text-white font-black text-xs text-center leading-tight px-1">TE</span>
                </div>
            }
          </div>
          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-[16pt] font-black text-[#1a2e5a] uppercase tracking-wide leading-tight">
              {co.name || 'TAMILARASU ENTERPRISES'}
            </h1>
            <p className="text-[9pt] text-gray-500 mb-1">{co.businessType || 'Import • Export • Trading'}</p>
            {(co.address || '').split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="text-[8pt] text-gray-700 leading-tight">{line}</p>
            ))}
            <div className="flex flex-wrap gap-x-4 mt-1 text-[8pt] text-gray-600">
              {co.email && <span>Email: {co.email}</span>}
              {co.phone && <span>Phone: {co.phone}</span>}
            </div>
            {co.gstin && <p className="text-[8pt] font-bold mt-0.5">GSTIN: {co.gstin}</p>}
            {co.pan   && <p className="text-[8pt] font-bold">PAN: {co.pan}</p>}
          </div>
        </div>

        {/* ══ COMMERCIAL INVOICE TITLE ══ */}
        <div className="bg-[#1a2e5a] text-white text-center font-black text-[13pt] py-1 mb-3 tracking-widest uppercase">
          Commercial Invoice
        </div>

        {/* ══ INVOICE META ══ */}
        <div className="grid grid-cols-4 border border-gray-300 mb-3 divide-x divide-gray-300 text-[8.5pt]">
          <div className="px-2 py-1.5">
            <div className="text-gray-400 text-[7pt] uppercase font-bold">Invoice No:</div>
            <div className="font-bold text-gray-900 mt-0.5">{data.invoiceNumber || '—'}</div>
          </div>
          <div className="px-2 py-1.5">
            <div className="text-gray-400 text-[7pt] uppercase font-bold">Invoice Date:</div>
            <div className="font-bold text-gray-900 mt-0.5">{fmtDate(data.invoiceDate)}</div>
          </div>
          <div className="px-2 py-1.5">
            <div className="text-gray-400 text-[7pt] uppercase font-bold">Order No:</div>
            <div className="font-bold text-gray-900 mt-0.5">{data.order?.orderNumber || '—'}</div>
          </div>
          <div className="px-2 py-1.5">
            <div className="text-gray-400 text-[7pt] uppercase font-bold">Payment Status:</div>
            <div className="font-bold text-gray-900 mt-0.5">{data.paymentStatus || data.status || '—'}</div>
          </div>
        </div>

        {/* ══ SECTIONS 1 + 2 + 3 ══ */}
        <div className="grid grid-cols-3 border border-gray-300 divide-x divide-gray-300 mb-3">
          {/* 1. Seller */}
          <div>
            <SectionHeader num={1} title="Seller / Exporter" />
            <div className="p-2 text-[8pt]">
              <div className="font-bold text-gray-900 mb-1">{co.name}</div>
              <div className="text-gray-800 mb-2 whitespace-pre-wrap">{co.address}</div>
              <div className="flex gap-1"><span className="text-gray-400 w-12">GSTIN:</span> <span className="font-medium">{co.gstin}</span></div>
              <div className="flex gap-1"><span className="text-gray-400 w-12">PAN:</span> <span className="font-medium">{co.pan}</span></div>
              <div className="flex gap-1"><span className="text-gray-400 w-12">Phone:</span> <span className="font-medium">{co.phone}</span></div>
            </div>
          </div>
          {/* 2. Buyer */}
          <div>
            <SectionHeader num={2} title="Buyer / Importer (Billed To)" />
            <div className="p-2 text-[8pt]">
              <div className="font-bold text-gray-900 mb-1">
                <EditableField isEditing={isEditing} value={cu.name} onChange={v => handleCustChange('name', v)} placeholder="Customer Name" />
              </div>
              <div className="text-gray-800 mb-2">
                <EditableTextarea isEditing={isEditing} value={bi.address || cu.address} onChange={v => handleBillChange('address', v)} placeholder="Billing Address" rows={3} />
              </div>
              <div className="flex gap-1 items-center mb-1">
                <span className="text-gray-400 w-14 shrink-0">Country:</span> 
                <EditableField isEditing={isEditing} value={cu.country || bi.country} onChange={v => handleCustChange('country', v)} />
              </div>
              <div className="flex gap-1 items-center mb-1">
                <span className="text-gray-400 w-14 shrink-0">GST/VAT:</span> 
                <EditableField isEditing={isEditing} value={cu.gstVat} onChange={v => handleCustChange('gstVat', v)} />
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-gray-400 w-14 shrink-0">Phone:</span> 
                <EditableField isEditing={isEditing} value={cu.phone} onChange={v => handleCustChange('phone', v)} />
              </div>
            </div>
          </div>
          {/* 3. Consignee */}
          <div>
            <SectionHeader num={3} title="Consignee / Ship To" />
            <div className="p-2 text-[8pt]">
              <div className="font-bold text-gray-900 mb-1">
                <EditableField isEditing={isEditing} value={data.notifyParty || cu.name} onChange={v => handleEditChange('notifyParty', v)} placeholder="Consignee Name" />
              </div>
              <div className="text-gray-800 mb-2">
                <EditableTextarea isEditing={isEditing} value={sh.address || (data.notifyParty ? '' : '(Same as Buyer)')} onChange={v => handleShipChange('address', v)} placeholder="Shipping Address" rows={3} />
              </div>
              <div className="flex gap-1 items-center mb-1">
                <span className="text-gray-400 w-16 shrink-0">Country:</span> 
                <EditableField isEditing={isEditing} value={sh.country || cu.country} onChange={v => handleShipChange('country', v)} />
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-gray-400 w-16 shrink-0">Notify Party:</span> 
                <EditableField isEditing={isEditing} value={data.notifyParty} onChange={v => handleEditChange('notifyParty', v)} />
              </div>
            </div>
          </div>
        </div>

        {/* ══ SECTION 4: SHIPPING & ROUTING ══ */}
        <div className="border border-gray-300 mb-3">
          <SectionHeader num={4} title="Shipping & Routing Details" />
          <div className="grid grid-cols-7 divide-x divide-gray-300 text-[7.5pt]">
            {[
              ['Pre-Carriage By', 'preCarriage', data.preCarriage || '—'],
              ['Place of Receipt', 'placeOfReceipt', data.placeOfReceipt || '—'],
              ['Country of Origin', 'countryOfOrigin', data.countryOfOrigin || 'India'],
              ['Country of Dest.', 'countryOfDestination', data.countryOfDestination || '—'],
              ['Port of Loading', 'portOfLoading', data.portOfLoading || '—'],
              ['Port of Discharge', 'portOfDischarge', data.portOfDischarge || '—'],
              ['Vessel/Flight No.', 'vesselFlightNo', data.vesselFlightNo || '—'],
            ].map(([label, field, val]) => (
              <div key={label} className="px-1.5 py-1.5">
                <div className="text-gray-400 text-[6.5pt] uppercase leading-tight mb-0.5">{label}</div>
                <div className="font-semibold text-gray-800 text-[7.5pt]">
                  <EditableField isEditing={isEditing} value={data[field]} onChange={v => handleEditChange(field, v)} placeholder={val} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SECTION 5: TERMS ══ */}
        <div className="border border-gray-300 mb-3">
          <SectionHeader num={5} title="Terms of Delivery & Payment" />
          <div className="grid grid-cols-4 divide-x divide-gray-300 text-[8.5pt]">
            {[
              ['Incoterms 2020', 'incoterms', data.incoterms || co.defaultIncoterms || '—'],
              ['Payment Terms', 'paymentTerms', data.paymentTerms || co.defaultPaymentTerms || '—'],
              ['Currency of Sale', 'currency', currency],
              ['Tax Treatment', 'taxTreatment', data.taxTreatment || '—'],
            ].map(([label, field, val]) => (
              <div key={label} className="px-2 py-1.5">
                <div className="text-gray-400 text-[7pt] uppercase mb-0.5">{label}</div>
                <div className="font-semibold text-gray-800">
                  {field === 'taxTreatment' && isEditing ? (
                    <select value={data[field] || 'DOMESTIC'} onChange={e => handleEditChange(field, e.target.value)} className="bg-blue-50 border border-blue-300 w-full px-1">
                      <option value="DOMESTIC">DOMESTIC (CGST+SGST)</option>
                      <option value="EXPORT_LUT">EXPORT_LUT (IGST)</option>
                      <option value="EXPORT_WITH_IGST">EXPORT_WITH_IGST</option>
                    </select>
                  ) : field === 'currency' && isEditing ? (
                    <select value={data[field] || 'INR'} onChange={e => handleEditChange(field, e.target.value)} className="bg-blue-50 border border-blue-300 w-full px-1">
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                    </select>
                  ) : (
                    <EditableField isEditing={isEditing} value={data[field]} onChange={v => handleEditChange(field, v)} placeholder={val} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SECTION 6: ITEMS TABLE ══ */}
        <div className="border border-gray-300 mb-3">
          <SectionHeader num={6} title="Itemized Description of Goods" />
          <table className="w-full text-[7.5pt] border-collapse">
            <thead>
              <tr className="text-gray-800 bg-gray-200">
                <th className="border border-gray-400 px-1.5 py-1 text-center font-bold text-[6.5pt] w-8">S.No</th>
                <th className="border border-gray-400 px-1.5 py-1 text-left font-bold text-[6.5pt]">Description of Goods</th>
                <th className="border border-gray-400 px-1.5 py-1 text-center font-bold text-[6.5pt] w-16">HSN/SAC</th>
                <th className="border border-gray-400 px-1.5 py-1 text-center font-bold text-[6.5pt] w-12">Qty</th>
                <th className="border border-gray-400 px-1.5 py-1 text-center font-bold text-[6.5pt] w-12">Unit</th>
                <th className="border border-gray-400 px-1.5 py-1 text-right font-bold text-[6.5pt] w-20">{`Unit Price (${currency})`}</th>
                <th className="border border-gray-400 px-1.5 py-1 text-right font-bold text-[6.5pt] w-20">{`Taxable Value (${currency})`}</th>
                <th className="border border-gray-400 px-1.5 py-1 text-right font-bold text-[6.5pt] w-12">IGST %</th>
                <th className="border border-gray-400 px-1.5 py-1 text-right font-bold text-[6.5pt] w-20">{`Tax Amt (${currency})`}</th>
                <th className="border border-gray-400 px-1.5 py-1 text-right font-bold text-[6.5pt] w-20">{`Total (${currency})`}</th>
                {isEditing && <th className="border border-gray-400 px-1 py-1 w-6 print:hidden"></th>}
              </tr>
            </thead>
            <tbody>
              {(data.items || []).map((item, idx) => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                const taxable = qty * price;
                const taxRate = parseFloat(item.taxRate) || 0;
                const taxAmt = (taxable * taxRate) / 100;
                const lineTotal = taxable + taxAmt;
                
                return (
                  <tr key={idx} className="border-b border-gray-200 even:bg-gray-50">
                    <td className="border-x border-gray-300 px-1.5 py-1 text-center">{idx + 1}</td>
                    <td className="border-x border-gray-300 px-1.5 py-1 font-medium">
                      <EditableField isEditing={isEditing} value={item.description} onChange={v => handleItemChange(idx, 'description', v)} />
                    </td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-center">
                      <EditableField isEditing={isEditing} value={item.hsnSac} onChange={v => handleItemChange(idx, 'hsnSac', v)} className="text-center" />
                    </td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-center">
                      <EditableField isEditing={isEditing} value={item.quantity} onChange={v => handleItemChange(idx, 'quantity', v)} type="number" className="text-center" />
                    </td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-center">
                      <EditableField isEditing={isEditing} value={item.unit} onChange={v => handleItemChange(idx, 'unit', v)} className="text-center" />
                    </td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-right">
                      <EditableField isEditing={isEditing} value={item.unitPrice} onChange={v => handleItemChange(idx, 'unitPrice', v)} type="number" className="text-right" />
                    </td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-right">{fmt(taxable)}</td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-right">
                      <EditableField isEditing={isEditing} value={item.taxRate} onChange={v => handleItemChange(idx, 'taxRate', v)} type="number" className="text-right w-8" />%
                    </td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-right">{fmt(taxAmt)}</td>
                    <td className="border-x border-gray-300 px-1.5 py-1 text-right font-semibold">{fmt(lineTotal)}</td>
                    {isEditing && (
                      <td className="border-x border-gray-300 px-1 py-1 text-center print:hidden">
                        <button onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-100 rounded px-1 font-bold">×</button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {isEditing && (
                <tr className="print:hidden bg-blue-50">
                  <td colSpan={11} className="px-1 py-1 text-center border border-gray-300">
                    <button onClick={addItem} className="text-blue-600 hover:underline text-xs font-bold">+ Add Line Item</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ══ FINANCIAL SUMMARY ══ */}
        <div className="flex mb-3 gap-3">
          {/* Amount in words + running totals left */}
          <div className="flex-1 border border-gray-300 p-2 text-[8pt]">
            <p className="text-gray-400 text-[7pt] uppercase font-bold mb-1">Total Value in Words</p>
            <p className="font-bold italic text-[#1a2e5a] text-[8.5pt]">{wordsText}</p>
          </div>
          {/* Summary table right */}
          <div className="w-64 border border-gray-300 text-[8pt]">
            <div className="flex justify-between px-2 py-1 border-b border-gray-200">
              <span className="text-gray-500">FOB Value</span>
              <span className="text-right">
                <EditableField isEditing={isEditing} value={data.fobValue} onChange={v => handleEditChange('fobValue', v)} placeholder={fmt(subtotal)} type="number" className="text-right w-20" />
              </span>
            </div>
            <div className="flex justify-between px-2 py-1 border-b border-gray-200">
              <span className="text-gray-500">Freight Charges</span>
              <span className="text-right">
                <EditableField isEditing={isEditing} value={data.freight} onChange={v => handleEditChange('freight', v)} placeholder="0.00" type="number" className="text-right w-20" />
              </span>
            </div>
            <div className="flex justify-between px-2 py-1 border-b border-gray-200">
              <span className="text-gray-500">Insurance Premium</span>
              <span className="text-right">
                <EditableField isEditing={isEditing} value={data.insurance} onChange={v => handleEditChange('insurance', v)} placeholder="0.00" type="number" className="text-right w-20" />
              </span>
            </div>
            <div className="flex justify-between px-2 py-1 border-b border-gray-200 bg-[#e8edf5] font-bold text-[#1a2e5a]">
              <span>TOTAL CIF VALUE</span>
              <span>{fmt(cifValue)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 border-b border-gray-200">
              <span className="text-gray-500">Total Tax</span>
              <span>{fmt(totalTax)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-[#e8edf5] font-bold text-[#1a2e5a]">
              <span>GRAND TOTAL</span>
              <span>{currency} {fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ══ SECTION 8: BANK DETAILS ══ */}
        <div className="border border-gray-300 mb-3">
          <SectionHeader num={8} title="Bank Details for Remittance" />
          <div className="grid grid-cols-3 gap-x-4 p-2 text-[8pt]">
            {[
              ['Bank Name:', 'bankName',    co.bankName],
              ['Branch:', 'branch',       co.branch],
              ['Account Name:', 'accountName', co.accountName],
              ['Account No.:', 'accountNumber', co.accountNumber],
              ['IFSC Code:', 'ifsc',    co.ifsc],
              ['SWIFT/BIC:', 'swiftBic',    co.swiftBic],
            ].map(([label, field, value]) => (
              <div key={label} className="flex gap-1 py-0.5 items-center">
                <span className="text-gray-400 w-24 shrink-0">{label}</span>
                <span className="font-semibold text-gray-900 flex-1">
                  <EditableField isEditing={isEditing} value={value} onChange={v => handleCompanyChange(field, v)} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SECTION 9: GST EXPORT DECLARATION ══ */}
        <div className="border border-gray-300 mb-3">
          <SectionHeader num={9} title="GST Export Declaration" />
          <div className="p-2 text-[8pt]">
            <p className="text-gray-400 text-[7pt] mb-1">
              GSTIN: <strong className="text-gray-700">{co.gstin || '—'}</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;Tax Treatment: <strong className="text-gray-700">{data.taxTreatment || '—'}</strong>
            </p>
            <div className="text-gray-800 leading-snug">
              <EditableTextarea isEditing={isEditing} value={data.gstDeclaration} onChange={v => handleEditChange('gstDeclaration', v)} placeholder={co.gstExportDeclaration} rows={2} />
            </div>
          </div>
        </div>

        {/* ══ SECTION 10: LEGAL DECLARATION & AUTHORISATION ══ */}
        <div className="border border-gray-300 mb-3">
          <SectionHeader num={10} title="Legal Declarations & Authorisation" />
          <div className="flex divide-x divide-gray-300">
            {/* Declaration text */}
            <div className="flex-1 p-2 text-[8pt] text-gray-700 leading-snug">
              <p className="font-bold text-gray-900 mb-1">Declaration:</p>
              <p>{co.declarationText || `We declare that the information and particulars stated in this invoice are true and correct to the best of our knowledge and based on the records of ${co.name || 'TAMILARASU ENTERPRISES'}.`}</p>
            </div>
            {/* Signatory */}
            <div className="w-52 p-2 flex flex-col justify-between text-[8pt]">
              <p className="font-bold text-[#1a2e5a]">For {co.name || 'TAMILARASU ENTERPRISES'}</p>
              <div className="mt-auto">
                <div className="border-t border-gray-400 pt-1 mt-10">
                  <p className="font-bold text-gray-800">{co.authorizedSignatoryName || 'Authorized Signatory'}</p>
                  {co.authorizedSignatoryDesignation && (
                    <p className="text-gray-400 text-[7pt]">{co.authorizedSignatoryDesignation}</p>
                  )}
                  <p className="text-gray-400 text-[7pt]">Date: {fmtDate(data.finalizedAt || data.invoiceDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="border-t-2 border-[#1a2e5a] pt-2 text-center text-[7pt] text-gray-400">
          {co.footerText
            || `${co.name || 'TAMILARASU ENTERPRISES'} | Phone: ${co.phone || ''} | Email: ${co.email || ''} | GSTIN: ${co.gstin || ''}`}
        </div>

      </div>

      {/* Print CSS injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-document, #invoice-document * { visibility: visible; }
          #invoice-document { position: absolute; left: 0; top: 0; width: 210mm; padding: 10mm !important; box-shadow: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
}
