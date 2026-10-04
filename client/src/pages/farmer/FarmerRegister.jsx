import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Leaf, UserPlus } from 'lucide-react';

export default function FarmerRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    farmName: '', farmLocation: '', district: '', state: '', pincode: '',
    farmSize: '', farmingType: '', mainProducts: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/farmers/register`, formData);
      if (response.data.success) {
        toast.success('Registration successful! Please login.');
        navigate('/farmer/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="absolute -top-24 -left-24">
        <Leaf size={400} className="text-green-800 -rotate-12" />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.05 }} className="absolute -bottom-24 -right-24">
        <Leaf size={300} className="text-green-600 rotate-90" />
      </motion.div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-10">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Leaf className="text-white w-8 h-8" />
          </motion.div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-emerald-600">
            Join the Farmer Network
          </h2>
          <p className="mt-2 text-gray-600 font-medium">Supply your organic products directly to B2B clients</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          onSubmit={handleSubmit} 
          className="bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-900 border-b border-green-100 pb-2 flex items-center"><UserPlus className="w-5 h-5 mr-2 text-green-500" /> Personal Details</h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-900 border-b border-green-100 pb-2 flex items-center"><Leaf className="w-5 h-5 mr-2 text-green-500" /> Farm Information</h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Farm/Company Name</label>
                <input type="text" name="farmName" required value={formData.farmName} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Village/Town</label>
                <input type="text" name="farmLocation" required value={formData.farmLocation} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">District</label>
                  <input type="text" name="district" required value={formData.district} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                  <input type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pincode</label>
                  <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Farming Type</label>
                  <input type="text" name="farmingType" placeholder="Organic/Conventional" value={formData.farmingType} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-green-100 pt-8">
            <Link to="/farmer/login" className="font-semibold text-green-600 hover:text-green-500 mb-4 sm:mb-0">
              Already have an account? Sign in
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit" disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center disabled:opacity-50"
            >
              {loading ? 'Submitting...' : <><UserPlus className="w-5 h-5 mr-2" /> Register Farm</>}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
