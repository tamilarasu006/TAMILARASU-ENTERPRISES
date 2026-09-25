import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Set this to your local dev machine IP for Android emulator (e.g., 10.0.2.2) or physical device
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      try {
        await SecureStore.deleteItemAsync('token');
        // We'll let the UI handle the redirect to login based on the context state
      } catch (e) {
        console.error('Error removing token on 401', e);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
