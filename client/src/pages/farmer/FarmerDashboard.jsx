import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Leaf, Package, CheckCircle, Clock, ShoppingBag } from 'lucide-react';

export default function FarmerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/farmers/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-green-600">
        <Leaf size={48} />
      </motion.div>
    </div>
  );

  const statCards = [
    { title: 'Total Products Added', value: stats?.totalProducts || 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Products Under Review', value: stats?.underReview || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
    { title: 'Approved / Shortlisted', value: stats?.approvedProducts || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Active Enquiries', value: stats?.activeEnquiries || 0, icon: ShoppingBag, color: 'text-teal-600', bg: 'bg-teal-100' },
    { title: 'Completed Purchases', value: stats?.completedPurchases || 0, icon: Leaf, color: 'text-lime-600', bg: 'bg-lime-100' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-32 pb-12 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="absolute top-0 right-0 -translate-y-12 translate-x-12">
        <Leaf size={400} className="text-green-600 rotate-45" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500 mb-2">
              Farmer Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Manage your agricultural products and organic supplies.</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex gap-4">
            <Link to="/farmer/products" className="bg-white text-emerald-600 border-2 border-emerald-100 px-6 py-3 rounded-full shadow-lg hover:shadow-xl font-bold transition-all flex items-center gap-2">
              <Package size={20} /> My Products
            </Link>
            <Link to="/farmer/products/add" className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl font-bold transition-all flex items-center gap-2">
              <Package size={20} /> Add New Product
            </Link>
          </motion.div>
        </motion.div>
        
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {statCards.map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants} whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)' }} className="bg-white/80 backdrop-blur-md overflow-hidden rounded-2xl border border-green-100 shadow-sm transition-all relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <stat.icon size={100} className={stat.color} />
              </div>
              <div className="p-6 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <dt className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</dt>
                </div>
                <dd className="mt-2 text-5xl font-black text-gray-800">{stat.value}</dd>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-16 bg-white/60 backdrop-blur-lg border border-emerald-100 p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="text-green-600" /> B2B Opportunities
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/farmer/enquiries" className="bg-white text-green-700 border-2 border-green-200 px-6 py-3 rounded-full hover:bg-green-50 font-bold transition-colors shadow-sm flex items-center gap-2">
              Review Enquiries
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
