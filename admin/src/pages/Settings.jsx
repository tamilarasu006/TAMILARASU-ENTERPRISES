import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Key, Building } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company'); // 'company' or 'security'

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Company State
  const [companySettings, setCompanySettings] = useState({
    company_name: '',
    company_address: '',
    company_city: '',
    company_phone: '',
    company_email: '',
    company_gstin: '',
    invoice_prefix: 'TE/2026-27/',
    invoice_letterpad: '',
    invoice_docx_template: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanySettings(prev => ({ ...prev, ...res.data.data }));
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (newPassword !== confirmPassword) return setError('New passwords do not match');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters');

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword, newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSuccess('Password changed successfully! Please log in again.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => { localStorage.removeItem('adminToken'); navigate('/login'); }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/settings`, companySettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Company invoice settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
      
      <div className="flex border-b mb-6">
        <button 
          onClick={() => { setActiveTab('company'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 font-bold ${activeTab === 'company' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2"><Building size={18} /> Basic Company Details</div>
        </button>
        <button 
          onClick={() => navigate('/settings/invoice')}
          className="px-4 py-2 font-bold text-gray-500 hover:text-blue-600 ml-auto flex items-center gap-2"
        >
          Advanced Invoice Settings →
        </button>
        <button 
          onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 font-bold ${activeTab === 'security' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2"><Key size={18} /> Security</div>
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-bold">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm font-bold">{success}</div>}

      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
            <input type="password" required className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
            <input type="password" required minLength={6} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password</label>
            <input type="password" required minLength={6} className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-4">
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      )}

      {activeTab === 'company' && (
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Company Name</label>
              <input type="text" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.company_name} onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})} placeholder="TAMILARASU ENTERPRISES" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">GSTIN / Tax ID</label>
              <input type="text" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.company_gstin} onChange={(e) => setCompanySettings({...companySettings, company_gstin: e.target.value})} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Contact Phone</label>
              <input type="text" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.company_phone} onChange={(e) => setCompanySettings({...companySettings, company_phone: e.target.value})} placeholder="+91 00000 00000" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Contact Email</label>
              <input type="email" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.company_email} onChange={(e) => setCompanySettings({...companySettings, company_email: e.target.value})} placeholder="info@example.com" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Company Address</label>
              <textarea rows="3" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.company_address} onChange={(e) => setCompanySettings({...companySettings, company_address: e.target.value})} placeholder="123 Business Street" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">City/State</label>
              <input type="text" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.company_city} onChange={(e) => setCompanySettings({...companySettings, company_city: e.target.value})} placeholder="Chennai, Tamil Nadu" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Invoice Prefix</label>
              <input type="text" className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" value={companySettings.invoice_prefix} onChange={(e) => setCompanySettings({...companySettings, invoice_prefix: e.target.value})} placeholder="TE/2026-27/" />
              <p className="text-xs text-gray-500 mt-1">E.g. TE/2026-27/000001</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">Invoice Letterpad Image</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    try {
                      setLoading(true);
                      const token = localStorage.getItem('adminToken');
                      const res = await axios.post(`${API_URL}/api/settings/upload`, formData, {
                        headers: { 
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'multipart/form-data'
                        }
                      });
                      if (res.data.success) {
                        setCompanySettings({...companySettings, invoice_letterpad: res.data.url});
                        setSuccess('Letterpad image uploaded successfully. Click Save Settings to persist.');
                      }
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to upload letterpad image');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                />
                {companySettings.invoice_letterpad && (
                  <img src={companySettings.invoice_letterpad} alt="Letterpad Preview" className="h-16 object-contain border rounded" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload an image to be used as the invoice background/header.</p>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">DOCX Invoice Template</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                      setLoading(true);
                      const token = localStorage.getItem('adminToken');
                      const res = await axios.post(`${API_URL}/api/settings/upload/docx`, formData, {
                        headers: { 
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'multipart/form-data'
                        }
                      });
                      if (res.data.success) {
                        setCompanySettings({...companySettings, invoice_docx_template: res.data.url});
                        setSuccess('DOCX template uploaded successfully. Click Save Settings to persist.');
                      }
                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to upload DOCX template');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                />
                {companySettings.invoice_docx_template && (
                  <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                    Template Uploaded
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload a Word document (.docx) to act as a template. You can use tags like {'{invoiceNumber}'}, {'{customerName}'}, and {'{#items}{description}{/items}'} which will be automatically replaced with the order data.
              </p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-4">
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}

