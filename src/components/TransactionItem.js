// src/components/TransactionItem.js
// A single transaction row with category icon, description, date, and signed amount.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryConfig } from '../utils/categoryConfig';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const TransactionItem = ({ transaction, currency, onPress }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { type, amount, category, description, date } = transaction;
  const config = getCategoryConfig(category);
  const isIncome = type === 'income';

  const signedAmount = isIncome
    ? `+${formatCurrency(amount, currency)}`
    : `-${formatCurrency(amount, currency)}`;

  const amountColor = isIncome ? Colors.green : Colors.red;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category icon */}
      <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>

      {/* Description + category */}
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {description || category}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.categoryPill, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.categoryText, { color: config.color }]}>
              {category}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(date, 'short')}</Text>
        </View>
      </View>

      {/* Amount */}
      <Text style={[styles.amount, { color: amountColor }]}>
        {signedAmount}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    gap: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 5,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: Colors.grayText,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 0,
  },
});

export default TransactionItem;
