// src/services/firebaseConfig.js
// Firebase configuration and initialization

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────
//  Replace the placeholder values below with your actual
//  Firebase project credentials from the Firebase Console:
//  https://console.firebase.google.com/
// ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBTJnA-qbZ7XQXC4sQggVndjM9NTu9aA1I",
  authDomain: "personalbudgetapp-ae1d6.firebaseapp.com",
  projectId: "personalbudgetapp-ae1d6",
  storageBucket: "personalbudgetapp-ae1d6.firebasestorage.app",
  messagingSenderId: "18224249053",
  appId: "1:18224249053:web:0d1c2751c0d5cdbc26c334",
};

// Initialize Firebase app instance
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with appropriate Persistence
let authPersistence;
if (Platform.OS === 'web') {
  // On web, we don't need to specify persistence explicitly (it defaults to indexedDB)
  // or we can import browserLocalPersistence dynamically if needed.
  // But simply initializing without persistence arg falls back to default web persistence.
  authPersistence = undefined;
} else {
  authPersistence = getReactNativePersistence(AsyncStorage);
}

export const auth = initializeAuth(app, authPersistence ? { persistence: authPersistence } : {});

// Firebase Firestore (database) instance
export const db = getFirestore(app);

export default app;
