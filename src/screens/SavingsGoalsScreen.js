// src/screens/SavingsGoalsScreen.js
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

import {
  listenToSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '../services/savingsService';

import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';

const SavingsGoalsScreen = () => {
  const { showAlert } = useAlert();
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData } = useAuth();
  const currency = userData?.currency || 'INR';
  
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = listenToSavingsGoals(currentUser.uid, (data) => {
      setGoals(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleOpenModal = (goalToEdit = null) => {
    if (goalToEdit) {
      setIsEditing(true);
      setEditId(goalToEdit.id);
      setGoalName(goalToEdit.goalName);
      setTargetAmount(goalToEdit.targetAmount.toString());
      setSavedAmount(goalToEdit.savedAmount.toString());
    } else {
      setIsEditing(false);
      setEditId(null);
      setGoalName('');
      setTargetAmount('');
      setSavedAmount('');
    }
    setModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      showAlert('Validation', 'Please enter a goal name.');
      return;
    }
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      showAlert('Validation', 'Please enter a valid target amount.');
      return;
    }
    const saved = savedAmount ? parseFloat(savedAmount) : 0;

    try {
      const payload = {
        goalName: goalName.trim(),
        targetAmount: target,
        savedAmount: saved,
      };

      if (isEditing) {
        await updateSavingsGoal(editId, payload);
      } else {
        await addSavingsGoal(currentUser.uid, payload);
      }
      setModalVisible(false);
    } catch (err) {
      showAlert('Error', 'Failed to save savings goal.');
    }
  };

  const handleDeleteGoal = () => {
    showAlert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavingsGoal(editId);
            setModalVisible(false);
          } catch (err) {
            showAlert('Error', 'Failed to delete goal.');
          }
        }
      }
    ]);
  };

  if (loading) return <Loader visible={true} message="Loading goals..." />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addBtn}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState 
              icon="wallet-outline" 
              title="No Goals Yet" 
              message="Create a savings goal for your next big purchase."
              buttonText="Create Goal"
              onButtonPress={() => handleOpenModal()}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {goals.map(g => (
              <TouchableOpacity key={g.id} style={styles.card} onPress={() => handleOpenModal(g)}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="star" size={20} color={Colors.orange} />
                  </View>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.goalName}>{g.goalName}</Text>
                    <Text style={styles.percentText}>{g.progressPercentage}%</Text>
                  </View>
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${g.progressPercentage}%` }]} />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.amountText}>{formatCurrency(g.savedAmount, currency)} saved</Text>
                  <Text style={styles.targetText}>Target: {formatCurrency(g.targetAmount, currency)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Add/Edit Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Goal' : 'New Goal'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <CustomInput
                label="Goal Name"
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g. New Laptop, Vacation"
              />

              <CustomInput
                label="Target Amount"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
                placeholder="0.00"
                leftIcon="cash-outline"
              />

              <CustomInput
                label="Currently Saved"
                value={savedAmount}
                onChangeText={setSavedAmount}
                keyboardType="numeric"
                placeholder="0.00"
                leftIcon="wallet-outline"
              />

              <CustomButton
                title="Save Goal"
                onPress={handleSaveGoal}
                style={{ marginTop: 16 }}
              />

              {isEditing && (
                <CustomButton
                  title="Delete Goal"
                  onPress={handleDeleteGoal}
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
  scrollContent: { paddingBottom: 40 },
  list: { paddingHorizontal: 20, marginTop: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBox: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 16, fontWeight: '700', color: Colors.darkText },
  percentText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  track: { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  amountText: { fontSize: 13, fontWeight: '600', color: Colors.darkText },
  targetText: { fontSize: 13, color: Colors.grayText, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
});

export default SavingsGoalsScreen;
