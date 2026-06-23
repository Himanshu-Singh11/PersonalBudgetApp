// src/screens/BillsScreen.js
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
import { Timestamp } from 'firebase/firestore';

import {
  listenToUserBills,
  addBill,
  updateBill,
  deleteBill,
  markBillAsPaid,
} from '../services/billService';
import { scheduleBillReminder } from '../services/NotificationService';

import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/formatters';

const BillsScreen = () => {
  const { showAlert } = useAlert();
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData } = useAuth();
  const currency = userData?.currency || 'INR';
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [billName, setBillName] = useState('');
  const [amount, setAmount] = useState('');
  const [repeatType, setRepeatType] = useState('none');

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = listenToUserBills(currentUser.uid, (data) => {
      setBills(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleOpenModal = (billToEdit = null) => {
    if (billToEdit) {
      setIsEditing(true);
      setEditId(billToEdit.id);
      setBillName(billToEdit.billName);
      setAmount(billToEdit.amount.toString());
      setRepeatType(billToEdit.repeatType || 'none');
    } else {
      setIsEditing(false);
      setEditId(null);
      setBillName('');
      setAmount('');
      setRepeatType('monthly'); // Default to monthly
    }
    setModalVisible(true);
  };

  const handleSaveBill = async () => {
    if (!billName.trim()) {
      showAlert('Validation', 'Please enter a bill name.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      showAlert('Validation', 'Please enter a valid amount.');
      return;
    }

    try {
      const payload = {
        billName: billName.trim(),
        amount: amt,
        repeatType,
        // Using current time as a placeholder for dueDate
        dueDate: isEditing ? undefined : Timestamp.now(), 
        reminderEnabled: true,
      };

      if (isEditing) {
        await updateBill(editId, payload);
      } else {
        await addBill(currentUser.uid, payload);
        if (payload.dueDate) {
          await scheduleBillReminder(payload.billName, payload.dueDate.toDate());
        }
      }
      setModalVisible(false);
    } catch (err) {
      showAlert('Error', 'Failed to save bill.');
    }
  };

  const handleDeleteBill = () => {
    showAlert('Delete Bill', 'Are you sure you want to delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(editId);
            setModalVisible(false);
          } catch (err) {
            showAlert('Error', 'Failed to delete bill.');
          }
        }
      }
    ]);
  };

  const togglePaidStatus = async (bill) => {
    try {
      await markBillAsPaid(bill.id, !bill.isPaid);
    } catch (error) {
      showAlert('Error', 'Could not update bill status.');
    }
  };

  if (loading) return <Loader visible={true} message="Loading bills..." />;

  const upcomingBills = bills.filter(b => !b.isPaid);
  const paidBills = bills.filter(b => b.isPaid);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bills & Subscriptions</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addBtn}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {bills.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState 
              icon="calendar-outline" 
              title="No Bills Yet" 
              message="Add your recurring bills and subscriptions here."
              buttonText="Add Bill"
              onButtonPress={() => handleOpenModal()}
            />
          </View>
        ) : (
          <>
            {/* Upcoming Bills */}
            {upcomingBills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Bills</Text>
                {upcomingBills.map(b => (
                  <TouchableOpacity key={b.id} style={styles.card} onPress={() => handleOpenModal(b)}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.billName}>{b.billName}</Text>
                      <Text style={styles.billMeta}>
                        Due: {formatDate(b.dueDate)} • {b.repeatType}
                      </Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Text style={styles.amount}>{formatCurrency(b.amount, currency)}</Text>
                      <TouchableOpacity style={styles.payBtn} onPress={() => togglePaidStatus(b)}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={Colors.grayText} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Paid Bills */}
            {paidBills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paid</Text>
                {paidBills.map(b => (
                  <TouchableOpacity key={b.id} style={[styles.card, { opacity: 0.7 }]} onPress={() => handleOpenModal(b)}>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.billName, { textDecorationLine: 'line-through' }]}>{b.billName}</Text>
                      <Text style={styles.billMeta}>Paid • {b.repeatType}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Text style={styles.amount}>{formatCurrency(b.amount, currency)}</Text>
                      <TouchableOpacity style={styles.payBtn} onPress={() => togglePaidStatus(b)}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.green} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Add/Edit Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Bill' : 'New Bill'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <CustomInput
                label="Bill Name"
                value={billName}
                onChangeText={setBillName}
                placeholder="e.g. Netflix, Rent"
              />

              <CustomInput
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                leftIcon="cash-outline"
              />

              <Text style={styles.inputLabel}>Repeat</Text>
              <View style={styles.chipContainer}>
                {['none', 'weekly', 'monthly', 'yearly'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.chip, repeatType === type && styles.chipActive]}
                    onPress={() => setRepeatType(type)}
                  >
                    <Text style={[styles.chipText, repeatType === type && styles.chipTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomButton
                title="Save Bill"
                onPress={handleSaveBill}
                style={{ marginTop: 16 }}
              />

              {isEditing && (
                <CustomButton
                  title="Delete Bill"
                  onPress={handleDeleteBill}
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.darkText, letterSpacing: -0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.darkText, marginBottom: 12 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInfo: { flex: 1 },
  billName: { fontSize: 15, fontWeight: '600', color: Colors.darkText, marginBottom: 4 },
  billMeta: { fontSize: 13, color: Colors.grayText },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amount: { fontSize: 15, fontWeight: '700', color: Colors.darkText },
  payBtn: { padding: 4 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.darkText, marginBottom: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.background },
  chipActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.grayText, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
});

export default BillsScreen;
