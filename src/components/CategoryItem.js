// src/components/CategoryItem.js
// Shows a category's budget limit, spent amount, and a small progress bar.

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryConfig } from '../utils/categoryConfig';
import { formatCurrency } from '../utils/formatters';
import { calculateBudgetStatus } from '../services/budgetService';
import { useTheme } from '../context/ThemeContext';

const CategoryItem = ({ category, limitAmount, spentAmount, currency = 'USD', onPress }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const config = getCategoryConfig(category);
  const status = calculateBudgetStatus(limitAmount, spentAmount);
  
  const percentage = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0;
  const displayPercent = Math.min(percentage, 100);

  const barColor = status === 'exceeded' 
    ? Colors.red 
    : status === 'warning' 
    ? Colors.orange 
    : Colors.primary;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: displayPercent,
      duration: 800,
      delay: 100,
      useNativeDriver: false,
    }).start();
  }, [displayPercent]);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={18} color={config.color} />
          </View>
          <Text style={styles.categoryName}>{category}</Text>
        </View>
        <View style={styles.amounts}>
          <Text style={styles.spentText}>{formatCurrency(spentAmount, currency)}</Text>
          <Text style={styles.limitText}> / {formatCurrency(limitAmount, currency)}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {status === 'exceeded' && (
        <Text style={styles.warningText}>Over budget by {formatCurrency(spentAmount - limitAmount, currency)}</Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkText,
  },
  amounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkText,
  },
  limitText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.grayText,
  },
  track: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  warningText: {
    fontSize: 11,
    color: Colors.red,
    marginTop: 8,
    fontWeight: '500',
  },
});

export default CategoryItem;
