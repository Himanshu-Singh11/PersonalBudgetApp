// src/screens/BudgetScreen.js
// Screen to manage monthly category budgets and overall budget progress.

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import {
  listenToUserBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
} from '../services/budgetService';
import {
  getCurrentMonthTransactions,
} from '../services/transactionService';

import BudgetProgress from '../components/BudgetProgress';
import CategoryItem from '../components/CategoryItem';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { EXPENSE_CATEGORIES } from '../utils/categoryConfig';

const BudgetScreen = () => {
  const { showAlert } = useAlert();
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const fetchData = async () => {
      try {
        // No longer fetching user profile here, handled in AuthContext

        // Get this month's transactions to calculate spent amounts
        const txs = await getCurrentMonthTransactions(currentUser.uid);
        setTransactions(txs);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();

    // Listen to current month's category budgets
    const unsubscribe = listenToUserBudgets(currentUser.uid, currentMonth, currentYear, (data) => {
      setBudgets(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Derived calculations
  const globalMonthlyBudget = userData?.monthlyBudget || 0;
  const currency = userData?.currency || 'INR';
  
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Calculate spent per category
  const categorySpending = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const cat = t.category || 'Other';
      categorySpending[cat] = (categorySpending[cat] || 0) + (t.amount || 0);
    }
  });

  const handleOpenModal = (budgetToEdit = null) => {
    if (budgetToEdit) {
      setIsEditing(true);
      setEditId(budgetToEdit.id);
      setCategory(budgetToEdit.category);
      setLimitAmount(budgetToEdit.limitAmount.toString());
    } else {
      setIsEditing(false);
      setEditId(null);
      setCategory('');
      setLimitAmount('');
    }
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  };

  const handleSaveBudget = async () => {
    if (!category) {
      showAlert('Validation', 'Please select a category.');
      return;
    }
    const amt = parseFloat(limitAmount);
    if (isNaN(amt) || amt <= 0) {
      showAlert('Validation', 'Please enter a valid limit amount.');
      return;
    }

    // Check if category already exists in budgets when adding
    if (!isEditing && budgets.some(b => b.category === category)) {
      showAlert('Exists', 'A budget for this category already exists. Please edit it instead.');
      return;
    }

    try {
      const now = new Date();
      const payload = {
        category,
        limitAmount: amt,
        month: now.getMonth(),
        year: now.getFullYear(),
      };

      if (isEditing) {
        await updateBudget(editId, payload);
      } else {
        await addBudget(currentUser.uid, payload);
      }
      setModalVisible(false);
    } catch (err) {
      showAlert('Error', 'Failed to save budget.');
    }
  };

  const handleDeleteBudget = () => {
    showAlert('Delete Budget', 'Remove this category budget?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(editId);
            setModalVisible(false);
          } catch (err) {
            showAlert('Error', 'Failed to delete budget.');
          }
        }
      }
    ]);
  };

  if (loading) return <Loader visible={true} message="Loading budgets..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Global Budget Progress */}
        <BudgetProgress 
          monthlyBudget={globalMonthlyBudget}
          amountSpent={totalSpent}
          currency={currency}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addBtn}>
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {budgets.length > 0 ? (
          <View style={styles.list}>
            {budgets.map((b) => (
              <CategoryItem
                key={b.id}
                category={b.category}
                limitAmount={b.limitAmount}
                spentAmount={categorySpending[b.category] || 0}
                currency={currency}
                onPress={() => handleOpenModal(b)}
              />
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="wallet-outline" 
            title="No Category Budgets" 
            message="Set up specific budgets for categories like Food or Transport."
            buttonText="Create Budget"
            onButtonPress={() => handleOpenModal()}
          />
        )}
      </ScrollView>

      {/* ── Add/Edit Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Budget' : 'New Category Budget'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity 
                style={styles.dropdownBtn}
                onPress={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)}
                disabled={isEditing} // usually don't change category of an existing budget
              >
                <Text style={[styles.dropdownText, !category && {color: Colors.grayText}]}>
                  {category || 'Select Category'}
                </Text>
                {!isEditing && <Ionicons name={isCategoryDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={Colors.grayText} />}
              </TouchableOpacity>

              {isCategoryDropdownOpen && !isEditing && (
                <View style={styles.chipContainer}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.chip, category === cat && styles.chipActive]}
                      onPress={() => { setCategory(cat); setCategoryDropdownOpen(false); }}
                    >
                      <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                <CustomInput
                  label="Monthly Limit"
                  value={limitAmount}
                  onChangeText={setLimitAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  leftIcon="cash-outline"
                />
              </View>

              <CustomButton
                title="Save Budget"
                onPress={handleSaveBudget}
                style={{ marginTop: 16 }}
              />

              {isEditing && (
                <CustomButton
                  title="Delete Budget"
                  onPress={handleDeleteBudget}
                  variant="danger"
                  style={{ marginTop: 12 }}
                  leftIcon="trash-outline"
                />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkText,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 8,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.borderColor,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.darkText,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.grayText,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default BudgetScreen;
