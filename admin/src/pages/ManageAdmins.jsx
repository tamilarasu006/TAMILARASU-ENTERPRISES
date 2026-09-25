import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ADMIN');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/admin/invitations`, {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Admin invited successfully. They will receive an email with the invitation link.');
      setInviteName('');
      setInviteEmail('');
      setInviteRole('ADMIN');
      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite admin');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove admin');
    }
  };

  const handleResend = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/admin/invitations/${id}/resend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Invitation resent successfully');
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/api/admin/invitations/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke invitation');
    }
  };

  if (loading) return <div>Loading admins...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Manage Admins</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Invite Admin
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded">{success}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {admin.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    admin.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                    admin.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    admin.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                  {!admin.isInvitation && admin.role !== 'SUPER_ADMIN' && (
                    <button onClick={() => handleRemove(admin.id)} className="text-red-600 hover:text-red-900">Remove</button>
                  )}
                  {admin.isInvitation && admin.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleResend(admin.id)} className="text-blue-600 hover:text-blue-900">Resend</button>
                      <button onClick={() => handleRevoke(admin.id)} className="text-red-600 hover:text-red-900">Revoke</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No admins found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Invite New Admin</h2>
            <p className="text-gray-600 text-sm mb-6">
              The invited admin will receive an email with a unique link to set their password.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
