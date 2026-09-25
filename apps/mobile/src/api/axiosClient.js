import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosClient = axios.create({
  baseURL: 'http://YOUR_SPRING_BOOT_IP:8080/api', 
});

axiosClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('springToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;