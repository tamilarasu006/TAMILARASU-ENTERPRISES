import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        Please log in to view your profile.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return setError('New password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Password changed successfully! Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-32 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Profile Info Sidebar */}
        <div className="md:w-1/3 bg-blue-900 text-white p-8 flex flex-col items-center justify-center border-r">
          <div className="bg-white/20 p-4 rounded-full mb-4">
            <User className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold mb-1 text-center">{user.name}</h2>
          <p className="text-blue-200 mb-6 text-center">{user.email}</p>
          
          <div className="w-full space-y-3">
             <div className="bg-blue-800/50 p-3 rounded-lg text-sm">
               <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Account Role</p>
               <p className="font-medium">{user.role || 'Customer'}</p>
             </div>
             <div className="bg-blue-800/50 p-3 rounded-lg text-sm">
               <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">Email Status</p>
               <p className="font-medium">{user.emailVerified ? 'Verified' : 'Unverified'}</p>
             </div>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="md:w-2/3 p-8">
          <div className="flex items-center mb-6 text-blue-900 border-b pb-4">
            <Key className="w-6 h-6 mr-3" />
            <h3 className="text-2xl font-bold">Change Password</h3>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-100">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
              <input
                type="password"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 px-4 py-3 border"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 px-4 py-3 border"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 px-4 py-3 border"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition w-full md:w-auto disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
