import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode, ScanLine } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  
  const [showQRModal, setShowQRModal] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [scanError, setScanError] = useState('');

  const fetchOrders = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/login');
    
    axios.get(`${API_URL}/api/admin/orders?search=${search}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrders(res.data.data))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/login');
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    try {
      await axios.put(`${API_URL}/api/admin/orders/${selectedOrder.id}`, { 
         status,
         internalNotes,
         quotedAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order updated successfully');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert('Failed to update order');
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setStatus(order.status);
    setInternalNotes(order.internalNotes || '');
    setQuotedAmount(order.quotedAmount || '');
  };

  const handleScan = async (scannedData) => {
    try {
      const result = scannedData[0]?.rawValue || scannedData;
      if (!result) return;
      const token = localStorage.getItem('adminToken');
      
      const res = await axios.get(`${API_URL}/api/orders/qr/${result}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScannedOrder(res.data.data);
      setScanError('');
    } catch (err) {
      setScanError(err.response?.data?.message || 'Failed to retrieve order');
      setScannedOrder(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Customer Inquiries / Orders</h2>
        <button 
          onClick={() => { setShowScannerModal(true); setScannedOrder(null); setScanError(''); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          <ScanLine size={18} />
          Scan Customer QR
        </button>
      </div>
      
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search by Order Number or Customer Name..." 
          className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order Ref</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company/Country</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <motion.tbody 
            className="divide-y divide-gray-100"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {orders.map((o, i) => (
              <motion.tr key={o.id} variants={itemVariants} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{o.orderNumber}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800">{o.company || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{o.country || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  {o.orderItems.map(item => (
                     <div key={item.id} className="text-sm text-gray-700 font-medium">{item.product.name} ({item.quantity})</div>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    o.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => openOrderDetails(o)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-100 px-3 py-1 rounded font-bold transition-colors">Manage</button>
                  {o.qrToken && (
                    <button onClick={() => setShowQRModal(o)} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1 rounded font-bold transition-colors flex items-center gap-1">
                      <QrCode size={16} /> QR
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto p-8 border border-gray-100 relative"
            >
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h3 className="text-2xl font-extrabold text-gray-800">Manage Order: {selectedOrder.orderNumber}</h3>
                {selectedOrder.qrToken && (
                  <button 
                    onClick={() => setShowQRModal(selectedOrder)}
                    className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-900 transition shadow"
                  >
                    <QrCode size={16} /> View QR
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-bold text-gray-800">{selectedOrder.user?.name}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.user?.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company & Country</p>
                  <p className="font-bold text-gray-800">{selectedOrder.company || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.country || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target Delivery</p>
                  <p className="font-bold text-gray-800">{selectedOrder.preferredDeliveryDate || 'Not specified'}</p>
                </div>
                <div className="col-span-1 md:col-span-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Customer Requirements</p>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedOrder.message || 'No additional message provided.'}</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-5 border-t border-gray-100 pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Update Status</label>
                    <select className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="PENDING">PENDING</option>
                      <option value="QUOTED">QUOTED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quoted Amount (USD)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={quotedAmount} onChange={e => setQuotedAmount(e.target.value)} placeholder="e.g. 5000.00" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Internal Notes (Not visible to customer)</label>
                  <textarea rows="3" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Add private admin notes here..."></textarea>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button type="button" onClick={() => setSelectedOrder(null)} className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Display Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full relative flex flex-col items-center">
            <button 
              onClick={() => setShowQRModal(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Order QR Code</h2>
            <p className="text-sm text-gray-500 mb-4">Order: {showQRModal.orderNumber}</p>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <QRCodeSVG value={showQRModal.qrToken} size={200} />
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">Customer's QR Code. You can print or download this if needed.</p>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative flex flex-col">
            <button 
              onClick={() => setShowScannerModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-10"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4">Scan Order QR Code</h2>
            
            {!scannedOrder ? (
              <>
                <div className="rounded overflow-hidden shadow-inner border mb-4">
                  <Scanner onScan={handleScan} />
                </div>
                {scanError && <p className="text-red-500 text-sm font-semibold mb-2">{scanError}</p>}
                <p className="text-xs text-gray-500 text-center">Scan a customer's order QR code to instantly pull up their order details.</p>
              </>
            ) : (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-700">Order Found</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2 border mb-4">
                  <p><strong>Order Number:</strong> {scannedOrder.orderNumber}</p>
                  <p><strong>Customer:</strong> {scannedOrder.user?.name}</p>
                  <p><strong>Status:</strong> {scannedOrder.status}</p>
                  <p><strong>Total Amount:</strong> ${scannedOrder.totalAmount}</p>
                  <p><strong>Date:</strong> {new Date(scannedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setShowScannerModal(false);
                      openOrderDetails(scannedOrder);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-bold"
                  >
                    Manage Order
                  </button>
                  <button 
                    onClick={() => { setScannedOrder(null); setScanError(''); }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition font-bold"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}