import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

// Android emulator uses 10.0.2.2 to reach the host machine's localhost.
// iOS simulator uses localhost directly.
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  async (config) => {
    try {
      let token = null;

      // 1. Prefer fresh ID token from active Firebase auth session
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken(false);
      }

      // 2. Fallback to AsyncStorage if currentUser hasn't loaded yet
      if (!token) {
        token = await AsyncStorage.getItem('firebaseToken');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to attach Firebase token to request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch authentication issues
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Request rejected by backend: Invalid or expired Firebase ID token.');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;