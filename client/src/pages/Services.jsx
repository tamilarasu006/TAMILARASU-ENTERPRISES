import React from 'react';
import { motion } from 'framer-motion';
import { Globe2, ShieldCheck, Package, Ship } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Services() {
  const services = [
    {
      title: "Global Export",
      desc: "We export high-quality fresh produce to major markets including the Middle East, Europe, and Southeast Asia, adhering to strict international standards.",
      icon: Globe2,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Quality Assurance",
      desc: "Every batch of produce undergoes rigorous quality checks, sorting, and grading to ensure only the best reaches our clients.",
      icon: ShieldCheck,
      color: "text-green-500",
      bg: "bg-green-50"
    },
    {
      title: "Custom Packaging",
      desc: "We offer customized packaging solutions to preserve freshness and shelf-life, tailored to the specific requirements of our buyers.",
      icon: Package,
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      title: "Logistics & Shipping",
      desc: "End-to-end logistics support including cold chain management, documentation, and timely delivery across the globe.",
      icon: Ship,
      color: "text-cyan-500",
      bg: "bg-cyan-50"
    }
  ];

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
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {services.map((service, index) => (
              <motion.div 
                key={index} 
                variants={fadeUp}
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-10 border border-gray-100 flex flex-col sm:flex-row items-start sm:space-x-6 group hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Decorative background glow on hover */}
                <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${service.bg.replace('50', '500')}`}></div>
                
                <div className={`p-5 rounded-2xl mb-6 sm:mb-0 shrink-0 ${service.bg} ${service.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                  <service.icon className="w-10 h-10" />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-900 transition-colors">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
