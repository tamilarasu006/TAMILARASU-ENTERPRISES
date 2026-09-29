import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let auth;

let isFirebaseInitialized = true;
try {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your_api_key')) {
    throw new Error('Firebase API Key is missing or invalid. Please update client/.env');
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.useDeviceLanguage();
} catch (error) {
  // Mobile OTP has been removed, so we silently ignore Firebase initialization errors.
  isFirebaseInitialized = false;
  // Provide a dummy auth object so the app doesn't crash on load
  auth = {
    useDeviceLanguage: () => {},
    onAuthStateChanged: () => () => {},
    // add other dummy methods if necessary
  };
}

export { app, auth, isFirebaseInitialized };
