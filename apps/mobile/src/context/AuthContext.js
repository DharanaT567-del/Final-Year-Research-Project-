import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import axiosClient from '../api/axiosClient';

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
      const currentUser = auth().currentUser;
      if (token && currentUser) {
        const response = await axiosClient.get('/auth/me');
        setUser(response.data);
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
    await auth().signInWithCustomToken(firebaseToken);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('springToken');
    await auth().signOut();
    setUser(null);
  };

  const deleteAccount = async () => {
    await axiosClient.delete('/auth/user');
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
