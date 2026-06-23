// src/components/AppLock.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const APP_LOCK_ENABLED_KEY = '@app_lock_enabled';

const AppLock = ({ children }) => {
  if (Platform.OS === 'web') return children;

  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(false);
  const [hasHardware, setHasHardware] = useState(false);
  const isPrompting = useRef(false);

  const setLockedState = (val) => {
    isLockedRef.current = val;
    setIsLocked(val);
  };

  useEffect(() => {
    checkLockStatus();

    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && previousState === 'background') {
        if (!isLockedRef.current && !isPrompting.current) {
          checkLockStatus();
        }
      }
      previousState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkLockStatus = async () => {
    const lockEnabled = await AsyncStorage.getItem(APP_LOCK_ENABLED_KEY);
    if (lockEnabled === 'true') {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (hardware && enrolled) {
        setHasHardware(true);
        setLockedState(true);
        if (!isPrompting.current) {
          promptAuth();
        }
      }
    }
  };

  const promptAuth = async () => {
    if (isPrompting.current) return;
    
    isPrompting.current = true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Personal Budget App',
      fallbackLabel: 'Use Passcode',
    });
    
    if (result.success) {
      setLockedState(false);
      // Wait a tiny bit before allowing new prompts so the biometric overlay can fully dismiss
      setTimeout(() => {
        isPrompting.current = false;
      }, 500);
    } else {
      isPrompting.current = false;
    }
  };

  if (isLocked) {
    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed" size={64} color={Colors.primary} />
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>Use Face ID / Touch ID to unlock your finances.</Text>
        <TouchableOpacity style={styles.btn} onPress={promptAuth}>
          <Text style={styles.btnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return children;
};

export const enableAppLock = async (enable) => {
  await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, enable ? 'true' : 'false');
};

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    color: Colors.darkText,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 8,
    textAlign: 'center',
  },
  btn: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
  },
  btnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppLock;
