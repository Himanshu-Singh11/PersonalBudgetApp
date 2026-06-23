// src/components/Loader.js
// Full-screen loading overlay with animated pulse indicator.
// FIX: BounceDot was previously defined AFTER Loader which used it, causing a
// "Cannot access 'BounceDot' before initialization" ReferenceError at runtime.
// BounceDot is now defined first.

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

// ── Bouncing dot sub-component (must be defined BEFORE Loader) ────────────────
const BounceDot = ({ delay, Colors, styles }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY: bounceAnim }] }]}
    />
  );
};

// ── Main Loader ───────────────────────────────────────────────────────────────
/**
 * @param {boolean} visible   Show or hide the overlay
 * @param {string}  message   Optional text displayed below the spinner
 */
const Loader = ({ visible = false, message = 'Please wait...' }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      pulseAnim.stopAnimation();
    }
  }, [visible]);

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <BounceDot key={i} delay={i * 160} Colors={Colors} styles={styles} />
            ))}
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 44,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  message: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Loader;
