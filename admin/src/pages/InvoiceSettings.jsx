import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const Field = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  </div>
);

const TextareaField = ({ label, name, value, onChange, rows = 3, placeholder = '' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      name={name}
      rows={rows}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  </div>
);

export default function InvoiceSettings() {
  const [settings, setSettings] = useState({
    companyName: 'TAMILARASU ENTERPRISES',
    businessType: 'Import • Export • Trading',
    logoUrl: '',
    address: 'No:02A, Muthuramapillai Street,\nSomanathapuram, Uthiramerur,\nKanchipuram, Tamil Nadu',
    email: '',
    phone: '+91 6383772487',
    gstin: '33CEGPV1765R1ZO',
    pan: 'CEGPXXXXR',
    bankName: 'Bank of Baroda',
    branch: 'UTHIRAMERUR',
    accountName: 'TAMILARASU ENTERPRISES',
    accountNumber: '532902XXXXX244',
    ifsc: 'BARB0UTHIRA',
    swiftBic: '',
    defaultCurrency: 'INR',
    defaultPaymentTerms: '',
    defaultIncoterms: '',
    invoicePrefix: 'TE',
    authorizedSignatoryName: '',
    authorizedSignatoryDesignation: '',
    declarationText: '',
    gstExportDeclaration: 'Supply meant for export under bond / Letter of Undertaking (LUT) without payment of Integrated Tax as per Section 16(3)(a) of IGST Act, 2017.',
    footerText: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/settings/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/settings/invoice`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Settings saved successfully!');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setMessage('❌ Only Super Admin can edit invoice settings.');
      } else {
        setMessage('❌ Failed to save settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice settings…</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Invoice Settings</h1>
        <p className="text-sm text-gray-400">Only Super Admin can save changes</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Company Details */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">🏢 Company Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name" name="companyName" value={settings.companyName} onChange={handleChange} />
            <Field label="Business Type" name="businessType" value={settings.businessType} onChange={handleChange} placeholder="Import • Export • Trading" />
            <Field label="Logo URL" name="logoUrl" value={settings.logoUrl} onChange={handleChange} placeholder="https://..." />
            <Field label="Invoice Prefix" name="invoicePrefix" value={settings.invoicePrefix} onChange={handleChange} placeholder="TE" />
            <div className="md:col-span-2">
              <TextareaField label="Address" name="address" value={settings.address} onChange={handleChange} rows={3} />
            </div>
            <Field label="Email" name="email" value={settings.email} onChange={handleChange} type="email" />
            <Field label="Phone" name="phone" value={settings.phone} onChange={handleChange} />
            <Field label="GSTIN" name="gstin" value={settings.gstin} onChange={handleChange} />
            <Field label="PAN" name="pan" value={settings.pan} onChange={handleChange} />
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">🏦 Bank Details for Remittance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Bank Name" name="bankName" value={settings.bankName} onChange={handleChange} />
            <Field label="Branch" name="branch" value={settings.branch} onChange={handleChange} />
            <Field label="Account Name" name="accountName" value={settings.accountName} onChange={handleChange} />
            <Field label="Account Number" name="accountNumber" value={settings.accountNumber} onChange={handleChange} />
            <Field label="IFSC Code" name="ifsc" value={settings.ifsc} onChange={handleChange} />
            <Field label="SWIFT/BIC Code (leave blank if not applicable)" name="swiftBic" value={settings.swiftBic} onChange={handleChange} />
          </div>
        </div>

        {/* Invoice Defaults */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">📋 Invoice Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <select name="defaultCurrency" value={settings.defaultCurrency || 'INR'} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </div>
            <Field label="Default Payment Terms" name="defaultPaymentTerms" value={settings.defaultPaymentTerms} onChange={handleChange} placeholder="e.g. T/T 30 days" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Incoterms</label>
              <select name="defaultIncoterms" value={settings.defaultIncoterms || ''} onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">— Select —</option>
                {['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Declarations & Signatory */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">✍️ Declarations & Authorisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Authorized Signatory Name" name="authorizedSignatoryName" value={settings.authorizedSignatoryName} onChange={handleChange} />
            <Field label="Authorized Signatory Designation" name="authorizedSignatoryDesignation" value={settings.authorizedSignatoryDesignation} onChange={handleChange} />
            <div className="md:col-span-2">
              <TextareaField
                label="Legal Declaration Text"
                name="declarationText"
                value={settings.declarationText}
                onChange={handleChange}
                rows={3}
                placeholder="We declare that the information and particulars stated in this invoice are true and correct..."
              />
            </div>
            <div className="md:col-span-2">
              <TextareaField
                label="GST Export Declaration (Section 9)"
                name="gstExportDeclaration"
                value={settings.gstExportDeclaration}
                onChange={handleChange}
                rows={3}
                placeholder="Supply meant for export under bond / LUT without payment of integrated tax..."
              />
            </div>
            <div className="md:col-span-2">
              <Field
                label="Invoice Footer Text"
                name="footerText"
                value={settings.footerText}
                onChange={handleChange}
                placeholder="e.g. TAMILARASU ENTERPRISES | Phone: ... | Email: ..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2.5 rounded-lg font-semibold shadow transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Invoice Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
