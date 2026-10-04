import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Leaf, LogIn } from 'lucide-react';

export default function FarmerLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuth();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn && user?.role === 'FARMER') {
      navigate('/farmer/dashboard');
    }
  }, [isLoggedIn, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/farmers/login`, formData);
      if (response.data.success) {
        toast.success('Login successful!');
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        login(response.data.data.user, response.data.data.token);
        navigate('/farmer/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Decorative background */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="absolute -bottom-24 -left-24">
        <Leaf size={400} className="text-green-800 rotate-45" />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.05 }} className="absolute -top-24 -right-24">
        <Leaf size={300} className="text-green-600 -rotate-90" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white relative z-10"
      >
        <div className="text-center">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Leaf className="text-white w-8 h-8" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-emerald-600">
            Farmer Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Sign in to manage your agricultural supply
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email address or Phone</label>
              <input
                type="text" required
                className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm"
                placeholder="Enter email or phone"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password" required
                className="w-full px-4 py-3 bg-white/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 focus:outline-none shadow-lg hover:shadow-xl transition-all items-center disabled:opacity-50"
          >
            {loading ? 'Logging in...' : <><LogIn className="w-5 h-5 mr-2" /> Sign In</>}
          </motion.button>
          <div className="text-center">
            <Link to="/farmer/register" className="font-semibold text-green-600 hover:text-green-500">
              Don't have an account? Register as a Farmer
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
