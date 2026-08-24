import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (res.data.data.user.role !== 'ADMIN') {
         alert('Access denied. Admin only.');
         return;
      }
      localStorage.setItem('adminToken', res.data.data.token);
      navigate('/');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <form onSubmit={handleLogin} className="bg-slate-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-slate-700/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Admin Portal</h2>
          <p className="text-slate-400">Secure access to control panel</p>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input type="email" placeholder="admin@example.com" className="w-full bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
        </div>

        <button type="submit" className="mt-8 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-0.5">
          Authenticate
        </button>
        
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <a href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Customer Login
          </a>
        </div>
      </form>
    </div>
  );
}