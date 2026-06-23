// src/screens/SignupScreen.js
// Full fintech-style signup screen with 4-field form, Firebase account creation,
// Firestore profile save, all validations, and keyboard-aware layout.

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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

// ── Validation ───────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (name, email, password, confirmPassword) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Full name is required.';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

// ── Firebase error messages ──────────────────────────────
const getFriendlyError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'Signup failed. Please try again.';
  }
};

// ── Password strength meter ──────────────────────────────
const getPasswordStrength = (password, Colors) => {
  if (!password) return { level: 0, label: '', color: 'transparent' };
  if (password.length < 6) return { level: 1, label: 'Weak', color: Colors.red };
  if (password.length < 10 && !/[A-Z]/.test(password))
    return { level: 2, label: 'Fair', color: Colors.orange };
  if (/[A-Z]/.test(password) && /[0-9]/.test(password))
    return { level: 4, label: 'Strong', color: Colors.green };
  return { level: 3, label: 'Good', color: Colors.primary };
};

const PasswordStrengthBar = ({ password, Colors }) => {
  const strength = getPasswordStrength(password, Colors);
  if (!password) return null;

  return (
    <View style={strengthStyles.wrapper}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              {
                backgroundColor:
                  i <= strength.level ? strength.color : Colors.borderColor,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color: strength.color }]}>
        {strength.label}
      </Text>
    </View>
  );
};

const strengthStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    gap: 10,
  },
  bars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    width: 48,
    textAlign: 'right',
  },
});

// ── Main Screen ──────────────────────────────────────────
const SignupScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { signup } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Keyboard refs
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Shake anim for error banner
  const errorShake = useRef(new Animated.Value(0)).current;

  const triggerErrorShake = () => {
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 6, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  // Clear a specific field error on typing
  const clearError = (field) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
    setGlobalError('');
  };

  // ── Signup handler ─────────────────────────────────────
  const handleSignup = async () => {
    setGlobalError('');
    const validationErrors = validateForm(name, email, password, confirmPassword);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      // signup() in AuthContext creates the user AND saves Firestore profile
      await signup(email.trim(), password, name.trim());
      // AppNavigator detects auth change and shows BottomTabNavigator automatically
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
      <Loader visible={loading} message="Creating your account..." />

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
            <Text style={styles.title}>Create Account ✨</Text>
            <Text style={styles.subtitle}>
              Join thousands managing their{'\n'}finances smarter every day
            </Text>

            {/* ── Global error banner ── */}
            {globalError ? (
              <Animated.View
                style={[
                  styles.errorBanner,
                  { transform: [{ translateX: errorShake }] },
                ]}
              >
                <Ionicons name="warning-outline" size={16} color={Colors.red} />
                <Text style={styles.errorBannerText}>{globalError}</Text>
              </Animated.View>
            ) : null}

            {/* ── Form ── */}
            <View style={styles.form}>
              {/* Full Name */}
              <CustomInput
                label="Full Name"
                value={name}
                onChangeText={(text) => { setName(text); clearError('name'); }}
                placeholder="Jane Doe"
                autoCapitalize="words"
                autoComplete="name"
                leftIcon="person-outline"
                error={errors.name}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              {/* Email */}
              <CustomInput
                label="Email Address"
                value={email}
                onChangeText={(text) => { setEmail(text); clearError('email'); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
                error={errors.email}
                inputRef={emailRef}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              {/* Password */}
              <CustomInput
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); clearError('password'); }}
                placeholder="Min. 6 characters"
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.password}
                inputRef={passwordRef}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />

              {/* Password strength indicator */}
              <PasswordStrengthBar password={password} Colors={Colors} />

              {/* Confirm Password */}
              <CustomInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); clearError('confirmPassword'); }}
                placeholder="Re-enter your password"
                secureTextEntry
                leftIcon="shield-checkmark-outline"
                error={errors.confirmPassword}
                inputRef={confirmPasswordRef}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />

              {/* Terms notice */}
              <Text style={styles.termsText}>
                By creating an account you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>

              {/* Submit */}
              <CustomButton
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                leftIcon="checkmark-circle-outline"
              />
            </View>

            {/* ── Login link ── */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
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
  termsText: {
    fontSize: 12,
    color: Colors.grayText,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Login link ────────────────────────────────────────
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  loginText: {
    fontSize: 14,
    color: Colors.grayText,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default SignupScreen;
