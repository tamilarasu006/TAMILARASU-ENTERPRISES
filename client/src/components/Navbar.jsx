import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { User, LogOut, Package, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();

  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Make navbar transparent only on the home page when at the top
  const isHome = location.pathname === '/';

  const navBackground = useTransform(
    scrollY,
    [0, 50],
    [
      isHome ? 'rgba(30, 58, 138, 0)' : 'rgba(30, 58, 138, 1)', // 0: transparent if home, else blue-900
      'rgba(30, 58, 138, 0.95)' // 50: blue-900 with slight transparency
    ]
  );

  const navShadow = useTransform(
    scrollY,
    [0, 50],
    ['none', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)']
  );
  
  const navBackdropBlur = useTransform(
    scrollY,
    [0, 50],
    ['blur(0px)', 'blur(8px)']
  );

  const navPadding = useTransform(
    scrollY,
    [0, 50],
    ['1.5rem', '1rem']
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Services', path: '/services' },
  ];

  return (
    <motion.header
      style={{
        backgroundColor: navBackground,
        boxShadow: navShadow,
        backdropFilter: navBackdropBlur,
        paddingTop: navPadding,
        paddingBottom: navPadding,
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3 group">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src="/static/images/logo-1.jpg" 
            alt="VSRT Logo" 
            className="h-12 w-12 rounded-full bg-white object-cover shadow-sm group-hover:scale-110 transition-transform" 
            onError={(e) => e.target.style.display='none'} 
          />
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold tracking-wider text-white"
          >
            TAMILARASU ENTERPRISES
          </motion.h1>
        </Link>
        
        <nav className="space-x-8 hidden md:flex font-semibold items-center">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link 
                to={link.path} 
                className={`text-white hover:text-blue-200 transition relative group ${location.pathname === link.path ? 'text-blue-200' : ''}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-300 transition-all duration-300 group-hover:w-full ${location.pathname === link.path ? 'w-full' : ''}`}></span>
              </Link>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: navLinks.length * 0.1 }}
          >
            {!isLoggedIn ? (
              <Link 
                to="/login" 
                className="bg-white text-blue-900 px-5 py-2 rounded shadow-md hover:bg-gray-100 transition transform hover:-translate-y-0.5 active:translate-y-0 font-bold ml-4"
              >
                Login
              </Link>
            ) : (
              <div className="relative ml-4">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition focus:outline-none flex items-center justify-center"
                >
                  <User className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 py-2"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        <span className="font-medium text-sm">Profile & Settings</span>
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      >
                        <Package className="w-4 h-4 mr-3" />
                        <span className="font-medium text-sm">My Orders</span>
                      </Link>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        <span className="font-medium text-sm">Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-blue-900 border-t border-blue-800 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-white font-semibold text-lg ${location.pathname === link.path ? 'text-blue-300' : ''}`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="h-px bg-blue-800 my-2"></div>
              
              {!isLoggedIn ? (
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-white text-blue-900 px-5 py-3 rounded text-center font-bold"
                >
                  Login
                </Link>
              ) : (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white font-semibold flex items-center text-lg"
                  >
                    <User className="w-5 h-5 mr-3" />
                    Profile & Settings
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white font-semibold flex items-center text-lg"
                  >
                    <Package className="w-5 h-5 mr-3" />
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-red-400 font-semibold flex items-center text-lg text-left"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
