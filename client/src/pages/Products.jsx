import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Package } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');

  useEffect(() => {
    setIsLoading(true);
    axios.get(`${API_URL}/api/products`)
      .then(res => {
        setProducts(res.data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('All');
    }
  }, [categoryParam]);

  const categories = ['All', 'Fruits', 'Vegetables', 'Spices', 'Grains & Pulses'];

  // Map UI category names to backend database enums
  const mapCategoryToDb = (uiCategory) => {
    switch (uiCategory) {
      case 'Fruits': return 'FRUIT';
      case 'Vegetables': return 'VEGETABLE';
      case 'Spices': return 'SPICE';
      case 'Grains & Pulses': return 'GRAIN';
      default: return uiCategory;
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === mapCategoryToDb(selectedCategory));

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Page Header */}
        <section className="bg-blue-900 pt-16 pb-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent"></div>
          <div className="container mx-auto relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-extrabold text-white mb-4"
            >
              Premium Product Catalog
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-blue-200 max-w-2xl mx-auto text-lg"
            >
              Discover our export-quality agricultural products sourced directly from trusted farmers.
            </motion.p>
          </div>
        </section>

        <main className="container mx-auto px-4 py-12 flex-1 -mt-10 relative z-20">
          
          {/* Category Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-2 mb-12 flex flex-wrap gap-2 justify-center"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  if (cat === 'All') {
                    navigate('/products');
                  } else {
                    navigate(`/products?category=${encodeURIComponent(cat)}`);
                  }
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedCategory === cat 
                    ? 'bg-green-500 text-white shadow-md transform scale-105' 
                    : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-96 flex flex-col">
                   <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                   <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                   <div className="space-y-2 flex-1">
                     <div className="h-3 bg-gray-200 rounded w-full"></div>
                     <div className="h-3 bg-gray-200 rounded w-full"></div>
                     <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                   </div>
                   <div className="h-10 bg-gray-200 rounded mt-4"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"
            >
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500">We couldn't find any products in the '{selectedCategory}' category.</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredProducts.map(p => (
                <motion.div 
                  key={p.id} 
                  variants={fadeUp}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group overflow-hidden"
                >
                  <div className="h-56 bg-gray-100 relative overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl.startsWith('/uploads') ? `${API_URL}${p.imageUrl}` : p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                        <Package className="w-10 h-10 opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {p.category}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col relative bg-white transform transition-transform duration-300 group-hover:-translate-y-2">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">{p.name}</h2>
                    <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                        <span className="font-medium">Origin:</span> 
                        <span className="text-gray-800">{p.origin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">MOQ:</span> 
                        <span className="text-gray-800 font-semibold">{p.minimumOrderQuantity} {p.unit}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1">{p.description}</p>
                    
                    <button 
                      onClick={() => navigate(`/checkout?product=${p.id}`)}
                      className="w-full bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center group/btn"
                    >
                      Request Quote
                      <ArrowRight className="ml-2 w-4 h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}