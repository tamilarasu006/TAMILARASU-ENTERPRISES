import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Products from './pages/Products';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices';
import ManageAdmins from './pages/ManageAdmins';
import AcceptInvite from './pages/AcceptInvite';
import InvoiceSettings from './pages/InvoiceSettings';
import InvoicePreview from './pages/InvoicePreview';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Fetch user profile to get role
      axios.get(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
           setUserRole(res.data.data.role);
        })
        .catch(err => {
           console.error("Failed to fetch user profile", err);
           handleLogout();
        });

      const socket = io(API_URL, { auth: { token } });
      socket.on('new_order', (data) => console.log('New Order:', data));
      return () => socket.disconnect();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const navLinkClass = (path) => 
    `hover:text-blue-300 transition-colors ${location.pathname === path ? 'text-blue-300 font-bold border-b-2 border-blue-300 pb-1' : ''}`;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="font-bold text-xl tracking-wider">VSRT Admin Portal</div>
        <div className="space-x-6 flex items-center">
          <Link to="/" className={navLinkClass('/')}>Dashboard</Link>
          <Link to="/orders" className={navLinkClass('/orders')}>Orders</Link>
          <Link to="/invoices" className={navLinkClass('/invoices')}>Invoices</Link>
          <Link to="/products" className={navLinkClass('/products')}>Products</Link>
          <Link to="/services" className={navLinkClass('/services')}>Services</Link>
          {userRole === 'SUPER_ADMIN' && (
            <Link to="/admins" className={navLinkClass('/admins')}>Manage Admins</Link>
          )}
          <Link to="/settings" className={navLinkClass('/settings')}>Settings</Link>
          <button onClick={handleLogout} className="text-red-300 hover:text-red-100 ml-4 font-bold bg-white/10 px-3 py-1 rounded-md transition-colors">Logout</button>
        </div>
      </nav>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/orders" element={<AdminLayout><Orders /></AdminLayout>} />
        <Route path="/invoices" element={<AdminLayout><Invoices /></AdminLayout>} />
        <Route path="/invoices/:id" element={<AdminLayout><InvoicePreview /></AdminLayout>} />
        <Route path="/products" element={<AdminLayout><Products /></AdminLayout>} />
        <Route path="/services" element={<AdminLayout><Services /></AdminLayout>} />
        <Route path="/admins" element={<AdminLayout><ManageAdmins /></AdminLayout>} />
        <Route path="/settings" element={<AdminLayout><Settings /></AdminLayout>} />
        <Route path="/settings/invoice" element={<AdminLayout><InvoiceSettings /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
