import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();

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
             <Link 
               to="/login" 
               className="bg-white text-blue-900 px-5 py-2 rounded shadow-md hover:bg-gray-100 transition transform hover:-translate-y-0.5 active:translate-y-0 font-bold ml-4"
             >
               Login
             </Link>
          </motion.div>
        </nav>
      </div>
    </motion.header>
  );
}
