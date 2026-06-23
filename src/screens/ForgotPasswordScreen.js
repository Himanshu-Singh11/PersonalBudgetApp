// src/screens/ForgotPasswordScreen.js
// Sends a Firebase password-reset email with clean UI and success confirmation.

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const errorShake = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 6, duration: 70, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  const triggerSuccess = () => {
    Animated.spring(successScale, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 12,
      speed: 8,
    }).start();
  };

  const handleReset = async () => {
    setGlobalError('');
    if (!email.trim()) {
      setEmailError('Email address is required.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSent(true);
      triggerSuccess();
    } catch (error) {
      let message = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }
      setGlobalError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successIconWrapper,
              { transform: [{ scale: successScale }] },
            ]}
          >
            <LinearGradient
              colors={[Colors.green, '#34D399']}
              style={styles.successIconBg}
            >
              <Ionicons name="mail-open-outline" size={44} color={Colors.white} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.successTitle}>Check Your Inbox</Text>
          <Text style={styles.successSubtitle}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>

          <View style={styles.successTipCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.successTipText}>
              Check your spam folder if you don't see the email within a few minutes.
            </Text>
          </View>

          <CustomButton
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            leftIcon="arrow-back-outline"
          />

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => { setSent(false); successScale.setValue(0); }}
          >
            <Text style={styles.resendText}>Resend email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form state ─────────────────────────────────────────
  return (
    <>
      <Loader visible={loading} message="Sending reset link..." />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back button */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            {/* Icon */}
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={[Colors.orange, '#FBBF24']}
                style={styles.iconBg}
              >
                <Ionicons name="key-outline" size={32} color={Colors.white} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter the email linked to your account and we'll send a reset link.
            </Text>

            {/* Error banner */}
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

            {/* Email input */}
            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
                setGlobalError('');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={emailError}
              returnKeyType="send"
              onSubmitEditing={handleReset}
            />

            <CustomButton
              title="Send Reset Link"
              onPress={handleReset}
              loading={loading}
              leftIcon="send-outline"
            />

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back-outline" size={16} color={Colors.primary} />
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
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
  kav: { flex: 1 },
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

  // ── Icon ──────────────────────────────────────────────
  iconWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Title ─────────────────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grayText,
    lineHeight: 22,
    marginBottom: 28,
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

  // ── Back link ─────────────────────────────────────────
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  backToLoginText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Success state ─────────────────────────────────────
  successContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    alignItems: 'center',
    gap: 16,
  },
  successIconWrapper: {
    marginBottom: 8,
  },
  successIconBg: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 23,
  },
  successEmail: {
    color: Colors.primary,
    fontWeight: '700',
  },
  successTipCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  successTipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19,
  },
  resendBtn: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.grayText,
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
