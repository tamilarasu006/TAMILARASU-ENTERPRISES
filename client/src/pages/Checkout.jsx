import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  
  // Submit states: 'idle', 'submitting', 'success', 'error'
  const [submitState, setSubmitState] = useState('idle');
  const [orderRef, setOrderRef] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (productId) {
      axios.get(`${API_URL}/api/products/${productId}`)
        .then(res => {
           setProduct(res.data.data);
           setQuantity(res.data.data.minimumOrderQuantity);
        })
        .catch(console.error);
    }
  }, [productId]);

  const submitInquiry = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login');
    
    setSubmitState('submitting');
    
    try {
      const payload = {
        items: [{ productId: product.id, quantity, price: product.price }],
        shippingAddress: 'TBD', // Required by previous schema
        billingAddress: 'TBD',
        company,
        country,
        message,
        preferredDeliveryDate
      };
      
      const res = await axios.post(`${API_URL}/api/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrderRef(res.data.data.orderNumber);
      setSubmitState('success');
      
      // Navigate away after success
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  if (!productId || !product) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading product details...</p>
          <Link to="/products" className="mt-8 text-blue-600 hover:underline flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-88px)] bg-gray-50 py-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <Link to="/products" className="inline-flex items-center text-blue-100 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
          >
            {/* Product Summary Side */}
            <div className="lg:w-2/5 bg-gray-900 text-white p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 text-blue-200 border-b border-gray-700 pb-4">Inquiry Details</h3>
                
                <div className="mb-8 h-64 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg">
                   {product.imageUrl && <img src={product.imageUrl.startsWith('/uploads') ? `${API_URL}${product.imageUrl}` : product.imageUrl} alt={product.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"/>}
                </div>
                
                <h4 className="font-bold text-3xl mb-4">{product.name}</h4>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Category</span>
                    <span className="font-medium text-blue-200">{product.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Origin</span>
                    <span className="font-medium">{product.origin}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Minimum Order</span>
                    <span className="font-medium text-green-400">{product.minimumOrderQuantity} {product.unit}</span>
                  </div>
                </div>
                
                <div className="p-5 bg-blue-900/50 border border-blue-500/30 rounded-xl text-sm text-blue-100 flex items-start">
                  <ShieldCheck className="w-5 h-5 mr-3 text-blue-400 shrink-0 mt-0.5" />
                  <p>This is a B2B inquiry. No payment is required at this stage. Our team will review your request and send a formal quotation.</p>
                </div>
              </div>
            </div>

            {/* Form Side */}
            <div className="lg:w-3/5 p-10 lg:p-14 bg-white relative">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-8">Request a Quote</h2>
              
              <form onSubmit={submitInquiry} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Company Name *</label>
                    <input 
                      type="text" required 
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={company} onChange={e=>setCompany(e.target.value)}
                      placeholder="Your Company Ltd"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Destination Country *</label>
                    <input 
                      type="text" required 
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={country} onChange={e=>setCountry(e.target.value)}
                      placeholder="e.g. United Arab Emirates"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Required Quantity ({product.unit}) *</label>
                    <input 
                      type="number" min={product.minimumOrderQuantity} required 
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={quantity} onChange={e=>setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Preferred Delivery Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                      value={preferredDeliveryDate} onChange={e=>setPreferredDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Additional Requirements</label>
                  <textarea 
                    rows="4" 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" 
                    value={message} onChange={e=>setMessage(e.target.value)} 
                    placeholder="Specific packaging requirements, certifications needed, etc."
                  ></textarea>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <button 
                    type="submit" 
                    disabled={submitState !== 'idle'}
                    className={`w-full relative overflow-hidden group flex items-center justify-center py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      submitState === 'success' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 
                      submitState === 'error' ? 'bg-red-500 text-white' : 
                      'bg-blue-900 text-white hover:bg-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {submitState === 'idle' && (
                        <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center">
                          Submit Inquiry Request <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </motion.div>
                      )}
                      {submitState === 'submitting' && (
                        <motion.div key="submitting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center">
                          <Loader2 className="animate-spin mr-2 w-5 h-5" /> Submitting...
                        </motion.div>
                      )}
                      {submitState === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center">
                          <CheckCircle className="mr-2 w-6 h-6" /> Request Received
                        </motion.div>
                      )}
                      {submitState === 'error' && (
                        <motion.div key="error" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center">
                          Submission Failed. Try Again.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  
                  {submitState === 'success' && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="text-center mt-4 text-green-600 font-medium"
                    >
                      Your reference number is <strong>{orderRef}</strong>. Redirecting...
                    </motion.p>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}