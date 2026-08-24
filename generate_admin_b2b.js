const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'admin');

const files = {
  'src/pages/Dashboard.jsx': `
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    axios.get('http://localhost:5000/api/admin/orders', { headers: { Authorization: \`Bearer \${token}\` } })
      .then(res => setOrders(res.data.data))
      .catch(console.error);
      
    axios.get('http://localhost:5000/api/admin/products', { headers: { Authorization: \`Bearer \${token}\` } })
      .then(res => setProducts(res.data.data))
      .catch(console.error);
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const quotedOrders = orders.filter(o => o.status === 'QUOTED').length;
  const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const totalProducts = products.length;

  const chartData = [
    { name: 'Pending', count: pendingOrders },
    { name: 'Quoted', count: quotedOrders },
    { name: 'Processing', count: processingOrders },
    { name: 'Completed', count: completedOrders }
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Inquiries</h3>
          <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Pending Review</h3>
          <p className="text-3xl font-bold text-gray-800">{pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Quoted & Processing</h3>
          <p className="text-3xl font-bold text-gray-800">{quotedOrders + processingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Products</h3>
          <p className="text-3xl font-bold text-gray-800">{totalProducts}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded shadow mb-8">
         <h3 className="text-xl font-bold mb-4">Inquiry Status Overview</h3>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Legend />
               <Bar dataKey="count" fill="#3b82f6" />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
`,

  'src/pages/Orders.jsx': `
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchOrders = () => {
    const token = localStorage.getItem('adminToken');
    axios.get(\`http://localhost:5000/api/admin/orders?search=\${search}\`, { headers: { Authorization: \`Bearer \${token}\` } })
      .then(res => setOrders(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    try {
      await axios.put(\`http://localhost:5000/api/admin/orders/\${selectedOrder.id}\`, { 
         status,
         internalNotes,
         quotedAmount
      }, {
        headers: { Authorization: \`Bearer \${token}\` }
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

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Customer Inquiries / Orders</h2>
      
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search by Order Number or Customer Name..." 
          className="w-full md:w-1/3 p-2 border rounded shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Ref</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company/Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{o.orderNumber}</td>
                <td className="px-6 py-4">
                  <p className="font-bold">{o.company || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{o.country || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  {o.orderItems.map(item => (
                     <div key={item.id} className="text-sm">{item.product.name} ({item.quantity})</div>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <span className={\`px-2 py-1 text-xs font-bold rounded \${o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}\`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => openOrderDetails(o)} className="text-blue-600 hover:underline font-bold">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto p-6">
            <h3 className="text-2xl font-bold mb-4">Manage Order {selectedOrder.orderNumber}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-bold">{selectedOrder.user?.name}</p>
                <p>{selectedOrder.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company & Country</p>
                <p className="font-bold">{selectedOrder.company}</p>
                <p>{selectedOrder.country}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Customer Message / Requirements</p>
                <p className="p-3 bg-gray-50 border rounded text-sm">{selectedOrder.message || 'No message provided'}</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <select className="w-full border p-2 rounded" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="PENDING">PENDING</option>
                  <option value="REVIEWING">REVIEWING</option>
                  <option value="QUOTED">QUOTED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quoted Amount (USD)</label>
                <input type="number" step="0.01" className="w-full border p-2 rounded" value={quotedAmount} onChange={e => setQuotedAmount(e.target.value)} placeholder="e.g. 5000.00" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes (Not visible to customer)</label>
                <textarea rows="3" className="w-full border p-2 rounded" value={internalNotes} onChange={e => setInternalNotes(e.target.value)}></textarea>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(adminDir, filePath), content.trim());
}
console.log('Admin B2B Files Updated');
