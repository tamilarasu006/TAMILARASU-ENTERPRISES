import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!token) {
      setValidationError('Invalid or missing invitation token.');
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/invitations/validate?token=${token}`);
        if (res.data.valid) {
          setInvitation(res.data);
        } else {
          setValidationError(res.data.message || 'Invitation is invalid');
        }
      } catch (err) {
        setValidationError(err.response?.data?.message || 'This invitation is invalid or expired.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_URL}/api/admin/invitations/accept`, {
        token,
        password,
        confirmPassword
      });
      setSuccess('Your admin account has been activated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Validating invitation...</div>;
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              {validationError.includes('expired') ? 'Invitation Expired' : 
               validationError.includes('revoked') ? 'Invitation Revoked' :
               validationError.includes('already') ? 'Invitation Already Used' : 'Invitation Invalid'}
            </h2>
            <p className="text-gray-600 mb-6">{validationError}</p>
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">Return to Admin Login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
            <p className="text-gray-600 mb-6">{success}</p>
            <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Login to Admin Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Join Admin Portal</h2>
        <p className="mt-2 text-sm text-gray-600">TAMILARASU ENTERPRISES</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome, {invitation?.name || 'Admin'}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium text-gray-900">Email:</span> {invitation?.email}</p>
              <p><span className="font-medium text-gray-900">Role:</span> {invitation?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="At least 8 characters"
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Repeat your password"
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Activating...' : 'Create Password & Join Admin Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
