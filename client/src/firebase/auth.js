import { auth, isFirebaseInitialized } from './config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

/**
 * Initializes the RecaptchaVerifier.
 * Should be called inside a component lifecycle method.
 * @param {string} containerId - The ID of the DOM element to render recaptcha in.
 * @param {Function} callback - Callback when solved
 */
export const setupRecaptcha = (containerId, callback) => {
  if (!isFirebaseInitialized) return;
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible', // or 'normal'
      callback: (response) => {
        if (callback) callback(response);
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
      }
    });
  }
};

/**
 * Sends OTP to the given phone number.
 * @param {string} phoneNumber - Full E.164 phone number.
 */
export const requestPhoneOTP = async (phoneNumber) => {
  if (!isFirebaseInitialized) {
    const err = new Error('Firebase API key is missing');
    err.code = 'auth/invalid-api-key';
    throw err;
  }
  try {
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    throw error;
  }
};

/**
 * Verifies the OTP entered by the user.
 * @param {string} otpCode - 6 digit code
 */
export const verifyPhoneOTP = async (otpCode) => {
  if (!window.confirmationResult) {
    throw new Error('No OTP request found. Please request OTP first.');
  }
  const result = await window.confirmationResult.confirm(otpCode);
  return result.user;
};

/**
 * Maps Firebase auth errors to user-friendly messages.
 */
export const mapAuthError = (error) => {
  console.error('[Firebase Auth Error] Code:', error.code, 'Message:', error.message);
  const code = error.code;
  switch (code) {
    case 'auth/invalid-api-key':
      return 'Firebase API key is missing. Please add your Firebase credentials to client/.env to enable OTP.';
    case 'auth/billing-not-enabled':
      return 'Firebase Billing is not enabled. Please upgrade to the Blaze plan or use a Test Phone Number.';
    case 'auth/invalid-phone-number':
      return 'Please enter a valid mobile number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'The verification code is incorrect.';
    case 'auth/code-expired':
      return 'The verification code has expired. Please request a new code.';
    case 'auth/quota-exceeded':
      return 'SMS verification is temporarily unavailable. Please try again later.';
    case 'auth/captcha-check-failed':
      return 'Security verification failed. Please try again.';
    default:
      return error.message || 'An unexpected error occurred during authentication.';
  }
};
