import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [imageFile, setImageFile] = useState(null);

  function getInitialFormData() {
    return {
      name: '',
      category: '',
      hsnCode: '',
      description: '',
      price: '',
      priceOnRequest: false,
      unit: 'kg',
      minimumOrderQuantity: '100',
      stock: '1000',
      imageUrl: '',
      origin: '',
      packagingOptions: '',
      certifications: '',
      shelfLife: '',
      tags: '',
      exportAvailability: false,
      featuredProduct: false,
      isActive: true
    };
  }

  const fetchProducts = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/login');
    
    axios.get(`${API_URL}/api/products/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProducts(res.data.data || []))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/login');
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(getInitialFormData());
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      hsnCode: product.hsnCode || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      priceOnRequest: product.priceOnRequest || false,
      unit: product.unit || 'kg',
      minimumOrderQuantity: product.minimumOrderQuantity?.toString() || '100',
      stock: product.stock?.toString() || '1000',
      imageUrl: product.imageUrl || '',
      origin: product.origin || '',
      packagingOptions: product.packagingOptions || '',
      certifications: product.certifications || '',
      shelfLife: product.shelfLife || '',
      tags: product.tags || '',
      exportAvailability: product.exportAvailability || false,
      featuredProduct: product.featuredProduct || false,
      isActive: product.isActive !== false
    });
    setImageFile(null);
    setShowModal(true);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API_URL}/api/products/${id}/status`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/products/${editingId}`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`${API_URL}/api/products`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product. Please try again.');
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? p.category === categoryFilter : true;
    const matchStatus = statusFilter ? (statusFilter === 'active' ? p.isActive : !p.isActive) : true;
    return matchSearch && matchCat && matchStatus;
  });

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Products Management</h2>
        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Product
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search products..." 
          className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Image</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">HSN</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4">
                  {p.imageUrl ? <img src={p.imageUrl.startsWith('/uploads') ? `${API_URL}${p.imageUrl}` : p.imageUrl} alt={p.name} className="h-10 w-10 object-cover rounded shadow-sm" /> : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">No Img</div>}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.category}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{p.hsnCode || 'N/A'}</td>
                <td className="px-6 py-4 font-bold text-gray-800">
                  {p.priceOnRequest ? <span className="text-blue-600 text-sm">Price on Request</span> : `₹${p.price} / ${p.unit}`}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(p.id, p.isActive)} className={`px-3 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 flex justify-center space-x-3">
                  <button onClick={() => openEditModal(p)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" /></svg>
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8"
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 uppercase text-sm">Basic Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input type="text" name="name" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input type="text" name="category" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.category} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                      <input type="text" name="hsnCode" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.hsnCode} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea name="description" rows="3" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.description} onChange={handleInputChange}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                      <input type="file" accept="image/*" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleFileChange} />
                      {formData.imageUrl && !imageFile && (
                        <div className="mt-2 text-sm text-gray-500">Current: <a href={formData.imageUrl.startsWith('/uploads') ? `${API_URL}${formData.imageUrl}` : formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View Image</a></div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Inventory */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 uppercase text-sm">Pricing & Inventory</h4>
                    <div className="flex items-center mb-2">
                      <input type="checkbox" id="priceOnRequest" name="priceOnRequest" checked={formData.priceOnRequest} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label htmlFor="priceOnRequest" className="ml-2 block text-sm text-gray-900 font-medium">Price on Request</label>
                    </div>
                    {!formData.priceOnRequest && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input type="number" step="0.01" name="price" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.price} onChange={handleInputChange} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit (e.g. kg, pcs)</label>
                        <input type="text" name="unit" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.unit} onChange={handleInputChange} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Qty</label>
                        <input type="number" name="minimumOrderQuantity" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.minimumOrderQuantity} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock Availability</label>
                      <input type="number" name="stock" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.stock} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                      <input type="text" name="origin" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.origin} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                
                {/* Extra Details & Settings */}
                <div className="border-t pt-4">
                   <h4 className="font-bold text-gray-700 uppercase text-sm mb-4">Additional Details & Flags</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Options</label>
                       <input type="text" name="packagingOptions" placeholder="e.g. 5kg, 10kg boxes" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.packagingOptions} onChange={handleInputChange} />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                       <input type="text" name="certifications" placeholder="e.g. ISO, Organic" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.certifications} onChange={handleInputChange} />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life</label>
                       <input type="text" name="shelfLife" placeholder="e.g. 12 Months" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.shelfLife} onChange={handleInputChange} />
                     </div>
                   </div>
                   
                   <div className="flex flex-wrap gap-6 mt-6">
                      <div className="flex items-center">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <label htmlFor="isActive" className="ml-2 block text-sm font-bold text-gray-900">Active / Enabled</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="exportAvailability" name="exportAvailability" checked={formData.exportAvailability} onChange={handleInputChange} className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <label htmlFor="exportAvailability" className="ml-2 block text-sm font-bold text-gray-900">Available for Export</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="featuredProduct" name="featuredProduct" checked={formData.featuredProduct} onChange={handleInputChange} className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <label htmlFor="featuredProduct" className="ml-2 block text-sm font-bold text-gray-900">Featured Product</label>
                      </div>
                   </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

