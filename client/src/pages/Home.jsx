import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Globe, ArrowRight, ShieldCheck, Ship, Box, CheckCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';

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
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1.05, 1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);

  // Title words for staggered reveal
  const title = "Connecting Quality Products to Global Markets";
  const titleWords = title.split(" ");

  return (
    <PageTransition>
      <div className="font-sans text-gray-800 -mt-[88px]"> {/* Offset navbar for hero */}

        {/* Cinematic Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gray-900">
          <motion.div
            style={{ scale: heroScale, opacity: heroOpacity }}
            className="absolute inset-0 z-0 bg-gray-900 overflow-hidden"
          >
            {/* CSS Animated Mesh Gradient instead of an external image */}
            <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-blue-900 via-gray-900 to-green-900 opacity-80 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-bounce" style={{ animationDuration: '12s' }} />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute inset-0 bg-black/40 z-10" />
            
            {/* Minimal Grid Pattern Overlay */}
            <div className="absolute inset-0 z-10 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </motion.div>

          <div className="container mx-auto relative z-20 text-center px-4 mt-20">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block border border-blue-400/50 bg-blue-900/30 backdrop-blur-sm text-blue-200 px-4 py-1 rounded-full text-sm font-semibold tracking-widest uppercase mb-6"
            >
              Premium Fresh Produce Export
            </motion.div>

            <motion.h2
              className="text-5xl md:text-7xl font-extrabold mb-6 text-white leading-tight"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {titleWords.map((word, i) => (
                <motion.span key={i} variants={fadeUp} className="inline-block mr-3 lg:mr-4">
                  {word}
                </motion.span>
              ))}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light text-gray-300"
            >
              Reliable Import & Export solutions connecting India's agricultural heartland with international markets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex justify-center flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link to="/products" className="group bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center justify-center">
                Explore Products
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="group bg-transparent border-2 border-white/50 backdrop-blur-sm hover:bg-white hover:text-blue-900 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center justify-center">
                Request Quote
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Global Trade Animation Section */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center mb-16"
            >
              <h3 className="text-4xl font-bold text-blue-900 mb-4 flex items-center justify-center">
                <Globe className="mr-3 text-green-500 w-10 h-10" /> Global Footprint
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto"></div>
            </motion.div>

            <div className="relative max-w-5xl mx-auto bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-xl overflow-hidden">
              {/* Abstract animated map representation */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1e3a8a 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h4 className="text-2xl font-bold mb-4 text-gray-800">From India to the World</h4>
                  <p className="text-gray-600 mb-6 leading-relaxed">We have established a robust logistics network connecting South Indian farms directly to major global hubs. Our supply chain ensures freshness, quality, and timely delivery across continents.</p>
                  <ul className="space-y-4">
                    {['Middle East (UAE, Saudi Arabia, Qatar)', 'Europe (UK, Germany, France)', 'Southeast Asia (Singapore, Malaysia)', 'North America & Australia'].map((region, i) => (
                      <motion.li
                        key={region}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center text-gray-700 font-medium"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                        {region}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <div className="relative h-64 md:h-full min-h-[300px] flex items-center justify-center">
                  {/* Animated Connection */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute w-4 h-4 bg-blue-600 rounded-full z-20 left-1/4"
                    />
                    <svg className="absolute w-full h-full z-10" preserveAspectRatio="none">
                      <motion.path
                        d="M 25% 50% Q 50% 20% 75% 50%"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </svg>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.5, type: 'spring' }}
                      className="absolute w-6 h-6 bg-green-500 rounded-full z-20 right-1/4 border-4 border-white shadow-lg"
                    />

                    {/* Moving cargo dot */}
                    <motion.div
                      className="absolute w-3 h-3 bg-blue-900 rounded-full z-30"
                      animate={{
                        offsetDistance: ["0%", "100%"]
                      }}
                      style={{
                        offsetPath: "path('M 25% 50% Q 50% 20% 75% 50%')" // Approximation
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Showcase */}
        <section className="py-24 bg-gray-50 container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h3 className="text-4xl font-bold text-blue-900 mb-4">Premium Products</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-900 mx-auto"></div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { name: 'Fruits', emoji: '🍎', gradient: 'from-orange-400 to-red-500' },
              { name: 'Vegetables', emoji: '🥦', gradient: 'from-emerald-400 to-green-600' },
              { name: 'Spices', emoji: '🌶️', gradient: 'from-amber-500 to-orange-700' },
              { name: 'Grains & Pulses', emoji: '🌾', gradient: 'from-yellow-400 to-amber-600' }
            ].map((cat, index) => (
              <motion.div key={cat.name} variants={fadeUp}>
                <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="group block h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative">
                  <div className={`h-64 flex flex-col items-center justify-center bg-gradient-to-br ${cat.gradient} relative overflow-hidden`}>
                    <div className="text-7xl group-hover:scale-125 transition-transform duration-700 ease-in-out z-10 drop-shadow-2xl">
                      {cat.emoji}
                    </div>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 z-0"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="font-bold text-2xl mb-2">{cat.name}</h4>
                    <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      View Catalog <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Export Process */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center mb-20"
            >
              <h3 className="text-4xl font-bold text-blue-900 mb-4">The Export Journey</h3>
              <div className="w-24 h-1 bg-green-500 mx-auto"></div>
            </motion.div>

            <div className="relative">
              {/* Connecting Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10"
              >
                {[
                  { step: '01', title: 'Product Sourcing', desc: 'Directly from trusted farms', icon: Box },
                  { step: '02', title: 'Quality Check', desc: 'Rigorous inspection standards', icon: ShieldCheck },
                  { step: '03', title: 'Custom Packaging', desc: 'Export-grade materials', icon: Box },
                  { step: '04', title: 'Global Delivery', desc: 'Timely international shipping', icon: Ship }
                ].map((item, i) => (
                  <motion.div key={item.step} variants={fadeUp} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center group hover:border-blue-500 transition-colors">
                    <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-900 group-hover:text-white transition-colors shadow-inner">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div className="text-sm font-bold text-green-500 mb-2 tracking-widest">STEP {item.step}</div>
                    <h5 className="font-bold text-xl mb-3 text-gray-800">{item.title}</h5>
                    <p className="text-gray-500">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16 border-t border-gray-800">
          <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <img src="/static/images/logo-1.jpg" alt="Logo" className="w-8 h-8 rounded-full mr-3" />
                TAMILARASU
              </h2>
              <p className="text-gray-400 max-w-sm">
                Premium fresh produce export company connecting India's rich agriculture with global markets.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Contact</h3>
              <p className="text-gray-400">Uthiramerur, Tamil Nadu, India</p>
              <p className="text-gray-400 mt-2">Email: info@tamilarasuenterprises.com</p>
              <p className="text-gray-400">Phone: +91 6383772487</p>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © 2026 Tamilarasu Enterprises. All rights reserved.
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}