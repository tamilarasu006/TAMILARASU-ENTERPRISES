import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Eye, Download, Mail, FileText, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const STATUS_COLORS = {
  DRAFT:      'bg-gray-100 text-gray-700',
  ISSUED:     'bg-blue-100 text-blue-700',
  FINALIZED:  'bg-green-100 text-green-800',
  PAID:       'bg-emerald-100 text-emerald-800',
  CANCELLED:  'bg-red-100 text-red-700',
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchInvoices = (q = '', status = '') => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/login');
    setLoading(true);
    const params = new URLSearchParams();
    if (q)      params.set('search', q);
    if (status) params.set('status', status);

    axios.get(`${API_URL}/api/invoices?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setInvoices(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/login');
      });
  };

  useEffect(() => { fetchInvoices(search, filterStatus); }, [search, filterStatus]);

  const handleEmail = async (invId, e) => {
    e.stopPropagation();
    setActionMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/invoices/${invId}/email`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('✅ Invoice emailed to customer successfully.');
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Failed to send email.'}`);
    }
  };

  const handleFinalize = async (invId, e) => {
    e.stopPropagation();
    if (!confirm('Finalize this invoice? This will lock the invoice number and totals.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/invoices/${invId}/finalize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvoices(search, filterStatus);
      setActionMsg('✅ Invoice finalized.');
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Failed to finalize.'}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-3xl font-bold text-gray-800">Invoices</h2>
        <button
          onClick={() => navigate('/settings/invoice')}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          ⚙ Invoice Settings
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search invoice no, order no, customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="FINALIZED">Finalized</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {actionMsg && (
        <div className={`mb-4 px-4 py-2 rounded text-sm font-medium ${actionMsg.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
          {actionMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice No</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order Ref</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-400">Loading invoices…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                No invoices found.
              </td></tr>
            ) : invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <td className="px-4 py-3 font-bold text-blue-800">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-gray-500">{inv.order?.orderNumber || '—'}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-800">{inv.user?.name}</p>
                  <p className="text-xs text-gray-400">{inv.user?.email}</p>
                </td>
                <td className="px-4 py-3 font-bold text-gray-800">
                  {inv.currency || 'INR'} {(inv.grandTotal || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${inv.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {inv.paymentStatus || 'UNPAID'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      title="View Invoice"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      title="Download PDF"
                      onClick={() => {
                        const token = localStorage.getItem('adminToken');
                        window.open(`${API_URL}/api/invoices/${inv.id}/pdf?token=${token}`, '_blank');
                      }}
                      className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    {inv.status !== 'FINALIZED' && inv.status !== 'CANCELLED' && (
                      <button
                        title="Finalize Invoice"
                        onClick={(e) => handleFinalize(inv.id, e)}
                        className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button
                      title="Email Invoice to Customer"
                      onClick={(e) => handleEmail(inv.id, e)}
                      className="p-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded transition-colors"
                    >
                      <Mail size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
      </p>
    </motion.div>
  );
}
