import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';

// Safe Firebase auth import — may not be configured yet
let firebaseAuth = null;
try {
  const authModule = require('@react-native-firebase/auth');
  firebaseAuth = authModule.default || authModule;
} catch (e) {
  console.warn('Firebase Auth module not available:', e.message);
}

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLocalSession();
  }, []);

  const checkLocalSession = async () => {
    try {
      const token = await AsyncStorage.getItem('springToken');
      const userData = await AsyncStorage.getItem('userData');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.log('No valid session found');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    const { springToken, firebaseToken, userData } = response.data;
    
    await AsyncStorage.setItem('springToken', springToken);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
    // Only sign in with Firebase if available and token is valid
    if (firebaseAuth && firebaseToken) {
      try {
        await firebaseAuth().signInWithCustomToken(firebaseToken);
      } catch (fbError) {
        console.warn('Firebase sign-in failed (non-critical):', fbError.message);
      }
    }
    
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('springToken');
    await AsyncStorage.removeItem('userData');
    
    // Safe Firebase sign out
    if (firebaseAuth) {
      try {
        await firebaseAuth().signOut();
      } catch (e) {
        console.warn('Firebase sign-out failed (non-critical):', e.message);
      }
    }
    
    setUser(null);
  };

  const deleteAccount = async () => {
    try {
      await axiosClient.delete('/auth/user');
    } catch (e) {
      console.warn('Delete account API failed:', e.message);
    }
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
