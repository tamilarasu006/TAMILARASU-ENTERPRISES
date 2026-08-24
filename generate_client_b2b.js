const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'client');

const files = {
  'src/pages/Home.jsx': `
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const [config, setConfig] = useState(null);
  
  useEffect(() => {
    // In a real app we would have an API for this, but for now we mock the API response 
    // or fetch it from a new site config endpoint we will add later.
    // Let's just hardcode the B2B feel for the demo based on the requirements.
  }, []);

  return (
    <div className="font-sans text-gray-800">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/static/images/logo-1.jpg" alt="Logo" className="h-10 w-10 rounded-full bg-white object-cover" onError={(e) => e.target.style.display='none'} />
            <h1 className="text-2xl font-bold tracking-wider">TAMILARASU ENTERPRISES</h1>
          </div>
          <nav className="space-x-6 hidden md:flex font-semibold">
            <Link to="/" className="hover:text-blue-300 transition">Home</Link>
            <Link to="/about" className="hover:text-blue-300 transition">About</Link>
            <Link to="/products" className="hover:text-blue-300 transition">Products</Link>
            <Link to="/services" className="hover:text-blue-300 transition">Services</Link>
            <Link to="/login" className="bg-white text-blue-900 px-4 py-1 rounded-sm hover:bg-gray-200 transition">Login</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-32 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80")' }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="container mx-auto relative z-10 text-center px-4">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6">Connecting Quality Products to Global Markets</h2>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light">Reliable Import & Export solutions for fresh agricultural products and international trade.</p>
          <div className="flex justify-center space-x-4">
            <Link to="/products" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded shadow-lg transition transform hover:-translate-y-1">Explore Products</Link>
            <Link to="/contact" className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white font-bold py-3 px-8 rounded shadow-lg transition transform hover:-translate-y-1">Contact Us</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-blue-900 mb-4">Our Export Categories</h3>
          <div className="w-24 h-1 bg-green-500 mx-auto"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {['Fruits', 'Vegetables', 'Spices', 'Grains & Pulses'].map(cat => (
            <div key={cat} className="bg-gray-50 rounded-lg p-8 text-center shadow hover:shadow-xl transition border-t-4 border-transparent hover:border-green-500 group cursor-pointer">
              <div className="h-16 w-16 mx-auto bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-900 group-hover:text-white transition">
                <span className="text-2xl font-bold">{cat[0]}</span>
              </div>
              <h4 className="font-bold text-lg">{cat}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Global Reach / Process */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
           <h3 className="text-3xl font-bold text-blue-900 mb-4">Serving Global Markets</h3>
           <div className="w-24 h-1 bg-green-500 mx-auto mb-12"></div>
           <p className="max-w-3xl mx-auto text-lg text-gray-700 mb-12">We proudly export to UAE, Saudi Arabia, Qatar, UK, Germany, USA, Singapore, and many more, ensuring compliance with international quality standards.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              {['1. Product Selection', '2. Quality Inspection', '3. Custom Packaging', '4. Global Shipping'].map(step => (
                 <div key={step} className="bg-white p-6 rounded shadow border-l-4 border-blue-900">
                    <h5 className="font-bold text-xl mb-2">{step}</h5>
                    <p className="text-sm text-gray-600">Rigorous processes to ensure perfection.</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">TAMILARASU ENTERPRISES</h2>
          <p className="mb-4">Fresh from Farm to World</p>
          <p className="text-sm text-gray-400">© 2026 Tamilarasu Enterprises. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
`,

  'src/pages/Products.jsx': `
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white p-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">TAMILARASU ENTERPRISES</Link>
          <Link to="/orders" className="hover:text-blue-300">My Inquiries</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">Product Catalog</h1>
        <p className="text-gray-600 mb-10">Premium export-quality agricultural products.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 flex flex-col">
              <div className="h-64 bg-gray-200 relative">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded shadow">
                  {p.category}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">{p.name}</h2>
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <p><strong>Origin:</strong> {p.origin}</p>
                  <p><strong>MOQ:</strong> {p.minimumOrderQuantity} {p.unit}</p>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1">{p.description}</p>
                
                <button 
                  onClick={() => navigate(\`/checkout?product=\${p.id}\`)}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded transition"
                >
                  Request Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
`,

  'src/pages/Checkout.jsx': `
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

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

  useEffect(() => {
    if (productId) {
      axios.get(\`http://localhost:5000/api/products/\${productId}\`)
        .then(res => {
           setProduct(res.data.data);
           setQuantity(res.data.data.minimumOrderQuantity);
        })
        .catch(console.error);
    }
  }, [productId]);

  const submitInquiry = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    
    try {
      const payload = {
        items: [{ productId, quantity: parseInt(quantity) }],
        shippingAddress: 'TBD', // Required by previous schema
        billingAddress: 'TBD',
        company,
        country,
        message,
        preferredDeliveryDate
      };
      
      const res = await axios.post('http://localhost:5000/api/orders', payload, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      alert(\`Inquiry submitted successfully. Reference Number: \${res.data.data.orderNumber}\`);
      navigate('/orders');
    } catch (err) {
      alert('Unable to submit inquiry. Please try again.');
    }
  };

  if (!productId || !product) {
    return <div className="p-8">Please select a product from the <Link to="/products" className="text-blue-600 underline">Catalog</Link> first.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">Submit Export Inquiry</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
          
          {/* Product Summary Side */}
          <div className="md:w-1/3 bg-gray-100 p-8 border-r border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Inquiry Details</h3>
            <div className="mb-6 h-48 rounded overflow-hidden">
               {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>}
            </div>
            <h4 className="font-bold text-xl mb-2">{product.name}</h4>
            <p className="text-sm text-gray-600 mb-1"><strong>Category:</strong> {product.category}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Origin:</strong> {product.origin}</p>
            <p className="text-sm text-gray-600 mb-4"><strong>MOQ:</strong> {product.minimumOrderQuantity} {product.unit}</p>
            
            <div className="p-4 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
              Note: This is a B2B inquiry. No payment is required at this stage. Our team will review your request and send a formal quotation.
            </div>
          </div>

          {/* Form Side */}
          <div className="md:w-2/3 p-8">
            <form onSubmit={submitInquiry} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded p-2" value={company} onChange={e=>setCompany(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country *</label>
                  <input type="text" required className="w-full border border-gray-300 rounded p-2" value={country} onChange={e=>setCountry(e.target.value)}/>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Quantity ({product.unit}) *</label>
                  <input type="number" min={product.minimumOrderQuantity} required className="w-full border border-gray-300 rounded p-2" value={quantity} onChange={e=>setQuantity(e.target.value)}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Delivery Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded p-2" value={preferredDeliveryDate} onChange={e=>setPreferredDeliveryDate(e.target.value)}/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Requirements / Message</label>
                <textarea rows="4" className="w-full border border-gray-300 rounded p-2" value={message} onChange={e=>setMessage(e.target.value)} placeholder="E.g. specific packaging requirements, certifications needed, etc."></textarea>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-900 text-white font-bold py-3 rounded shadow hover:bg-blue-800 transition">
                  Submit Inquiry Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
`,

  'src/App.jsx': `
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(clientDir, filePath), content.trim());
}
console.log('B2B Client Files Updated');
