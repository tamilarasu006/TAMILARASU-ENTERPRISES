import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Smartphone, CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function VerifyAccount() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: Mobile, 3: Success
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!emailParam) {
      navigate('/login');
    } else {
      // Check current user status (assuming we'd want to skip steps if already verified)
      // For now, we assume if they are here, they need to verify whatever step they're on.
      // We will automatically trigger the first OTP send.
      sendEmailOtp();
    }
  }, [emailParam, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendEmailOtp = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:5000/api/auth/send-email-otp', { email: emailParam });
      setCountdown(60);
    } catch (err) {
      setError('Unable to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:5000/api/auth/verify-email-otp', { email: emailParam, otp });
      setOtp('');
      setStep(2);
      sendMobileOtp();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Email OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendMobileOtp = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:5000/api/auth/send-mobile-otp', { email: emailParam });
      setCountdown(60);
    } catch (err) {
      // If we just came from step 1 success, show a slightly different message
      if (step === 2 && !otp) {
        setError('Email verification code sent, but we could not send the mobile verification code. Please try again.');
      } else {
        setError('Unable to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyMobileOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await axios.post('http://localhost:5000/api/auth/verify-mobile-otp', { email: emailParam, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Mobile OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-88px)] bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-gray-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-blue-900 mb-2">Verify Your Account</h2>
            <p className="text-gray-500 text-sm">Secure your account in a few simple steps.</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center items-center mb-10">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-300'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step > 1 ? 'bg-green-100 text-green-600' : step === 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
              </div>
              <span className="text-xs font-semibold">Email</span>
            </div>
            <div className={`w-16 h-1 mx-2 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-300'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step > 2 ? 'bg-green-100 text-green-600' : step === 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <span className="text-xs font-semibold">Mobile</span>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={verifyEmailOtp}>
                <div className="text-center mb-6">
                  <p className="text-gray-600">Enter the 6-digit OTP sent to</p>
                  <p className="font-bold text-gray-800">{emailParam}</p>
                </div>

                <div className="mb-6">
                  <input 
                    type="text" 
                    maxLength="6"
                    placeholder="Enter Email OTP" 
                    className="w-full text-center text-2xl tracking-[0.5em] bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
                </button>

                <div className="mt-6 text-center text-sm">
                  {countdown > 0 ? (
                    <span className="text-gray-500">Resend available in {formatTime(countdown)}</span>
                  ) : (
                    <button type="button" onClick={sendEmailOtp} className="text-blue-600 font-semibold hover:underline">Resend OTP</button>
                  )}
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={verifyMobileOtp}>
                <div className="text-center mb-6">
                  <p className="text-gray-600">Enter the 6-digit OTP sent to your</p>
                  <p className="font-bold text-gray-800">Registered Mobile Number</p>
                </div>

                <div className="mb-6">
                  <input 
                    type="text" 
                    maxLength="6"
                    placeholder="Enter Mobile OTP" 
                    className="w-full text-center text-2xl tracking-[0.5em] bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Mobile'}
                </button>

                <div className="mt-6 text-center text-sm">
                  {countdown > 0 ? (
                    <span className="text-gray-500">Resend available in {formatTime(countdown)}</span>
                  ) : (
                    <button type="button" onClick={sendMobileOtp} className="text-blue-600 font-semibold hover:underline">Resend OTP</button>
                  )}
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Account Verified</h3>
                <p className="text-gray-600 mb-8">Your TAMILARASU ENTERPRISES account is ready.</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center"
                >
                  Continue to Login <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </PageTransition>
  );
}
