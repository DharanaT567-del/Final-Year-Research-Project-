import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDCoSOhEXXxmVbuPdTMNh-yEoB1KltPeQg",
  authDomain: "naada-aimusicapp.firebaseapp.com",
  projectId: "naada-aimusicapp",
  storageBucket: "naada-aimusicapp.firebasestorage.app",
  messagingSenderId: "834642358187",
  appId: "1:834642358187:web:02146f72025887d1576cee",
  measurementId: "G-5V9VHGS1S9"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };