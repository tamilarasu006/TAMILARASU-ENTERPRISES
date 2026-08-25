import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Globe2, ShieldCheck, Package, Ship, Star } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || '';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get(`${API_URL}/api/services`)
      .then(res => {
        setServices(res.data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // Map string icon names to actual Lucide components, fallback to Star
  const getIconComponent = (iconName) => {
    if (!iconName) return Star;
    const lowerName = iconName.toLowerCase();
    if (lowerName.includes('globe')) return Globe2;
    if (lowerName.includes('shield')) return ShieldCheck;
    if (lowerName.includes('package')) return Package;
    if (lowerName.includes('ship')) return Ship;
    return Star;
  };

  return (
    <PageTransition>
      <div className="font-sans text-gray-800 bg-gray-50 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="bg-blue-900 text-white py-24 text-center relative overflow-hidden -mt-[88px] pt-[150px]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-6xl font-extrabold mb-4"
            >
              Our Services
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl font-light text-blue-200 max-w-2xl mx-auto"
            >
              Comprehensive solutions for your international agricultural trade needs.
            </motion.p>
          </div>
        </section>

        <main className="flex-grow container mx-auto px-4 py-24 relative z-20">
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold text-blue-900 mb-6">What We Do</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-green-400 mx-auto"></div>
          </motion.div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-3xl p-10 animate-pulse h-48">
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl shrink-0"></div>
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No services currently available. Check back soon!
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {services.map((service, index) => {
                const Icon = getIconComponent(service.icon);
                return (
                  <motion.div 
                    key={service.id} 
                    variants={fadeUp}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 flex flex-col sm:flex-row items-start sm:space-x-6 group hover:-translate-y-2 relative overflow-hidden"
                  >
                    <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-blue-500"></div>
                    
                    {service.imageUrl ? (
                      <div className="w-20 h-20 shrink-0 mb-6 sm:mb-0 rounded-2xl overflow-hidden shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                         <img src={service.imageUrl.startsWith('/uploads') ? `${API_URL}${service.imageUrl}` : service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl mb-6 sm:mb-0 shrink-0 bg-blue-50 text-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                        <Icon className="w-10 h-10" />
                      </div>
                    )}
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-900 transition-colors">{service.title}</h3>
                      <p className="text-blue-500 text-sm font-semibold mb-3">{service.category}</p>
                      <p className="text-gray-600 leading-relaxed mb-4">{service.description}</p>
                      
                      {service.highlights && (
                        <div className="flex flex-wrap gap-2">
                          {service.highlights.split(',').map((h, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{h.trim()}</span>
                          ))}
                        </div>
                      )}
                      
                      {service.pricingQuotationRequired && (
                        <div className="mt-4 text-sm font-bold text-orange-500">Quotation Required</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>

        <footer className="bg-blue-900 text-white py-8 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-400">© 2026 Tamilarasu Enterprises. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
