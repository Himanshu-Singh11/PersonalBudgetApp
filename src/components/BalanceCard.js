// src/components/BalanceCard.js
// Gradient hero card showing Total Balance, Income, Expense, and Savings.

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// ── Mini metric chip (Income / Expense / Savings) ────────
const MetricChip = ({ icon, label, amount, iconBg, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.metricChip,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.metricIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={Colors.white} />
      </View>
      <View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricAmount}>{formatCurrency(amount)}</Text>
      </View>
    </Animated.View>
  );
};

// ── Main BalanceCard ─────────────────────────────────────
const BalanceCard = ({
  totalBalance = 0,
  totalIncome = 0,
  totalExpense = 0,
  currency = 'USD',
  monthLabel = '',
}) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const savings = totalIncome - totalExpense;
  const balanceFade = useRef(new Animated.Value(0)).current;
  const balanceScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(balanceFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(balanceScale, {
        toValue: 1,
        bounciness: 6,
        speed: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#1E40AF', '#2563EB', '#3B82F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Month label */}
      <View style={styles.monthRow}>
        <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
        <Text style={styles.monthLabel}>{monthLabel}</Text>
      </View>

      {/* Total balance */}
      <Text style={styles.balanceTitle}>Total Balance</Text>
      <Animated.Text
        style={[
          styles.balanceAmount,
          { opacity: balanceFade, transform: [{ scale: balanceScale }] },
        ]}
      >
        {formatCurrency(totalBalance, currency)}
      </Animated.Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <MetricChip
          icon="arrow-down-outline"
          label="Income"
          amount={totalIncome}
          iconBg="rgba(16,185,129,0.75)"
          delay={100}
        />
        <View style={styles.metricSeparator} />
        <MetricChip
          icon="arrow-up-outline"
          label="Expenses"
          amount={totalExpense}
          iconBg="rgba(239,68,68,0.75)"
          delay={200}
        />
        <View style={styles.metricSeparator} />
        <MetricChip
          icon="wallet-outline"
          label="Savings"
          amount={savings}
          iconBg={savings >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(239,68,68,0.75)'}
          delay={300}
        />
      </View>
    </LinearGradient>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  circleTopRight: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -40,
  },
  circleBottomLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -20,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  balanceTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricSeparator: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  metricChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  metricAmount: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default BalanceCard;
