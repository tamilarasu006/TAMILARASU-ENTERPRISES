import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId && import.meta.env.DEV) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will not work. Add it to client/.env.local');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId || ''}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
