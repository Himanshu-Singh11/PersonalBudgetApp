// src/screens/OnboardingScreen.js
// Modern fintech-style welcome screen with 3 feature highlight cards,
// animated entrance, and navigation to Login.

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// ── Feature card data removed from here ──────────────────
// ── Feature card ─────────────────────────────────────────
const FeatureCard = ({ item, animValue, styles }) => (
  <Animated.View
    style={[
      styles.featureCard,
      { opacity: animValue, transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
    ]}
  >
    <View style={[styles.featureIconBox, { backgroundColor: item.bgColor }]}>
      <Ionicons name={item.icon} size={26} color={item.color} />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDesc}>{item.desc}</Text>
    </View>
  </Animated.View>
);

// ── Main Screen ──────────────────────────────────────────
const OnboardingScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const FEATURES = [
    {
      icon: 'receipt-outline',
      color: Colors.primary,
      bgColor: '#EFF6FF',
      title: 'Track Expenses',
      desc: 'Log every purchase instantly and categorize your spending with ease.',
    },
    {
      icon: 'wallet-outline',
      color: Colors.orange,
      bgColor: '#FEF3C7',
      title: 'Manage Budgets',
      desc: 'Set monthly limits per category and get alerts before you overspend.',
    },
    {
      icon: 'bar-chart-outline',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      title: 'View Analytics',
      desc: 'Beautiful charts reveal your spending patterns at a glance.',
    },
  ];
  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.stagger(120, [
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(taglineAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(card1Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(card2Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(card3Anim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const cardAnims = [card1Anim, card2Anim, card3Anim];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero section ── */}
        <LinearGradient
          colors={['#1D4ED8', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Decorative blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoAnim,
                transform: [
                  {
                    scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.logoGlass}
            >
              <Ionicons name="wallet" size={44} color={Colors.white} />
            </LinearGradient>
          </Animated.View>

          {/* App title */}
          <Animated.Text
            style={[
              styles.heroTitle,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Personal Budget
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.heroTagline,
              {
                opacity: taglineAnim,
                transform: [
                  {
                    translateY: taglineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Your money, your rules.{'\n'}Take control of every dollar.
          </Animated.Text>
        </LinearGradient>

        {/* ── Feature cards ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionLabel}>EVERYTHING YOU NEED</Text>

          {FEATURES.map((item, index) => (
            <FeatureCard
              key={item.title}
              item={item}
              animValue={cardAnims[index]}
              styles={styles}
            />
          ))}
        </View>

        {/* ── CTA section ── */}
        <Animated.View
          style={[
            styles.ctaSection,
            {
              opacity: btnAnim,
              transform: [
                {
                  translateY: btnAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <CustomButton
            title="Get Started — It's Free"
            onPress={() => navigation.navigate('Signup')}
            variant="primary"
            leftIcon="rocket-outline"
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── Hero ──────────────────────────────────────────────
  hero: {
    paddingTop: 48,
    paddingBottom: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -60,
  },
  blob2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoGlass: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroTagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },

  // ── Features ──────────────────────────────────────────
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grayText,
    letterSpacing: 1.2,
    marginBottom: 20,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.grayText,
    lineHeight: 19,
  },

  // ── CTA ───────────────────────────────────────────────
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    backgroundColor: Colors.white,
    gap: 20,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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

export default OnboardingScreen;
