// src/components/BudgetProgress.js
// Monthly budget progress bar with colour-coded warnings.
// Normal < 80% → blue   80-99% → orange   100%+ → red

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const BudgetProgress = ({
  monthlyBudget = 0,
  amountSpent = 0,
  currency = 'USD',
}) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const remaining = Math.max(monthlyBudget - amountSpent, 0);
  const rawPercent =
    monthlyBudget > 0 ? (amountSpent / monthlyBudget) * 100 : 0;
  const displayPercent = Math.min(Math.round(rawPercent), 100);
  const isExceeded = rawPercent >= 100;
  const isWarning = rawPercent >= 80 && !isExceeded;

  // Bar colour logic
  const barColor = isExceeded
    ? Colors.red
    : isWarning
    ? Colors.orange
    : Colors.primary;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(rawPercent, 100),
      duration: 900,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [rawPercent]);

  // No budget set yet
  if (monthlyBudget === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.noBudgetRow}>
          <View style={[styles.iconBox, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
          </View>
          <View style={styles.noBudgetText}>
            <Text style={styles.noBudgetTitle}>No Monthly Budget Set</Text>
            <Text style={styles.noBudgetSub}>
              Set a budget in Profile to track progress.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <View style={[styles.iconBox, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="speedometer-outline" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Monthly Budget</Text>
        </View>
        <Text style={[styles.percent, { color: barColor }]}>
          {displayPercent}%
        </Text>
      </View>

      {/* Progress track */}
      <View style={styles.trackWrapper}>
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
      </View>

      {/* Amounts row */}
      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountLabel}>Spent</Text>
          <Text style={[styles.amountValue, { color: barColor }]}>
            {formatCurrency(amountSpent, currency)}
          </Text>
        </View>
        <View style={styles.remainingRight}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text style={[styles.amountValue, { color: Colors.green }]}>
            {isExceeded ? '—' : formatCurrency(remaining, currency)}
          </Text>
        </View>
        <View style={styles.budgetRight}>
          <Text style={styles.amountLabel}>Budget</Text>
          <Text style={[styles.amountValue, { color: Colors.darkText }]}>
            {formatCurrency(monthlyBudget, currency)}
          </Text>
        </View>
      </View>

      {/* Warning / exceeded banner */}
      {(isWarning || isExceeded) && (
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: isExceeded ? Colors.red + '20' : Colors.orange + '20' },
          ]}
        >
          <Ionicons
            name={isExceeded ? 'close-circle-outline' : 'warning-outline'}
            size={15}
            color={isExceeded ? Colors.red : Colors.orange}
          />
          <Text
            style={[
              styles.warningText,
              { color: isExceeded ? Colors.red : Colors.orange },
            ]}
          >
            {isExceeded
              ? `Budget exceeded by ${formatCurrency(amountSpent - monthlyBudget, currency)}!`
              : `You've used ${displayPercent}% of your budget — stay cautious.`}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // ── No budget ─────────────────────────────────────────
  noBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  noBudgetText: { flex: 1 },
  noBudgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  noBudgetSub: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },

  // ── Title ─────────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleLeft: {
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
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkText,
  },
  percent: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ── Progress bar ──────────────────────────────────────
  trackWrapper: {
    marginBottom: 16,
  },
  track: {
    height: 10,
    backgroundColor: Colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },

  // ── Amounts ───────────────────────────────────────────
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  remainingRight: { alignItems: 'center' },
  budgetRight: { alignItems: 'flex-end' },
  amountLabel: {
    fontSize: 11,
    color: Colors.grayText,
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Warning ───────────────────────────────────────────
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
});

export default BudgetProgress;
