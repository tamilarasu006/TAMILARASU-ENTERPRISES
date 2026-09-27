import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, CheckCircle, Trash2, Clock, Inbox } from 'lucide-react';

export default function Inquiries() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/contact', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMessages(response.data.data);
    } catch (err) {
      setError('Failed to fetch inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`/api/contact/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`/api/contact/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading inquiries...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Inquiries</h1>
        <p className="text-gray-600 mt-1">Manage and respond to contact form submissions.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No inquiries yet</h3>
            <p className="text-gray-500">When customers contact you, their messages will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-6 transition-colors ${msg.isRead ? 'bg-white' : 'bg-blue-50/30'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{msg.subject}</h3>
                      {!msg.isRead && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${msg.email}`} className="hover:text-blue-600 font-medium">{msg.name} ({msg.email})</a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2">
                    {!msg.isRead && (
                      <button 
                        onClick={() => handleMarkRead(msg.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Mark Read
                      </button>
                    )}
                    <a 
                      href={`mailto:${msg.email}?subject=RE: ${msg.subject}`}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1f3a8a] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors text-center justify-center"
                    >
                      <Mail className="w-4 h-4" />
                      Reply
                    </a>
                    <button 
                      onClick={() => handleDelete(msg.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
