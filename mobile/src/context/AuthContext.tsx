import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

export const isTokenValid = (t: string | null) => {
  if (!t || t === 'undefined' || t === 'null') return false;
  try {
    const parts = t.split('.');
    if (parts.length !== 3) return false;
    // Decode base64 URL payload
    const payload = JSON.parse(
      decodeURIComponent(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Token expired
    }
    return true;
  } catch {
    return false;
  }
};

interface AuthContextType {
  user: any;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (userData: any, jwtToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('token');
        
        if (!savedToken || !isTokenValid(savedToken)) {
          await SecureStore.deleteItemAsync('token');
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setToken(savedToken);

        const res = await apiClient.get('/auth/me');
        setUser(res.data.data);
      } catch (err) {
        console.error('Failed to load auth state', err);
        await SecureStore.deleteItemAsync('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (userData: any, jwtToken: string) => {
    await SecureStore.setItemAsync('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoggedIn: !!token,
    login,
    logout,
    loading,
    updateUser: setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
