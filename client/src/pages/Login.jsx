import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
const API_URL = import.meta.env.VITE_API_URL || '';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // Email or Mobile
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedData, setUnverifiedData] = useState(null);
  const { login } = useAuth();

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedData(null);

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/auth/login`, { email: identifier, password });
      
      // If successful, store token and redirect
      login(res.data.data.user, res.data.data.token);
      navigate('/products');
    } catch (err) {
      if (err.response?.data?.code === 'UNVERIFIED_ACCOUNT') {
        setError(err.response.data.message);
        setUnverifiedData(err.response.data.data); // Contains email, phone, etc.
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueVerification = () => {
    if (unverifiedData?.email) {
      navigate(`/verify-account?email=${encodeURIComponent(unverifiedData.email)}`);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        credential: credentialResponse.credential,
      });
      login(res.data.data.user, res.data.data.token);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled.');
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center bg-gray-50 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin} 
          className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-gray-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-blue-900 mb-2">Customer Login</h2>
            <p className="text-gray-500">Welcome back to Tamilarasu Enterprises.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex flex-col items-start">
              <div className="flex items-start mb-2">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              {unverifiedData && (
                <button 
                  type="button" 
                  onClick={handleContinueVerification}
                  className="mt-2 text-sm bg-red-100 text-red-800 font-semibold px-4 py-2 rounded-lg hover:bg-red-200 transition-colors w-full"
                >
                  Continue Verification
                </button>
              )}
            </motion.div>
          )}

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="pill"
            />
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-400 font-semibold uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email or Mobile Number</label>
              <input type="text" placeholder="e.g. rahul@example.com or +919876543210" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 font-semibold hover:underline">Forgot password?</Link>
              </div>
              <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-8 w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-800 transition-all flex justify-center items-center disabled:opacity-70">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <a href="/admin/login" className="text-gray-400 hover:text-blue-600 text-sm font-medium transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Admin Login
            </a>
          </div>
        </motion.form>
      </div>
    </PageTransition>
  );
}