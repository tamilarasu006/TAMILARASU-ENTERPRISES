const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let isInitialized = false;

try {
  // If FIREBASE_PRIVATE_KEY is a multiline string in env, we replace escaped \n with actual newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('[FIREBASE] Admin SDK initialized successfully.');
    isInitialized = true;
  } else {
    console.warn('[FIREBASE] Missing Firebase Admin credentials in environment variables. Phone auth will fail.');
  }
} catch (error) {
  console.error('[FIREBASE] Error initializing Admin SDK:', error);
}

module.exports = isInitialized ? { auth: getAuth } : null;
