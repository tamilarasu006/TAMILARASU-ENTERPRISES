import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft, UploadCloud } from 'lucide-react';

export default function AddFarmerProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', variety: '', description: '',
    grade: '', qualityDesc: '', farmingMethod: '', isOrganic: false, size: '', appearance: '', freshness: '',
    availableQty: '', unit: 'KG', minOrderQty: '', harvestDate: '', readyDate: '',
    expectedPrice: '', priceUnit: 'KG', paymentTerms: '',
    farmName: '', farmLocation: '', district: '', state: '', pincode: ''
  });
  const [images, setImages] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      if (images) {
        for (let i = 0; i < images.length; i++) {
          data.append('images', images[i]);
        }
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/farmers/products`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Product added successfully!');
        navigate('/farmer/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 5) {
      toast.error('You can only upload up to 5 images.');
      e.target.value = null; // reset
      setImages(null);
    } else {
      setImages(e.target.files);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pt-32 pb-12 relative overflow-x-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.05 }} className="absolute -top-20 -left-20">
        <Leaf size={500} className="text-green-800 -rotate-12" />
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/farmer/dashboard" className="text-emerald-700 hover:text-emerald-900 flex items-center font-semibold mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-emerald-600">
              Add Farm Product
            </h2>
            <p className="mt-2 text-gray-600">List your fresh produce for B2B procurement</p>
          </div>
          <div className="hidden md:flex p-4 bg-white/60 backdrop-blur-md rounded-full shadow-sm">
            <Leaf className="text-green-500 w-8 h-8" />
          </div>
        </motion.div>

        <motion.form 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} 
          className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white"
        >
          <div className="p-8 sm:p-10 space-y-10">
            
            {/* Basic Info */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white/50 p-6 rounded-2xl border border-green-50 transition-transform">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-900 flex items-center"><Leaf className="w-5 h-5 mr-2 text-green-500"/> Basic Information</h3>
                <p className="text-sm text-gray-500">Identify your product clearly</p>
              </div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700">Product Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-2 block w-full rounded-xl border-gray-200 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm p-3 border transition-colors" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700">Category</label>
                  <select name="category" required value={formData.category} onChange={handleChange} className="mt-2 block w-full rounded-xl border-gray-200 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm p-3 border transition-colors">
                    <option value="">Select Category</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Spices">Spices</option>
                    <option value="Nuts">Nuts</option>
                  </select>
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-sm font-semibold text-gray-700">Description</label>
                  <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-2 block w-full rounded-xl border-gray-200 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm p-3 border transition-colors" />
                </div>
              </div>
            </motion.div>

            {/* Commercial Info */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white/50 p-6 rounded-2xl border border-green-50 transition-transform">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-900">Commercial & Availability</h3>
              </div>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">Available Quantity</label>
                  <input type="number" name="availableQty" required value={formData.availableQty} onChange={handleChange} className="mt-2 block w-full rounded-xl border-gray-200 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm p-3 border transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">Unit</label>
                  <select name="unit" required value={formData.unit} onChange={handleChange} className="mt-2 block w-full rounded-xl border-gray-200 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm p-3 border transition-colors">
                    <option value="KG">KG</option>
                    <option value="TON">TON</option>
                    <option value="QUINTAL">QUINTAL</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">Expected Price (per unit)</label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input type="number" name="expectedPrice" required value={formData.expectedPrice} onChange={handleChange} className="block w-full pl-7 rounded-xl border-gray-200 shadow-sm focus:ring-green-500 focus:border-green-500 bg-white/50 backdrop-blur-sm p-3 border transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Media Info */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-white/50 p-6 rounded-2xl border border-green-50 transition-transform">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-900">Product Images</h3>
                <p className="text-sm text-gray-500">Upload up to 5 clear images of your product.</p>
              </div>
              <div className="mt-2 flex justify-center px-6 pt-8 pb-8 border-2 border-green-200 border-dashed rounded-2xl bg-green-50/50 hover:bg-green-50 transition-colors cursor-pointer relative">
                <div className="space-y-2 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-green-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                      <span>Upload files</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageChange} required />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB (Max 5)</p>
                  {images && <motion.p initial={{scale:0.9}} animate={{scale:1}} className="text-sm font-bold text-emerald-600 mt-2 bg-emerald-100 py-1 px-3 rounded-full inline-block">{images.length} files selected.</motion.p>}
                </div>
              </div>
            </motion.div>

          </div>

          <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
            <button type="button" onClick={() => navigate('/farmer/dashboard')} className="px-6 py-3 font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
              Cancel
            </button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : 'Submit Product'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
