// src/screens/LoginScreen.js
// Full fintech-style login screen with email/password validation,
// Firebase auth via AuthContext, and keyboard-aware layout.

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';

// ── Validation helpers ───────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (email, password) => {
  const errors = {};
  if (!email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return errors;
};

// ── Firebase error messages ──────────────────────────────
const getFriendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'Login failed. Please try again.';
  }
};

// ── Main Screen ──────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Refs for keyboard "next" flow
  const passwordRef = useRef(null);

  // Shake animation for global error banner
  const errorShake = useRef(new Animated.Value(0)).current;

  const triggerErrorShake = () => {
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 6, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  // ── Login handler ──────────────────────────────────────
  const handleLogin = async () => {
    setGlobalError('');
    const validationErrors = validateForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await login(email.trim(), password);
      // AppNavigator automatically navigates to BottomTabNavigator on auth change
    } catch (error) {
      const message = getFriendlyError(error.code);
      setGlobalError(message);
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loader visible={loading} message="Signing you in..." />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            {/* ── Logo badge ── */}
            <View style={styles.logoBadge}>
              <LinearGradient
                colors={[Colors.primary, '#3B82F6']}
                style={styles.logoGradient}
              >
                <Ionicons name="wallet" size={28} color={Colors.white} />
              </LinearGradient>
            </View>

            {/* ── Title ── */}
            <Text style={styles.title}>Welcome back 👋</Text>
            <Text style={styles.subtitle}>
              Sign in to continue managing{'\n'}your personal budget
            </Text>

            {/* ── Global error banner ── */}
            {globalError ? (
              <Animated.View
                style={[
                  styles.errorBanner,
                  { transform: [{ translateX: errorShake }] },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={Colors.red}
                />
                <Text style={styles.errorBannerText}>{globalError}</Text>
              </Animated.View>
            ) : null}

            {/* ── Form ── */}
            <View style={styles.form}>
              <CustomInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((e) => ({ ...e, email: '' }));
                  setGlobalError('');
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
                error={errors.email}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <CustomInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((e) => ({ ...e, password: '' }));
                  setGlobalError('');
                }}
                placeholder="Your password"
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.password}
                inputRef={passwordRef}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              {/* Forgot password */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Submit */}
              <CustomButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                leftIcon="log-in-outline"
              />
            </View>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to Personal Budget?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Signup link ── */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Header ────────────────────────────────────────────
  header: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Logo ──────────────────────────────────────────────
  logoBadge: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Title ─────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.grayText,
    lineHeight: 22,
    marginBottom: 32,
  },

  // ── Error banner ──────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.red,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Form ──────────────────────────────────────────────
  form: {
    gap: 0,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Divider ───────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderColor,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.grayText,
    fontWeight: '500',
    flexShrink: 0,
  },

  // ── Signup link ───────────────────────────────────────
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: Colors.grayText,
  },
  signupLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default LoginScreen;
