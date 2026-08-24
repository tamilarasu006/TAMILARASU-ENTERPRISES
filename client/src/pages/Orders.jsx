import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if(token) {
      axios.get('http://localhost:5000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setOrders(res.data.data)).catch(console.error);
    }
  }, []);

  const confirmOrder = async (orderId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order Confirmed!');
      // Refresh orders
      axios.get('http://localhost:5000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setOrders(res.data.data)).catch(console.error);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm order');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? <p>No orders found.</p> : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="border p-6 rounded bg-white shadow flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-lg text-blue-900">{o.orderNumber}</p>
                <p className="text-sm text-gray-600 mb-2">Requested on: {new Date(o.createdAt).toLocaleDateString()}</p>
                <div className="text-sm">
                  {o.orderItems.map(item => (
                     <p key={item.id}>• {item.product.name} (Qty: {item.quantity})</p>
                  ))}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <span className={`px-3 py-1 font-bold rounded text-xs ${o.status === 'QUOTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {o.status}
                </span>
                
                {o.quotedAmount && (
                   <p className="font-bold text-xl text-green-700">Quote: ${o.quotedAmount}</p>
                )}

                {o.status === 'QUOTED' && (
                  <button 
                    onClick={() => confirmOrder(o.id)}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition font-bold text-sm"
                  >
                    Confirm Quote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}