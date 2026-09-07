import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, QrCode, ScanLine } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [showQRModal, setShowQRModal] = useState(null); // stores order for which to show QR
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [scanError, setScanError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if(token) {
      axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setOrders(res.data.data)).catch(console.error);
    }
  }, [token]);

  const confirmOrder = async (orderId) => {
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order Confirmed!');
      // Refresh orders
      axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setOrders(res.data.data)).catch(console.error);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm order');
    }
  };

  const handleScan = async (scannedData) => {
    try {
      const result = scannedData[0]?.rawValue || scannedData;
      if (!result) return;
      
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

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <button 
          onClick={() => { setShowScannerModal(true); setScannedOrder(null); setScanError(''); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          <ScanLine size={18} />
          Scan Order QR
        </button>
      </div>

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

                <div className="flex gap-2 mt-2">
                  {o.qrToken && (
                    <button 
                      onClick={() => setShowQRModal(o)}
                      className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded shadow hover:bg-gray-900 transition font-bold text-sm"
                    >
                      <QrCode size={16} /> QR
                    </button>
                  )}
                  {o.status === 'QUOTED' && (
                    <button 
                      onClick={() => confirmOrder(o.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition font-bold text-sm"
                    >
                      Confirm Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Display Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
            <p className="text-xs text-center text-gray-400 mt-4">Scan this code to quickly retrieve order details securely.</p>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
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
                {scanError && <p className="text-red-500 text-sm font-semibold">{scanError}</p>}
                <p className="text-xs text-gray-500 text-center mt-2">Point your camera at the order QR code.</p>
              </>
            ) : (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-700">Order Found</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded text-sm space-y-2 border">
                  <p><strong>Order Number:</strong> {scannedOrder.orderNumber}</p>
                  <p><strong>Status:</strong> {scannedOrder.status}</p>
                  <p><strong>Total Amount:</strong> ${scannedOrder.totalAmount}</p>
                  <p><strong>Date:</strong> {new Date(scannedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="font-bold mt-2">Items:</p>
                  <ul className="list-disc pl-5">
                    {scannedOrder.orderItems.map(item => (
                      <li key={item.id}>{item.product.name} (x{item.quantity})</li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={() => { setScannedOrder(null); setScanError(''); }}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Scan Another Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}