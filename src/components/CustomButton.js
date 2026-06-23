// src/components/CustomButton.js
// Reusable animated button with loading state, variants, and press animation.

import React, { useRef, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * @param {string}   variant     'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {boolean}  loading     Shows spinner and disables press
 * @param {string}   leftIcon    Ionicons icon name rendered left of label
 * @param {boolean}  fullWidth   Stretches button to container width (default true)
 */
const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  fullWidth = true,
  style,
}) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    fullWidth && styles.fullWidth,
    styles[variant],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [styles.baseText, styles[`${variant}Text`]];

  const spinnerColor =
    variant === 'secondary' || variant === 'ghost'
      ? Colors.primary
      : Colors.white;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} size="small" />
        ) : (
          <View style={styles.content}>
            {leftIcon ? (
              <Ionicons
                name={leftIcon}
                size={18}
                color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.primary}
                style={styles.icon}
              />
            ) : null}
            <Text style={textStyle}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },

  // ── Variants ───────────────────────────────────────────
  primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.red,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  disabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Text ───────────────────────────────────────────────
  baseText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryText: { color: Colors.white },
  secondaryText: { color: Colors.primary },
  ghostText: { color: Colors.primary },
  dangerText: { color: Colors.white },
});

export default CustomButton;
