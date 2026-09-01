import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [imageFile, setImageFile] = useState(null);

  function getInitialFormData() {
    return {
      title: '',
      description: '',
      category: 'General',
      icon: '',
      imageUrl: '',
      highlights: '',
      pricingQuotationRequired: false,
      isActive: true
    };
  }

  const fetchServices = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/login');
    
    axios.get(`${API_URL}/api/services/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setServices(res.data.data || []))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/login');
      });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(getInitialFormData());
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      category: service.category || 'General',
      icon: service.icon || '',
      imageUrl: service.imageUrl || '',
      highlights: service.highlights || '',
      pricingQuotationRequired: service.pricingQuotationRequired || false,
      isActive: service.isActive !== false
    });
    setImageFile(null);
    setShowModal(true);
  };

  const deleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API_URL}/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServices();
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API_URL}/api/services/${id}/status`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServices();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/services/${editingId}`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`${API_URL}/api/services`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service. Please try again.');
      console.error(err);
    }
  };

  const filteredServices = services.filter(s => {
    return s.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Services Management</h2>
        <button onClick={openAddModal} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Service
        </button>
      </div>
      
      <div className="mb-6 w-full md:w-1/3">
        <input 
          type="text" 
          placeholder="Search services..." 
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Image/Icon</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Service Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Quotation Req.</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredServices.map(s => (
              <tr key={s.id} className="hover:bg-purple-50 transition-colors">
                <td className="px-6 py-4">
                  {s.imageUrl ? <img src={s.imageUrl.startsWith('/uploads') ? `${API_URL}${s.imageUrl}` : s.imageUrl} alt={s.title} className="h-10 w-10 object-cover rounded shadow-sm" /> : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">None</div>}
                </td>
                <td className="px-6 py-4 font-bold text-gray-800">{s.title}</td>
                <td className="px-6 py-4 text-gray-600">{s.category}</td>
                <td className="px-6 py-4 text-gray-600">
                  {s.pricingQuotationRequired ? <span className="text-orange-600 font-bold">Yes</span> : 'No'}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(s.id, s.isActive)} className={`px-3 py-1 text-xs font-bold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 flex justify-center space-x-3">
                  <button onClick={() => openEditModal(s)} className="text-purple-500 hover:text-purple-700 p-2 rounded-full hover:bg-purple-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" /></svg>
                  </button>
                  <button onClick={() => deleteService(s.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No services found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">{editingId ? 'Edit Service' : 'Add New Service'}</h3>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name (Title)</label>
                  <input type="text" name="title" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.title} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" name="category" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.category} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows="3" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" value={formData.description} onChange={handleInputChange}></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Service Image</label>
                     <input type="file" accept="image/*" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" onChange={handleFileChange} />
                     {formData.imageUrl && !imageFile && (
                        <div className="mt-2 text-sm text-gray-500">Current: <a href={formData.imageUrl.startsWith('/uploads') ? `${API_URL}${formData.imageUrl}` : formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View Image</a></div>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Icon (SVG or class)</label>
                     <input type="text" name="icon" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.icon} onChange={handleInputChange} />
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Features (Highlights)</label>
                  <input type="text" name="highlights" placeholder="Comma separated features" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.highlights} onChange={handleInputChange} />
                </div>

                <div className="flex items-center mt-4">
                  <input type="checkbox" id="pricingQuotationRequired" name="pricingQuotationRequired" checked={formData.pricingQuotationRequired} onChange={handleInputChange} className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                  <label htmlFor="pricingQuotationRequired" className="ml-2 block text-sm text-gray-900 font-medium">Pricing / Quotation Required</label>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                  <label htmlFor="isActive" className="ml-2 block text-sm font-bold text-gray-900">Active / Enabled</label>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-md transition-colors">Save Service</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

