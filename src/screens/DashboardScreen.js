// src/screens/DashboardScreen.js
// Complete home dashboard fetching realtime Firestore data,
// displaying BalanceCard, BudgetProgress, SummaryCard, and Recent Transactions.

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import {
  listenToUserTransactions,
  filterCurrentMonth,
  calcTotalIncome,
  calcTotalExpense,
  calcCategorySpending,
} from '../services/transactionService';

import { currentMonthLabel, getFirstName, getGreeting } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

import BalanceCard from '../components/BalanceCard';
import BudgetProgress from '../components/BudgetProgress';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';

const DashboardScreen = ({ navigation }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData } = useAuth();
  
  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derived calculations
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalBalance: 0,
    categoryData: [],
    recentTransactions: [],
  });

  // No longer fetching profile manually here; userData comes from AuthContext

  // Setup Firestore listeners
  useEffect(() => {
    if (!currentUser?.uid) return;

    if (!currentUser?.uid) return;

    // Listen to all transactions for this user
    const unsubscribe = listenToUserTransactions(
      currentUser.uid,
      (data) => {
        setTransactions(data);
        processTransactions(data);
        setLoading(false);
      },
      (error) => {
        console.error('Listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Process data whenever transactions update
  const processTransactions = (allData) => {
    const currentMonthData = filterCurrentMonth(allData);
    
    const inc = calcTotalIncome(currentMonthData);
    const exp = calcTotalExpense(currentMonthData);
    const bal = calcTotalIncome(allData) - calcTotalExpense(allData); // Total balance from all time
    
    setMetrics({
      totalIncome: inc,
      totalExpense: exp,
      totalBalance: bal,
      categoryData: calcCategorySpending(currentMonthData, 4),
      recentTransactions: allData.slice(0, 5), // Top 5 recent all-time
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Profile updates are handled globally, we just refresh transactions
    // Transactions update automatically via onSnapshot
    setTimeout(() => setRefreshing(false), 800);
  };

  if (loading) {
    return <Loader visible={true} message="Loading your dashboard..." />;
  }

  const currency = userData?.currency || 'INR';
  const monthlyBudget = userData?.monthlyBudget || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{getFirstName(userData?.displayName || currentUser?.email)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.avatarBtn, userData?.photoURL && { borderWidth: 0 }]}
          onPress={() => navigation.navigate('Profile')}
        >
          {userData?.photoURL ? (
            <Image 
              source={{ uri: userData.photoURL }} 
              style={{ width: '100%', height: '100%', borderRadius: 22 }} 
            />
          ) : (
            <Ionicons name="person" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Balance Card ── */}
        <BalanceCard
          totalBalance={metrics.totalBalance}
          totalIncome={metrics.totalIncome}
          totalExpense={metrics.totalExpense}
          currency={currency}
          monthLabel={currentMonthLabel()}
        />

        {/* ── Quick Actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionIncome]}
            onPress={() => navigation.navigate('AddTransaction', { defaultType: 'income' })}
          >
            <Ionicons name="arrow-down-outline" size={20} color={Colors.white} />
            <Text style={styles.actionText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionExpense]}
            onPress={() => navigation.navigate('AddTransaction', { defaultType: 'expense' })}
          >
            <Ionicons name="arrow-up-outline" size={20} color={Colors.white} />
            <Text style={styles.actionText}>Expense</Text>
          </TouchableOpacity>
        </View>

        {/* ── Budget Progress ── */}
        <View style={styles.section}>
          <BudgetProgress
            monthlyBudget={monthlyBudget}
            amountSpent={metrics.totalExpense}
            currency={currency}
          />
        </View>

        {/* ── Category Spending ── */}
        {metrics.categoryData.length > 0 && (
          <View style={styles.section}>
            <SummaryCard categoryData={metrics.categoryData} currency={currency} />
          </View>
        )}

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {metrics.recentTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {metrics.recentTransactions.map((t, index) => (
                <View key={t.id}>
                  <TransactionItem transaction={t} currency={currency} />
                  {index < metrics.recentTransactions.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No Transactions Yet"
              message="Add your first income or expense to see it here."
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: Colors.grayText,
    marginBottom: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  // ── Quick Actions ──
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIncome: {
    backgroundColor: Colors.green,
  },
  actionExpense: {
    backgroundColor: Colors.red,
  },
  actionText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Sections ──
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkText,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionsList: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginLeft: 80, // Aligns with the text in TransactionItem
  },
});

export default DashboardScreen;
