import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if(token) {
      axios.get(`${API_URL}/api/invoices/my-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setInvoices(res.data.data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [token]);

  const handleDownloadInvoice = (invoiceId) => {
    window.open(`${API_URL}/api/invoices/${invoiceId}/pdf?token=${token}`, '_blank');
  };

  const handlePreviewInvoice = (invoiceId) => {
    window.open(`${API_URL}/api/invoices/${invoiceId}/pdf?token=${token}&action=preview`, '_blank');
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12 flex-1 mt-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <FileText className="text-blue-600" size={32} />
          My Invoices
        </h1>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-xl shadow border border-gray-100">
             <p className="text-gray-500">Loading your invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow border border-gray-100">
             <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
             <h3 className="text-2xl font-bold text-gray-700 mb-2">No invoices found</h3>
             <p className="text-gray-500">You don't have any generated invoices yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invoices.map(inv => (
              <motion.div 
                key={inv.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow border border-gray-100 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{inv.invoiceNumber}</h3>
                    <p className="text-sm text-gray-500">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                    {inv.order && <p className="text-sm text-gray-500">Order: {inv.order.orderNumber}</p>}
                  </div>
                  <span className={`px-3 py-1 font-bold rounded-full text-xs ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {inv.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {inv.currency || 'INR'} {(inv.grandTotal || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePreviewInvoice(inv.id)}
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl shadow hover:bg-blue-200 transition font-bold"
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => handleDownloadInvoice(inv.id)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow hover:bg-blue-700 transition font-bold"
                    >
                      <FileText size={18} />
                      Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
