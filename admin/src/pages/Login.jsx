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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <input type="email" placeholder="Email" className="w-full border-none p-2 mb-4 rounded text-black" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full border-none p-2 mb-6 rounded text-black" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="w-full bg-blue-600 p-2 rounded font-bold hover:bg-blue-700">Login</button>
        <div className="mt-4 text-center">
          <a href="/login" className="text-gray-400 hover:text-white text-sm underline">Switch to Customer Login</a>
        </div>
      </form>
    </div>
  );
}