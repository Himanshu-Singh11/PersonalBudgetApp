// src/components/EmptyState.js
// Reusable empty state placeholder with icon, message, and optional action button.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { useTheme } from '../context/ThemeContext';

const EmptyState = ({
  icon = 'document-text-outline',
  title = 'No Data Found',
  message = 'There is nothing to show here right now.',
  buttonText,
  onButtonPress,
  iconBg = '#EFF6FF',
  iconColor, // We will default this later or use theme fallback if it's undefined initially.
}) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const resolvedIconColor = iconColor || Colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={32} color={resolvedIconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {buttonText && onButtonPress && (
        <View style={styles.buttonWrapper}>
          <CustomButton
            title={buttonText}
            onPress={onButtonPress}
            variant="secondary"
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderStyle: 'dashed',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonWrapper: {
    width: '100%',
  },
});

export default EmptyState;
