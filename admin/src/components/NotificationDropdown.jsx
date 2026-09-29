import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {
    console.error('Audio play failed', e);
  }
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/notifications`, getHeaders());
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    
    const token = localStorage.getItem('adminToken');
    let socket;
    if (token) {
      socket = io(API_URL, { auth: { token } });
      socket.on('notification', (newNotif) => {
        playNotificationSound();
        fetchNotifications(); // Refresh the list completely to ensure order
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, []);

  const markAsRead = async (id, e) => {
    if (e) e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, getHeaders());
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, getHeaders());
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  return (
    <div className="relative ml-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:text-blue-200 p-2 rounded-full transition focus:outline-none flex items-center justify-center relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 py-2 z-50 text-gray-800">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-base">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm text-gray-800">{notification.title}</h4>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                  
                  <div className="flex justify-between items-center mt-2">
                    {notification.link ? (
                      <Link 
                        to={notification.link.replace('/admin', '')}
                        onClick={() => {
                          if(!notification.isRead) markAsRead(notification.id);
                          setIsOpen(false);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        View Details <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    ) : <div></div>}
                    
                    {!notification.isRead && (
                      <button 
                        onClick={(e) => markAsRead(notification.id, e)}
                        className="text-xs text-gray-400 hover:text-blue-600 transition"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
