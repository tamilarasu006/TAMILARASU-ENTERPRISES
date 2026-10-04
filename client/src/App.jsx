import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Invoices from './pages/Invoices';
import About from './pages/About';
import Services from './pages/Services';
import VerifyAccount from './pages/VerifyAccount';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';

import Contact from './pages/Contact';

import FarmerLogin from './pages/farmer/FarmerLogin';
import FarmerRegister from './pages/farmer/FarmerRegister';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AddFarmerProduct from './pages/farmer/AddFarmerProduct';
import FarmerProducts from './pages/farmer/FarmerProducts';
import FarmerEnquiries from './pages/farmer/FarmerEnquiries';
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Farmer Portal Routes */}
        <Route path="/farmer/login" element={<FarmerLogin />} />
        <Route path="/farmer/register" element={<FarmerRegister />} />
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
        <Route path="/farmer/products" element={<FarmerProducts />} />
        <Route path="/farmer/products/add" element={<AddFarmerProduct />} />
        <Route path="/farmer/enquiries" element={<FarmerEnquiries />} />

        <Route path="/admin/*" element={<AdminRedirect />} />
      </Routes>
    </AnimatePresence>
  );
}

function AdminRedirect() {
  window.location.replace('/admin/index.html#/login');
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
          <Navbar />
          <AnimatedRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;