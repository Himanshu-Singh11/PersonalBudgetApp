// src/components/CustomInput.js
// Reusable text input with label, icon, error state, and password toggle.

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  leftIcon,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation triggered when error appears
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Shake whenever a new error appears
  React.useEffect(() => {
    if (error) triggerShake();
  }, [error]);

  const isSecure = secureTextEntry && !isPasswordVisible;

  const borderColor = error
    ? Colors.red
    : isFocused
    ? Colors.primary
    : Colors.borderColor;

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Input row */}
      <Animated.View
        style={[
          styles.inputRow,
          { borderColor },
          isFocused && styles.inputRowFocused,
          error && styles.inputRowError,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {/* Left icon */}
        {leftIcon ? (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={18}
              color={isFocused ? Colors.primary : Colors.grayText}
            />
          </View>
        ) : null}

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[styles.input, !leftIcon && styles.inputNoIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.borderColor}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={Colors.primary}
        />

        {/* Password toggle */}
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.grayText}
            />
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderColor,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputRowFocused: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRowError: {
    backgroundColor: '#FFF5F5',
  },
  leftIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.darkText,
    paddingVertical: 0, // Remove Android default padding
  },
  inputNoIcon: {
    paddingLeft: 2,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.red,
    flex: 1,
  },
});

export default CustomInput;
