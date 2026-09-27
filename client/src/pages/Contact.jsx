import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending form
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus(null), 5000);
    }, 1500);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 pt-24 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl font-extrabold text-[#1f3a8a] tracking-tight sm:text-5xl mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600">
            We'd love to hear from you. Whether you have a question about our products, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-[#1f3a8a] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 mb-4">Our friendly team is here to help.</p>
              <a href="mailto:info@tamilarasuenterprises.com" className="text-[#1f3a8a] font-medium hover:underline">
                info@tamilarasuenterprises.com
              </a>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-[#1f3a8a] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 mb-4">Mon-Fri from 8am to 5pm.</p>
              <a href="tel:+911234567890" className="text-[#1f3a8a] font-medium hover:underline">
                +91 123 456 7890
              </a>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-[#1f3a8a] rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600 mb-4">Come say hello at our office HQ.</p>
              <address className="text-[#1f3a8a] font-medium not-italic">
                Tamil Nadu, India<br/>
                Chennai
              </address>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-50 overflow-hidden">
              <div className="px-8 py-10 sm:p-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1f3a8a] focus:border-[#1f3a8a] outline-none transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1f3a8a] focus:border-[#1f3a8a] outline-none transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1f3a8a] focus:border-[#1f3a8a] outline-none transition-colors"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      name="message"
                      id="message"
                      rows="5"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1f3a8a] focus:border-[#1f3a8a] outline-none transition-colors resize-none"
                      placeholder="Your message..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full sm:w-auto px-8 py-4 bg-[#1f3a8a] text-white font-semibold rounded-xl hover:bg-blue-900 focus:ring-4 focus:ring-blue-300 transition-all shadow-md disabled:opacity-70 flex items-center justify-center"
                  >
                    {status === 'sending' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>

                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md"
                    >
                      Thank you! Your message has been sent successfully. We will get back to you soon.
                    </motion.div>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;
