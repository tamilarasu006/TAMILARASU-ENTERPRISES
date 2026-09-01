import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

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
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Customer Inquiries / Orders</h2>
      
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
                <td className="px-6 py-4">
                  <button onClick={() => openOrderDetails(o)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-100 px-3 py-1 rounded font-bold transition-colors">Manage</button>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto p-8 border border-gray-100"
            >
              <h3 className="text-2xl font-extrabold mb-6 text-gray-800 border-b pb-4">Manage Order: {selectedOrder.orderNumber}</h3>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-bold text-gray-800">{selectedOrder.user?.name}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.user?.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company & Country</p>
                  <p className="font-bold text-gray-800">{selectedOrder.company}</p>
                  <p className="text-gray-600 text-sm">{selectedOrder.country}</p>
                </div>
                <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
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
    </motion.div>
  );
}