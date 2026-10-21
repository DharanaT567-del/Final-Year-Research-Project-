import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes across restarts
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          await AsyncStorage.setItem('firebaseToken', idToken);
          setToken(idToken);

          // Fetch user profile from Firestore if it exists
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const firestoreData = userDoc.exists() ? userDoc.data() : {};

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firestoreData.name || firestoreData.displayName || 'Student',
              displayName: firebaseUser.displayName || firestoreData.displayName || 'Student',
              ...firestoreData
            });
          } catch (docError) {
            console.warn('Could not retrieve Firestore profile yet:', docError.message);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Student',
              displayName: firebaseUser.displayName || 'Student'
            });
          }
        } else {
          await AsyncStorage.removeItem('firebaseToken');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    try {
      await updateProfile(firebaseUser, { displayName: name });
    } catch (profileError) {
      console.warn('Could not update Firebase displayName:', profileError.message);
    }

    const idToken = await firebaseUser.getIdToken();
    await AsyncStorage.setItem('firebaseToken', idToken);

    // Save initial user profile in Firestore
    const profile = {
      uid: firebaseUser.uid,
      name: name,
      displayName: name,
      email: firebaseUser.email,
      learningTrack: 'Sinhala Classical',
      streak: 1,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), profile);
    } catch (docError) {
      console.warn('Could not write initial Firestore profile:', docError.message);
    }

    setUser(profile);
    setToken(idToken);
    return profile;
  };

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;
    const idToken = await firebaseUser.getIdToken();
    await AsyncStorage.setItem('firebaseToken', idToken);
    setToken(idToken);

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const firestoreData = userDoc.exists() ? userDoc.data() : {};
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firestoreData.name || firestoreData.displayName || 'Student',
        displayName: firebaseUser.displayName || firestoreData.displayName || 'Student',
        ...firestoreData
      };
      setUser(userData);
      return userData;
    } catch (e) {
      const basicData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Student',
        displayName: firebaseUser.displayName || 'Student'
      };
      setUser(basicData);
      return basicData;
    }
  };

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('firebaseToken');
    setUser(null);
    setToken(null);
  };

  const deleteAccount = async () => {
    if (auth.currentUser) {
      const currentUid = auth.currentUser.uid;
      try {
        await deleteDoc(doc(db, 'users', currentUid));
      } catch (e) {
        console.warn('Error deleting user profile from Firestore:', e.message);
      }
      await auth.currentUser.delete();
    }
    await logout();
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfileState = (updatedData) => {
    setUser((prev) => ({
      ...prev,
      ...updatedData
    }));
  };

  const updateUserEmailAddress = async (newEmail, currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No active user session");

    if (currentPassword) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    await updateEmail(currentUser, newEmail);
    const idToken = await currentUser.getIdToken(true);
    await AsyncStorage.setItem('firebaseToken', idToken);
    setToken(idToken);

    setUser((prev) => ({
      ...prev,
      email: newEmail
    }));
  };

  const updateUserPasswordCredential = async (newPassword, currentPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No active user session");

    if (currentPassword) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    await updatePassword(currentUser, newPassword);
    const idToken = await currentUser.getIdToken(true);
    await AsyncStorage.setItem('firebaseToken', idToken);
    setToken(idToken);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isLoading: loading,
      register,
      login,
      logout,
      deleteAccount,
      resetPassword,
      updateUserProfileState,
      updateUserEmailAddress,
      updateUserPasswordCredential
    }}>
      {children}
    </AuthContext.Provider>
  );
};