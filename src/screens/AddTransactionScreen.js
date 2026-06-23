// src/screens/AddTransactionScreen.js
// Modal screen to add a new income or expense.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { addTransaction, updateTransaction } from '../services/transactionService';
import { validateTransaction } from '../utils/validation';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, PAYMENT_METHODS } from '../utils/categories';

import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { SUPABASE_BILLS_BUCKET, uploadFileToSupabase } from '../services/supabaseConfig';
import { sendBudgetWarning } from '../services/NotificationService';

const AddTransactionScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser } = useAuth();

  // Form State
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUri, setReceiptUri] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  // Handlers
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(''); // reset category on type change
    setErrors((prev) => ({ ...prev, type: null, category: null }));
  };

  const handleSave = async () => {
    const data = {
      type,
      amount,
      category,
      paymentMethod,
    };

    const validationErrors = validateTransaction(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const transactionId = await addTransaction({
        userId: currentUser.uid,
        type,
        amount: parseFloat(amount),
        category,
        paymentMethod,
        description: description.trim(),
        date: Timestamp.now(),
        attachmentURL: null,
      });

      if (receiptUri) {
        try {
          const response = await fetch(receiptUri);
          const arrayBuffer = await response.arrayBuffer();
          const extension = receiptUri.split('.').pop() || 'jpg';
          const fileName = `${currentUser.uid}/${transactionId}/${Date.now()}.${extension}`;
          const mimeType = `image/${extension === 'png' ? 'png' : 'jpeg'}`;
          
          const publicUrl = await uploadFileToSupabase(SUPABASE_BILLS_BUCKET, fileName, receiptUri, mimeType);
          
          if (publicUrl) {
            await updateTransaction(transactionId, { attachmentURL: publicUrl });
          }
        } catch (uploadError) {
          console.error('Attachment upload failed:', uploadError);
          // Alert user but don't fail the transaction saving
          showAlert('Warning', 'Transaction saved, but receipt upload failed.');
        }
      }

      if (type === 'expense' && parseFloat(amount) >= (currentUser?.monthlyBudget || 1000)) {
         await sendBudgetWarning(category);
      }

      showAlert('Success', 'Transaction saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loader visible={loading} message="Saving transaction..." />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={styles.placeholderSpace} />
        </View>

        <KeyboardAvoidingView 
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* ── Type Selector ── */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
                onPress={() => handleTypeChange('expense')}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
                onPress={() => handleTypeChange('income')}
              >
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>
            {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

            {/* ── Amount ── */}
            <CustomInput
              label="Amount"
              value={amount}
              onChangeText={(val) => { setAmount(val); setErrors(prev => ({...prev, amount: null}))}}
              placeholder="0.00"
              keyboardType="numeric"
              leftIcon="cash-outline"
              error={errors.amount}
            />

            {/* ── Category ── */}
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chipContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => { setCategory(cat); setErrors(prev => ({...prev, category: null}))}}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

            {/* ── Payment Method ── */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Payment Method</Text>
            <View style={styles.chipContainer}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.chip, paymentMethod === method && styles.chipActive]}
                  onPress={() => { setPaymentMethod(method); setErrors(prev => ({...prev, paymentMethod: null}))}}
                >
                  <Text style={[styles.chipText, paymentMethod === method && styles.chipTextActive]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.paymentMethod && <Text style={styles.errorText}>{errors.paymentMethod}</Text>}

            {/* ── Description ── */}
            <View style={{ marginTop: 16 }}>
              <CustomInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                leftIcon="document-text-outline"
              />
            </View>

            {/* ── Receipt Upload ── */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionLabel}>Receipt Image (Optional)</Text>
              {receiptUri ? (
                <View style={{ position: 'relative', width: 100, height: 100 }}>
                  <Image source={{ uri: receiptUri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                  <TouchableOpacity 
                    style={{ position: 'absolute', top: -10, right: -10, backgroundColor: Colors.white, borderRadius: 15 }} 
                    onPress={() => setReceiptUri(null)}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.chip, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }]} onPress={async () => {
                  let result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 0.5,
                  });
                  if (!result.canceled) {
                    setReceiptUri(result.assets[0].uri);
                  }
                }}>
                  <Ionicons name="camera-outline" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, color: Colors.primary, fontWeight: '600' }}>Attach Receipt</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Save Button ── */}
            <CustomButton
              title="Save Transaction"
              onPress={handleSave}
              style={styles.saveBtn}
            />

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkText,
  },
  placeholderSpace: {
    width: 32,
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeBtnExpense: {
    backgroundColor: Colors.red,
  },
  typeBtnIncome: {
    backgroundColor: Colors.green,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.grayText,
  },
  typeTextActive: {
    color: Colors.white,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
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
  errorText: {
    color: Colors.red,
    fontSize: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  saveBtn: {
    marginTop: 32,
  },
});

export default AddTransactionScreen;
