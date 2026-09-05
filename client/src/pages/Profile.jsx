import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Key, Mail, Phone, ShieldCheck, UserCheck, CheckCircle2, 
  AlertCircle, ChevronRight, Settings, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Profile() {
  const { user, token, logout, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [editForm, setEditForm] = useState({
    name: '', dateOfBirth: '', gender: '', companyName: '', 
    address: '', city: '', state: '', country: '', postalCode: ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailForm, setEmailForm] = useState({ newEmail: '', otp: '', step: 1 });
  const [phoneForm, setPhoneForm] = useState({ newPhone: '', otp: '', step: 1 });

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [user?.id, authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data.data);
      updateUser(res.data.data); // Keep Context in sync
      
      // Initialize edit form
      setEditForm({
        name: res.data.data.name || '',
        dateOfBirth: res.data.data.dateOfBirth ? res.data.data.dateOfBirth.split('T')[0] : '',
        gender: res.data.data.gender || '',
        companyName: res.data.data.companyName || '',
        address: res.data.data.address || '',
        city: res.data.data.city || '',
        state: res.data.data.state || '',
        country: res.data.data.country || '',
        postalCode: res.data.data.postalCode || ''
      });
    } catch (err) {
      showMessage('error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data.data);
      updateUser(res.data.data);
      showMessage('success', 'Profile updated successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showMessage('error', 'New passwords do not match');
    }
    setIsSaving(true);
    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Password changed successfully! Please log in again.');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Email Change Flow ---
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post(`${API_URL}/api/profile/change-email/request`, 
        { newEmail: emailForm.newEmail }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailForm({ ...emailForm, step: 2 });
      showMessage('success', 'OTP sent to your new email address.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to request email change');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/profile/change-email/verify`, 
        { otp: emailForm.otp }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(res.data.data);
      updateUser(res.data.data);
      setEmailForm({ newEmail: '', otp: '', step: 1 });
      showMessage('success', 'Email updated successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Phone Change Flow ---
  const handleRequestPhoneChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post(`${API_URL}/api/profile/change-phone/request`, 
        { newPhone: phoneForm.newPhone }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPhoneForm({ ...phoneForm, step: 2 });
      showMessage('success', 'OTP sent to your new mobile number.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to request mobile number change');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPhoneChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/profile/change-phone/verify`, 
        { otp: phoneForm.otp, newPhone: phoneForm.newPhone }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(res.data.data);
      updateUser(res.data.data);
      setPhoneForm({ newPhone: '', otp: '', step: 1 });
      showMessage('success', 'Mobile number updated successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
          <button onClick={() => navigate('/login')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">We couldn't load your profile information. Please try again.</p>
          <button onClick={fetchProfile} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const completionPercent = profileData?.completion || 0;
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-5 h-5" /> },
    { id: 'personal', label: 'Personal Info', icon: <Settings className="w-5 h-5" /> },
    { id: 'email', label: 'Email Address', icon: <Mail className="w-5 h-5" /> },
    { id: 'phone', label: 'Mobile Number', icon: <Phone className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security.</p>
        </div>

        {/* Global Messages */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 mb-6 rounded-lg border flex items-center shadow-sm ${
                message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
              }`}
            >
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-3" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Menu */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sticky top-28">
              <nav className="flex flex-col space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{tab.icon}</span>
                      {tab.label}
                    </div>
                    {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
              
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 mb-10 border-b pb-8">
                    <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold uppercase shadow-lg">
                      {profileData.name.charAt(0)}
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                      <p className="text-gray-500">{profileData.email}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                          {profileData.role}
                        </span>
                        {profileData.emailVerified && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Email Verified
                          </span>
                        )}
                        {profileData.phoneVerified && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Mobile Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800">Profile Completion</h3>
                      <span className="font-bold text-blue-600">{completionPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${completionPercent}%` }} 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      {completionPercent < 100 
                        ? 'Complete your profile to improve your account experience.' 
                        : 'Awesome! Your profile is complete.'}
                    </p>
                    {completionPercent < 100 && (
                      <button onClick={() => setActiveTab('personal')} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">
                        Complete Profile →
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: PERSONAL INFO */}
              {activeTab === 'personal' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input required type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Optional)</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4 border-b pb-2">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                          value={editForm.postalCode} onChange={e => setEditForm({...editForm, postalCode: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* TAB: EMAIL */}
              {activeTab === 'email' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Address</h2>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Current Email</p>
                      <p className="text-lg font-bold text-gray-900">{profileData.email}</p>
                    </div>
                    <div>
                      {profileData.emailVerified ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" /> Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Change Email Address</h3>
                    {emailForm.step === 1 ? (
                      <form onSubmit={handleRequestEmailChange} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                          <input required type="email" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                            value={emailForm.newEmail} onChange={e => setEmailForm({...emailForm, newEmail: e.target.value})} />
                        </div>
                        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {isSaving ? 'Sending OTP...' : 'Send Verification Code'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyEmailChange} className="space-y-4 max-w-md">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                          We sent a 6-digit code to <strong>{emailForm.newEmail}</strong>.
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code (OTP)</label>
                          <input required type="text" maxLength={6} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border text-center text-lg tracking-widest" 
                            value={emailForm.otp} onChange={e => setEmailForm({...emailForm, otp: e.target.value})} placeholder="000000" />
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setEmailForm({...emailForm, step: 1})} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Cancel
                          </button>
                          <button type="submit" disabled={isSaving} className="flex-1 bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {isSaving ? 'Verifying...' : 'Verify & Update Email'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: MOBILE */}
              {activeTab === 'phone' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Mobile Number</h2>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Current Mobile</p>
                      <p className="text-lg font-bold text-gray-900">{profileData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      {profileData.phone ? (
                        profileData.phoneVerified ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" /> Not Verified
                          </span>
                        )
                      ) : null}
                    </div>
                  </div>

                  <div className="border-t pt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{profileData.phone ? 'Change Mobile Number' : 'Add Mobile Number'}</h3>
                    {phoneForm.step === 1 ? (
                      <form onSubmit={handleRequestPhoneChange} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Mobile Number (with country code, e.g. +91)</label>
                          <input required type="tel" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border" 
                            value={phoneForm.newPhone} onChange={e => setPhoneForm({...phoneForm, newPhone: e.target.value})} placeholder="+91 9876543210" />
                        </div>
                        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {isSaving ? 'Sending OTP...' : 'Send Verification Code'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyPhoneChange} className="space-y-4 max-w-md">
                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                          We sent an SMS with a 6-digit code to <strong>{phoneForm.newPhone}</strong>.
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code (OTP)</label>
                          <input required type="text" maxLength={6} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border text-center text-lg tracking-widest" 
                            value={phoneForm.otp} onChange={e => setPhoneForm({...phoneForm, otp: e.target.value})} placeholder="000000" />
                        </div>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setPhoneForm({...phoneForm, step: 1})} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Cancel
                          </button>
                          <button type="submit" disabled={isSaving} className="flex-1 bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {isSaving ? 'Verifying...' : 'Verify & Update Mobile'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: SECURITY */}
              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Security</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button 
                      onClick={() => setActiveTab('email')}
                      className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-800">Email Verification</span>
                      </div>
                      {profileData.emailVerified ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-yellow-500" />}
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('phone')}
                      className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-800">Mobile Verification</span>
                      </div>
                      {profileData.phoneVerified ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-yellow-500" />}
                    </button>
                    
                    <button 
                      className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <UserCheck className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-800">Google Login</span>
                      </div>
                      {profileData.googleId ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-sm text-gray-500">Not Connected</span>}
                    </button>
                    
                    <button 
                      onClick={() => document.getElementById('change-password-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="border rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <Key className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-800">Password</span>
                      </div>
                      {profileData.password ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Set Password</span>}
                    </button>
                  </div>

                  <div id="change-password-section" className="border-t pt-8">
                    <div className="flex items-center mb-6 text-blue-900">
                      <Key className="w-6 h-6 mr-3" />
                      <h3 className="text-xl font-bold">{profileData.password ? 'Change Password' : 'Set Local Password'}</h3>
                    </div>
                    
                    {!profileData.password && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-6">
                        Your account is currently using Google Login. Setting a local password will allow you to log in with your email and password as well.
                      </div>
                    )}
                    
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                      {profileData.password && (
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Current Password</label>
                          <input type="password" required className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3 border" 
                            value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                          <input type="password" required minLength={6} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3 border" 
                            value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                          <input type="password" required minLength={6} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-3 border" 
                            value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={isSaving} className="bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-900 transition disabled:opacity-50">
                          {isSaving ? 'Saving...' : (profileData.password ? 'Update Password' : 'Set Password')}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
