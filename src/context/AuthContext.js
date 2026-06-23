// src/context/AuthContext.js
// Global authentication context — wraps the entire app.
// Exposes: currentUser, loading, signup, login, logout, resetPassword.

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

// ── Create the context ───────────────────────────────────
const AuthContext = createContext(null);

// ── Custom hook for easy consumption ────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ── Provider component ───────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // true until Firebase resolves

  // ── 1. Listen for auth state changes ──────────────────
  useEffect(() => {
    let unsubscribeProfile;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Set up real-time listener for the user's profile document
        const userRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });
      } else {
        setUserData(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    // Clean up listeners when the provider unmounts
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // ── 2. Sign Up ────────────────────────────────────────
  /**
   * Creates a new Firebase Auth user, then saves a profile document
   * to Firestore under /users/{uid}.
   *
   * @param {string} email
   * @param {string} password
   * @param {string} displayName  – user's chosen display name
   */
  const signup = async (email, password, displayName = '') => {
    // Create the auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save a user profile document to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || '',
      createdAt: serverTimestamp(),
      // Initial budget / profile defaults
      currency: 'INR',
      monthlyBudget: 0,
      profileComplete: false,
    });

    return userCredential;
  };

  // ── 3. Login ──────────────────────────────────────────
  /**
   * Signs in an existing user with email and password.
   */
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ── 4. Logout ─────────────────────────────────────────
  /**
   * Signs the current user out.
   */
  const logout = () => {
    return signOut(auth);
  };

  // ── 5. Reset Password ─────────────────────────────────
  /**
   * Sends a password-reset email to the provided address.
   */
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // ── Context value ──────────────────────────────────────
  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
  };

  // Don't render children until Firebase resolves the initial auth state.
  // This prevents a flash of the wrong screen on app launch.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
