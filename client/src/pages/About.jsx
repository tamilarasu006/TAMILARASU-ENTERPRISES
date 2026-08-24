import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Eye, MapPin, Award, ShieldCheck, Star, Leaf } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function About() {
  const aboutData = {
    "foundedYear": 2024,
    "history": "TAMILARASU ENTERPRISES was founded in 2024 in Uthiramerur, Tamil Nadu, with a clear mission: to bridge the gap between India's abundant fresh produce farms and international markets. Starting with a focus on premium fruits and spices from South India, we have grown into a trusted trade partner for buyers and sellers across the Middle East, Europe, Southeast Asia, and beyond. Our deep roots in Tamil Nadu's agricultural heartland give us direct access to quality produce, while our logistics expertise ensures it reaches global destinations in perfect condition.",
    "mission": "To connect Indian farmers and producers with global markets by delivering premium fresh produce with integrity, reliability, and care — creating value for every stakeholder in the supply chain.",
    "vision": "To become the most trusted fresh produce export company from South India, recognised globally for quality, transparency, and sustainable trade practices.",
    "values": [
      "Quality First",
      "Integrity in Trade",
      "Farmer Partnership",
      "Timely Delivery",
      "Sustainable Practices",
      "Customer Trust",
      "Continuous Improvement"
    ],
    "exportDestinations": [
      "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
      "United Kingdom", "Germany", "France", "United States", "Canada", "Australia",
      "Singapore", "Malaysia", "Sri Lanka", "Bangladesh", "Nepal", "Japan"
    ],
    "certifications": [
      {
        "name": "APEDA",
        "description": "Agricultural and Processed Food Products Export Development Authority — India's apex body for promoting agricultural exports.",
        "icon": Award,
        "color": "text-blue-600"
      },
      {
        "name": "FSSAI",
        "description": "Food Safety and Standards Authority of India — ensures all products meet India's food safety regulations.",
        "icon": ShieldCheck,
        "color": "text-green-600"
      },
      {
        "name": "ISO 22000",
        "description": "International standard for food safety management systems, covering the entire food supply chain.",
        "icon": Award,
        "color": "text-yellow-500"
      },
      {
        "name": "GlobalG.A.P.",
        "description": "Good Agricultural Practices certification ensuring safe, sustainable, and responsible farming standards.",
        "icon": Leaf,
        "color": "text-green-500"
      },
      {
        "name": "Spices Board India",
        "description": "Certification from the Spices Board of India for quality spice exports meeting international standards.",
        "icon": Star,
        "color": "text-orange-500"
      }
    ]
  };

  return (
    <PageTransition>
      <div className="font-sans text-gray-800 bg-gray-50 flex-1">
        
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
              Our Story
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl font-light text-blue-200 max-w-2xl mx-auto"
            >
              Delivering South India's finest agricultural produce since {aboutData.foundedYear}
            </motion.p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-20 max-w-6xl relative z-20">

          {/* History, Mission, Vision */}
          <div className="grid md:grid-cols-2 gap-10 mb-24">
            <motion.div 
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
              className="bg-white p-10 rounded-3xl shadow-xl border-t-4 border-green-500 h-full flex flex-col"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full text-green-600"><BookOpen className="w-6 h-6" /></div>
                Our History
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg flex-1">{aboutData.history}</p>
            </motion.div>

            <div className="flex flex-col gap-10">
              <motion.div 
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                className="bg-white p-10 rounded-3xl shadow-xl border-t-4 border-blue-500 flex-1"
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Target className="w-6 h-6" /></div>
                  Our Mission
                </h2>
                <p className="text-gray-600 leading-relaxed text-lg">{aboutData.mission}</p>
              </motion.div>
              <motion.div 
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                className="bg-white p-10 rounded-3xl shadow-xl border-t-4 border-yellow-500 flex-1"
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><Eye className="w-6 h-6" /></div>
                  Our Vision
                </h2>
                <p className="text-gray-600 leading-relaxed text-lg">{aboutData.vision}</p>
              </motion.div>
            </div>
          </div>

          {/* Core Values */}
          <motion.section 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="mb-24 text-center"
          >
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Our Core Values</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-12"></div>
            <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-4">
              {aboutData.values.map((value, i) => (
                <motion.span 
                  variants={fadeUp} 
                  key={i} 
                  className="bg-white px-6 py-4 rounded-full shadow-md text-blue-900 font-semibold border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all hover:-translate-y-1 cursor-default"
                >
                  {value}
                </motion.span>
              ))}
            </motion.div>
          </motion.section>

          {/* Certifications */}
          <motion.section 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="mb-24"
          >
            <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">Quality & Compliance</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-12"></div>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aboutData.certifications.map((cert, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-2 group text-center flex flex-col items-center">
                  <div className={`p-4 rounded-full bg-gray-50 mb-6 group-hover:scale-110 transition-transform ${cert.color}`}>
                    <cert.icon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{cert.name}</h3>
                  <p className="text-gray-500 text-sm">{cert.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Global Reach */}
          <motion.section 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
            className="bg-blue-900 rounded-3xl p-12 text-center shadow-2xl text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Global Footprint</h2>
              <p className="text-blue-200 mb-10 max-w-2xl mx-auto text-lg">We proudly export premium quality agricultural products to a growing network of international destinations.</p>
              <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-3">
                {aboutData.exportDestinations.map((country, i) => (
                  <motion.span key={i} variants={fadeUp} className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg text-sm text-white font-medium border border-white/20 flex items-center hover:bg-white/20 transition-colors cursor-default">
                    <MapPin className="w-4 h-4 text-green-400 mr-2" />{country}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>
    </PageTransition>
  );
}
