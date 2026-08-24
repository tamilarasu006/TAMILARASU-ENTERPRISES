import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return navigate('/login');
    }
    axios.get('http://localhost:5000/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrders(res.data.data))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/login');
      });
      
    axios.get('http://localhost:5000/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProducts(res.data.data))
      .catch(console.error);
  }, [navigate]);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants}>
      <motion.h2 variants={itemVariants} className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</motion.h2>
      
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 hover:-translate-y-1 transition-transform">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Inquiries</h3>
          <p className="text-4xl font-extrabold text-gray-800 mt-2">{totalOrders}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 hover:-translate-y-1 transition-transform">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Pending Review</h3>
          <p className="text-4xl font-extrabold text-gray-800 mt-2">{pendingOrders}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:-translate-y-1 transition-transform">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Quoted & Processing</h3>
          <p className="text-4xl font-extrabold text-gray-800 mt-2">{quotedOrders + processingOrders}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:-translate-y-1 transition-transform">
          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Products</h3>
          <p className="text-4xl font-extrabold text-gray-800 mt-2">{totalProducts}</p>
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-100">
         <h3 className="text-xl font-bold mb-6 text-gray-800">Inquiry Status Overview</h3>
         <div className="h-72">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} />
               <YAxis axisLine={false} tickLine={false} />
               <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
               <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </motion.div>
    </motion.div>
  );
}