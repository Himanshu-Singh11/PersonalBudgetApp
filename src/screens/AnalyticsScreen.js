// src/screens/AnalyticsScreen.js
// Fixed: generateSmartSuggestions now receives correct data (not monthlyData.transactions which is undefined)

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { listenToUserTransactions, filterCurrentMonth } from '../services/transactionService';
import { getCategoryConfig } from '../utils/categoryConfig';
import { currentMonthLabel, formatCurrency } from '../utils/formatters';
import { generateSmartSuggestions } from '../services/aiService';

import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

const AnalyticsScreen = () => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData } = useAuth();
  const currency = userData?.currency || 'INR';

  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({ income: 0, expense: 0 });
  const [categoryData, setCategoryData] = useState([]);
  // FIX: store the raw transactions array for AI analysis
  const [monthTransactions, setMonthTransactions] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = listenToUserTransactions(
      currentUser.uid,
      (allData) => {
        const currentMonthData = filterCurrentMonth(allData);
        setMonthTransactions(currentMonthData); // store for AI

        let inc = 0;
        let exp = 0;
        const catMap = {};

        currentMonthData.forEach((t) => {
          const amt = t.amount || 0;
          if (t.type === 'income') {
            inc += amt;
          } else {
            exp += amt;
            const cat = t.category || 'Other';
            catMap[cat] = (catMap[cat] || 0) + amt;
          }
        });

        setMonthlyData({ income: inc, expense: exp });

        const pieData = Object.keys(catMap)
          .map((cat) => {
            const config = getCategoryConfig(cat);
            return {
              name: cat,
              amount: catMap[cat],
              color: config.color,
              legendFontColor: Colors.grayText,
              legendFontSize: 12,
            };
          })
          .sort((a, b) => b.amount - a.amount);

        setCategoryData(pieData);
        setLoading(false);
      },
      (err) => {
        console.error('Analytics listener error', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) return <Loader visible={true} message="Crunching numbers..." />;

  const hasData = monthlyData.income > 0 || monthlyData.expense > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>{currentMonthLabel()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState
              icon="pie-chart-outline"
              title="No Data for Analytics"
              message="Add some transactions this month to see your spending insights."
            />
          </View>
        ) : (
          <>
            {/* ── Income vs Expense Bar Chart ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bar-chart" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Cash Flow</Text>
              </View>
              <BarChart
                data={{
                  labels: ['Income', 'Expense'],
                  datasets: [
                    {
                      data: [monthlyData.income, monthlyData.expense],
                      colors: [
                        () => Colors.green,
                        () => Colors.red,
                      ],
                    },
                  ],
                }}
                width={CHART_WIDTH}
                height={220}
                withCustomBarColorFromData={true}
                flatColor={true}
                showValuesOnTopOfBars={true}
                fromZero={true}
                chartConfig={{
                  backgroundColor: Colors.white,
                  backgroundGradientFrom: Colors.white,
                  backgroundGradientTo: Colors.white,
                  decimalPlaces: 0,
                  color: () => Colors.darkText,
                  labelColor: () => Colors.grayText,
                  barPercentage: 0.8,
                  fillShadowGradientOpacity: 1,
                }}
                style={styles.chartStyle}
              />
            </View>

            {/* ── Category Breakdown Pie Chart ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart" size={20} color={Colors.orange} />
                <Text style={styles.cardTitle}>Expense Breakdown</Text>
              </View>
              {categoryData.length > 0 ? (
                <PieChart
                  data={categoryData}
                  width={CHART_WIDTH}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  hasLegend={true}
                  style={styles.chartStyle}
                />
              ) : (
                <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              )}
            </View>

            {/* ── AI Insights ── */}
            <View
              style={[
                styles.card,
                { backgroundColor: Colors.purple + '20', borderColor: Colors.purple, borderWidth: 1 },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="sparkles" size={20} color={Colors.purple} />
                <Text style={[styles.cardTitle, { color: Colors.purple }]}>AI Insights</Text>
              </View>
              {/* FIX: pass monthTransactions (array) and monthlyData.expense as the budget proxy */}
              <Text style={styles.insightText}>
                {generateSmartSuggestions(monthTransactions, monthlyData.expense)}
              </Text>
            </View>

            {/* ── Summary Text ── */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Month Summary</Text>
              <Text style={styles.summaryText}>
                You earned{' '}
                <Text style={{ color: Colors.green, fontWeight: '700' }}>
                  {formatCurrency(monthlyData.income, currency)}
                </Text>{' '}
                and spent{' '}
                <Text style={{ color: Colors.red, fontWeight: '700' }}>
                  {formatCurrency(monthlyData.expense, currency)}
                </Text>{' '}
                this month.
              </Text>
              {monthlyData.income > monthlyData.expense ? (
                <Text style={styles.insightText}>Great job! You are saving money. 📈</Text>
              ) : monthlyData.expense > monthlyData.income ? (
                <Text style={styles.insightText}>
                  Watch out! You spent more than you earned. ⚠️
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.darkText, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.grayText, fontWeight: '500', marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.darkText },
  chartStyle: { marginVertical: 8, borderRadius: 16 },
  emptyText: { textAlign: 'center', color: Colors.grayText, paddingVertical: 20 },
  summaryCard: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  summaryText: { fontSize: 14, color: Colors.darkText, lineHeight: 22, marginBottom: 8 },
  insightText: { fontSize: 13, fontWeight: '600', color: Colors.darkText },
});

export default AnalyticsScreen;
