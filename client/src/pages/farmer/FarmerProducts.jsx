import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Leaf, Plus, Trash2, Edit, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FarmerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/farmers/products/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/farmers/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Product deleted successfully');
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-green-600">
        <Leaf size={48} />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-32 pb-12 relative overflow-x-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="absolute -top-24 -left-24">
        <Leaf size={400} className="text-green-800 -rotate-12" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-emerald-600">
              My Products
            </h2>
            <p className="mt-2 text-gray-600">Manage all your added agricultural products</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/farmer/products/add" className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl font-bold transition-all flex items-center gap-2">
              <Plus size={20} /> Add New Product
            </Link>
          </motion.div>
        </motion.div>

        {products.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-12 text-center border border-white">
            <Package size={64} className="mx-auto text-green-200 mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Products Found</h3>
            <p className="text-gray-500">You haven't listed any agricultural products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.1 }}
                key={product.id} 
                className="bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden border border-white flex flex-col relative group"
              >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL}/${product.images[0].url}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-50 text-green-200">
                      <Leaf size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-green-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {product.status}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-emerald-600 font-semibold mb-4">{product.category} • {product.isOrganic ? 'Organic' : 'Conventional'}</p>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-gray-600 text-sm flex justify-between">
                      <span>Available Qty:</span> 
                      <span className="font-bold text-gray-800">{product.availableQty} {product.unit}</span>
                    </p>
                    <p className="text-gray-600 text-sm flex justify-between">
                      <span>Expected Price:</span> 
                      <span className="font-bold text-green-700">₹{product.expectedPrice} / {product.priceUnit}</span>
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
