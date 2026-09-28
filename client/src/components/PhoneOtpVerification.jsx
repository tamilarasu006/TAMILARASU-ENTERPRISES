import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { requestPhoneOTP, verifyPhoneOTP, setupRecaptcha, mapAuthError } from '../firebase/auth';
import { countryCodes } from '../data/countryCodes';

export default function PhoneOtpVerification({ onSuccess, buttonText = "Login with Mobile", onCancel }) {
  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [phone, setPhone] = useState({ countryCode: '+91', number: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Setup reCAPTCHA when component mounts
    setupRecaptcha('recaptcha-container');
    
    return () => {
      // Cleanup recaptcha on unmount
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const fullPhone = `${phone.countryCode}${phone.number.trim().replace(/^0+/, '')}`;
    if (!/^\+[1-9]\d{1,14}$/.test(fullPhone)) {
      return setError('Please enter a valid mobile number.');
    }

    setLoading(true);
    try {
      await requestPhoneOTP(fullPhone);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(mapAuthError(err));
      // Reset reCAPTCHA on failure
      setupRecaptcha('recaptcha-container');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      return setError('Please enter a 6-digit OTP.');
    }

    setLoading(true);
    try {
      const user = await verifyPhoneOTP(otp);
      const idToken = await user.getIdToken();
      
      if (onSuccess) {
        await onSuccess(idToken, user);
      }
    } catch (err) {
      setError(mapAuthError(err));
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
    <div className="w-full">
      <div id="recaptcha-container"></div>
      
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
              <div className="flex">
                <select
                  value={phone.countryCode}
                  onChange={e => setPhone({ ...phone, countryCode: e.target.value })}
                  className="px-3 py-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-28 overflow-hidden text-ellipsis"
                >
                  {countryCodes.map((country, idx) => (
                    <option key={idx} value={country.code}>
                      {country.iso} ({country.code})
                    </option>
                  ))}
                </select>
                <input 
                  type="tel" 
                  placeholder="9876543210" 
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-r-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  value={phone.number} 
                  onChange={e => setPhone({ ...phone, number: e.target.value.replace(/\D/g, '') })} 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !phone.number} 
              className="w-full bg-blue-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-800 transition-all flex justify-center items-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : buttonText}
            </button>
            
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                className="mt-3 w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all flex justify-center items-center"
              >
                Cancel
              </button>
            )}
          </motion.form>
        )}

        {step === 2 && (
          <motion.form key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyOtp}>
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">Enter the 6-digit OTP sent to</p>
              <p className="font-bold text-gray-800">{phone.countryCode} {phone.number}</p>
            </div>

            <div className="mb-6">
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000" 
                className="w-full text-center text-2xl tracking-[0.5em] bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                value={otp} 
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
            </button>

            <div className="mt-4 text-center text-sm">
              {countdown > 0 ? (
                <span className="text-gray-500">Resend available in {formatTime(countdown)}</span>
              ) : (
                <button type="button" onClick={() => handleSendOtp()} className="text-blue-600 font-semibold hover:underline">Resend OTP</button>
              )}
            </div>
            
            <div className="mt-2 text-center text-sm">
               <button type="button" onClick={() => { setStep(1); setOtp(''); }} className="text-gray-500 font-semibold hover:underline">Change Mobile Number</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
