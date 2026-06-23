// src/screens/ProfileScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { SUPABASE_PROFILE_BUCKET, uploadFileToSupabase } from '../services/supabaseConfig';
import { sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';

import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import Loader from '../components/Loader';
import { enableAppLock } from '../components/AppLock';
import { useTheme } from '../context/ThemeContext';
import { getFirstName } from '../utils/formatters';

const CURRENCY_OPTIONS = [
  { code: 'INR', label: 'India - INR - ₹' },
  { code: 'USD', label: 'USA - USD - $' },
  { code: 'GBP', label: 'UK - GBP - £' },
  { code: 'EUR', label: 'Europe - EUR - €' },
  { code: 'JPY', label: 'Japan - JPY - ¥' },
  { code: 'CAD', label: 'Canada - CAD - C$' },
  { code: 'AUD', label: 'Australia - AUD - A$' },
];

const ProfileScreen = ({ navigation }) => {
  const { Colors, themeMode, changeTheme } = useTheme();
  const { showAlert } = useAlert();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData, logout } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@app_lock_enabled').then(val => {
      setAppLockEnabled(val === 'true');
    });
  }, []);

  const toggleAppLock = async (value) => {
    if (!value && Platform.OS !== 'web') {
      // User is trying to turn OFF App Lock -> require authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to disable App Lock',
        fallbackLabel: 'Use Passcode',
      });
      
      if (!result.success) {
        // Auth failed or cancelled, revert switch visually by not updating state
        return;
      }
    }
    
    // Auth passed, or user is turning ON the lock (which doesn't strictly need auth, but could if desired)
    setAppLockEnabled(value);
    await enableAppLock(value);
  };

  const isNotificationsEnabled = userData?.notificationsEnabled ?? true;

  const toggleNotifications = async (value) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { notificationsEnabled: value });
    } catch (error) {
      showAlert('Error', 'Failed to update notification settings.');
    }
  };

  // Settings Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length > 0) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri) => {
    setUploadingAvatar(true);
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      
      const fileName = `${currentUser.uid}/${Date.now()}.jpg`;
      
      const publicUrl = await uploadFileToSupabase(SUPABASE_PROFILE_BUCKET, fileName, uri, 'image/jpeg');
        
      if (publicUrl) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { photoURL: publicUrl });
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!displayName.trim()) {
      showAlert('Validation', 'Name cannot be empty.');
      return;
    }
    const budget = monthlyBudget.trim() ? parseFloat(monthlyBudget) : 0;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        monthlyBudget: isNaN(budget) ? 0 : budget,
        phone: phone.trim(),
        occupation: occupation.trim(),
        currency: selectedCurrency,
      });
      setModalVisible(false);
    } catch (error) {
      showAlert('Error', 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrency = async (selectedCode) => {
    setLoading(true);
    setCurrencyModalVisible(false);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { currency: selectedCode });
    } catch (error) {
      showAlert('Error', 'Failed to save currency.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showAlert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (e) {
            showAlert('Error', 'Failed to log out.');
          }
        }
      }
    ]);
  };

  const handleResetPassword = () => {
    showAlert('Reset Password', `Send a reset link to ${currentUser.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Send', 
        onPress: async () => {
          try {
            await sendPasswordResetEmail(auth, currentUser.email);
            showAlert('Success', 'Password reset email sent! Check your inbox.');
          } catch (e) {
            showAlert('Error', 'Failed to send reset email.');
          }
        }
      }
    ]);
  };

  const handleResetSettings = () => {
    showAlert('Reset Settings', 'Are you sure you want to reset all settings to default?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reset', 
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
              monthlyBudget: 0,
              currency: 'INR',
              notificationsEnabled: true,
              profileComplete: false,
            });
            changeTheme('dark');
            showAlert('Success', 'Settings reset to defaults.');
          } catch (e) {
            showAlert('Error', 'Failed to reset settings.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const handleResetAllData = () => {
    showAlert(
      'Reset All App Data',
      'This will delete all your app data such as transactions, bills, and savings. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const uid = currentUser.uid;
              const collectionsToDelete = ['transactions', 'bills', 'savings', 'budgets'];
              
              for (const colName of collectionsToDelete) {
                const q = query(collection(db, colName), where('userId', '==', uid));
                const snapshot = await getDocs(q);
                const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, colName, docSnap.id)));
                await Promise.all(deletePromises);
              }

              const userRef = doc(db, 'users', uid);
              await updateDoc(userRef, {
                monthlyBudget: 0,
                currency: 'INR',
                notificationsEnabled: true,
                profileComplete: false,
              });
              
              changeTheme('dark');
              showAlert('Success', 'All your app data has been permanently deleted.');
            } catch (error) {
              console.error(error);
              showAlert('Error', 'Failed to reset app data.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    showAlert('Delete Account', 'This is irreversible. All your data will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            // Note: In a real app, you also need to delete their Firestore documents.
            // Using a Firebase Cloud Function for cascading deletes is recommended.
            await deleteUser(currentUser);
          } catch (e) {
            if (e.code === 'auth/requires-recent-login') {
              showAlert('Error', 'Please log out and log back in to verify your identity before deleting.');
            } else {
              showAlert('Error', 'Failed to delete account.');
            }
          }
        }
      }
    ]);
  };

  const openSettingsModal = () => {
    setDisplayName(userData?.displayName || '');
    setMonthlyBudget(userData?.monthlyBudget ? userData.monthlyBudget.toString() : '');
    setPhone(userData?.phone || '');
    setOccupation(userData?.occupation || '');
    setSelectedCurrency(userData?.currency || 'INR');
    setShowCurrencyPicker(false);
    setModalVisible(true);
  };

  const openCurrencyModal = () => {
    setCurrencyModalVisible(true);
  };

  const handleThemeChange = () => {
    showAlert('Appearance', 'Choose your preferred theme:', [
      { text: 'System Default', onPress: () => changeTheme('system') },
      { text: 'Light', onPress: () => changeTheme('light') },
      { text: 'Dark', onPress: () => changeTheme('dark') },
    ]);
  };

  if (!userData) return <Loader visible={true} message="Loading profile..." />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getFirstName(userData?.displayName || '?')[0].toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.name}>{userData?.displayName}</Text>
          <Text style={styles.email}>{currentUser?.email}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={openSettingsModal}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Bills')}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.listItemText}>Bills & Subscriptions</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.listItem} onPress={openSettingsModal}>
              <View style={[styles.iconBox, { backgroundColor: Colors.green + '20' }]}>
                <Ionicons name="cash" size={20} color={Colors.green} />
              </View>
              <Text style={styles.listItemText}>Monthly Budget</Text>
              <Text style={styles.listItemValue}>{userData?.monthlyBudget ? `${userData?.currency} ${userData?.monthlyBudget}` : 'Not set'}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.grayText} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('SavingsGoals')}>
              <View style={[styles.iconBox, { backgroundColor: Colors.orange + '20' }]}>
                <Ionicons name="star" size={20} color={Colors.orange} />
              </View>
              <Text style={styles.listItemText}>Savings Goals</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.listItem} onPress={openCurrencyModal}>
              <View style={styles.iconBox}>
                <Ionicons name="globe" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>Currency</Text>
              <Text style={styles.listItemValue}>
                {CURRENCY_OPTIONS.find(c => c.code === userData?.currency)?.label || userData?.currency}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.grayText} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.listItem} onPress={handleThemeChange}>
              <View style={styles.iconBox}>
                <Ionicons name="moon" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>Appearance</Text>
              <Text style={styles.listItemValue}>
                {themeMode === 'system' ? 'System Default' : themeMode === 'dark' ? 'Dark' : 'Light'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.grayText} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Notifications</Text>
          <View style={styles.card}>
            <View style={styles.listItem}>
              <View style={styles.iconBox}>
                <Ionicons name="notifications" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>Notifications</Text>
              <Switch
                value={isNotificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: Colors.borderColor, true: Colors.primary }}
              />
            </View>
            
            <View style={styles.divider} />

            <View style={styles.listItem}>
              <View style={styles.iconBox}>
                <Ionicons name="finger-print" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>App Lock</Text>
              <Switch
                value={appLockEnabled}
                onValueChange={toggleAppLock}
                trackColor={{ false: Colors.borderColor, true: Colors.primary }}
              />
            </View>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.listItem} onPress={handleResetPassword}>
              <View style={styles.iconBox}>
                <Ionicons name="lock-closed" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>Reset Password</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.grayText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data & Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.listItem} onPress={handleResetSettings}>
              <View style={styles.iconBox}>
                <Ionicons name="refresh" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>Reset Settings</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.grayText} />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.listItem} onPress={handleResetAllData}>
              <View style={styles.iconBox}>
                <Ionicons name="warning" size={20} color={Colors.darkText} />
              </View>
              <Text style={styles.listItemText}>Reset All App Data</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.grayText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out & Delete */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.card, styles.listItem, { justifyContent: 'center' }]} onPress={handleLogout}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.primary }}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.listItem, { justifyContent: 'center', marginTop: 16 }]} onPress={handleDeleteAccount}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.red }}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>Cash Flow v1.0.0</Text>
          <View style={styles.footerBuiltBy}>
            <Image source={require('../../assets/hs_logo.png')} style={styles.footerLogo} resizeMode="contain" />
            <Text style={styles.footerBuiltByText}>Built by Himanshu Singh</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.darkText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── Avatar ── */}
              <View style={styles.modalAvatarContainer}>
                <TouchableOpacity style={styles.modalAvatarBox} onPress={handlePickImage} disabled={uploadingAvatar}>
                  {userData?.photoURL ? (
                    <Image source={{ uri: userData.photoURL }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{getFirstName(userData?.displayName || '?')[0].toUpperCase()}</Text>
                  )}
                  {uploadingAvatar ? (
                    <View style={styles.modalAvatarOverlay}><ActivityIndicator color={Colors.white} /></View>
                  ) : (
                    <View style={styles.modalAvatarCamera}>
                      <Ionicons name="camera" size={16} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={styles.modalAvatarHint}>Tap to change photo</Text>
              </View>

              <CustomInput label="Full Name" value={displayName} onChangeText={setDisplayName} leftIcon="person-outline" />

              {/* Email — locked field */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.darkText, marginBottom: 8, letterSpacing: 0.1 }}>Email</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.borderColor, borderRadius: 14, paddingHorizontal: 14, height: 56, opacity: 0.7 }}>
                  <Ionicons name="mail-outline" size={18} color={Colors.grayText} style={{ marginRight: 10 }} />
                  <Text style={{ flex: 1, fontSize: 15, color: Colors.grayText }}>{currentUser?.email}</Text>
                  <TouchableOpacity onPress={() => showAlert('Email Locked', 'Your email address cannot be changed as it is linked to your account.')}>
                    <Ionicons name="lock-closed" size={16} color={Colors.grayText} />
                  </TouchableOpacity>
                </View>
              </View>
              <CustomInput label="Phone Number" value={phone} onChangeText={setPhone} leftIcon="call-outline" placeholder="e.g. +91 XXXXX XXXXX" keyboardType="phone-pad" />
              <CustomInput label="Occupation" value={occupation} onChangeText={setOccupation} leftIcon="briefcase-outline" placeholder="e.g. Student / Developer" />
              <CustomInput label="Monthly Budget" value={monthlyBudget} onChangeText={setMonthlyBudget} keyboardType="numeric" leftIcon="wallet-outline" placeholder="e.g. 50000" />

              {/* Currency — inline picker */}
              <Text style={styles.inputLabel}>Currency</Text>
              <TouchableOpacity
                style={[styles.currencySelector, showCurrencyPicker && { borderColor: Colors.primary }]}
                onPress={() => setShowCurrencyPicker(p => !p)}
              >
                <Ionicons name="globe-outline" size={18} color={Colors.grayText} />
                <Text style={styles.currencySelectorText}>
                  {CURRENCY_OPTIONS.find(c => c.code === selectedCurrency)?.label || 'Select currency'}
                </Text>
                <Ionicons name={showCurrencyPicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.grayText} />
              </TouchableOpacity>

              {showCurrencyPicker && (
                <View style={styles.currencyDropdown}>
                  {CURRENCY_OPTIONS.map((curr, index) => (
                    <TouchableOpacity
                      key={curr.code}
                      style={[
                        styles.currencyDropdownItem,
                        selectedCurrency === curr.code && { backgroundColor: Colors.primary + '15' },
                        index === CURRENCY_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => { setSelectedCurrency(curr.code); setShowCurrencyPicker(false); }}
                    >
                      <Text style={[styles.currencyDropdownText, selectedCurrency === curr.code && { color: Colors.primary, fontWeight: '700' }]}>
                        {curr.label}
                      </Text>
                      {selectedCurrency === curr.code && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <CustomButton title="Save Changes" onPress={handleSaveSettings} style={{ marginTop: 24, marginBottom: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Currency Modal ── */}
      <Modal visible={currencyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.darkText} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCY_OPTIONS.map(curr => (
                <TouchableOpacity 
                  key={curr.code}
                  style={[styles.currencyListItem, userData?.currency === curr.code && styles.currencyListItemActive]}
                  onPress={() => handleSaveCurrency(curr.code)}
                >
                  <Text style={[styles.currencyListText, userData?.currency === curr.code && styles.currencyListTextActive]}>{curr.label}</Text>
                  {userData?.currency === curr.code && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Loader visible={loading} message="Saving..." />
    </SafeAreaView>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 40 },
  
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  name: { fontSize: 24, fontWeight: '800', color: Colors.darkText, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.grayText, marginBottom: 16 },
  editProfileBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  editProfileText: { fontSize: 13, fontWeight: '600', color: Colors.darkText },
  
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.grayText, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.darkText },
  listItemValue: { fontSize: 15, fontWeight: '600', color: Colors.grayText },
  divider: { height: 1, backgroundColor: Colors.borderColor, marginLeft: 64 },
  
  versionText: { textAlign: 'center', fontSize: 12, color: Colors.grayText, fontWeight: '500', marginBottom: 6 },
  footer: { alignItems: 'center', marginTop: 32, marginBottom: 8 },
  footerBuiltBy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerLogo: { width: 22, height: 22, opacity: 0.85, borderRadius: 4 },
  footerBuiltByText: { fontSize: 11, color: Colors.darkText, fontWeight: '500', opacity: 0.85 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  
  modalAvatarContainer: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  modalAvatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  modalAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarCamera: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarHint: { fontSize: 12, color: Colors.grayText, fontWeight: '500' },
  
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.darkText, marginBottom: 8, marginTop: 12 },
  currencySelector: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, height: 50, borderWidth: 1.5, borderColor: Colors.borderColor, marginBottom: 4 },
  currencySelectorText: { flex: 1, fontSize: 15, color: Colors.darkText, fontWeight: '500' },
  currencyDropdown: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderColor, overflow: 'hidden', marginBottom: 8 },
  currencyDropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  currencyDropdownText: { fontSize: 15, color: Colors.darkText, fontWeight: '500' },
  
  currencyListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  currencyListItemActive: { backgroundColor: Colors.primary + '10', borderRadius: 12, paddingHorizontal: 12, borderBottomWidth: 0, marginVertical: 4 },
  currencyListText: { fontSize: 15, color: Colors.darkText, fontWeight: '500' },
  currencyListTextActive: { color: Colors.primary, fontWeight: '700' },

  // New professional modal field styles
  modalSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.grayText, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 4 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderColor, overflow: 'hidden' },
  modalField: { paddingHorizontal: 16, paddingVertical: 12 },
  modalFieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.grayText, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center' },
  modalTextInput: { flex: 1, fontSize: 15, color: Colors.darkText, fontWeight: '500' },
  modalFieldDivider: { height: 1, backgroundColor: Colors.borderColor, marginLeft: 16 },
  readOnlyBadge: { backgroundColor: Colors.background, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  readOnlyText: { fontSize: 11, color: Colors.grayText, fontWeight: '600' },
  inlineCurrencyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  inlineCurrencyText: { fontSize: 14, color: Colors.darkText, fontWeight: '500' },

  // ── Edit Profile (Full Screen) styles ──
  epHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  epHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  epHeaderTitle: { fontSize: 17, fontWeight: '700', color: Colors.darkText },
  epSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primary, borderRadius: 20 },
  epSaveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  epScrollContent: { paddingBottom: 60 },
  epAvatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  epAvatarWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  epAvatarName: { fontSize: 20, fontWeight: '700', color: Colors.darkText, marginBottom: 4 },
  epAvatarEmail: { fontSize: 13, color: Colors.grayText },
  epSectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.grayText, letterSpacing: 0.8, marginTop: 28, marginBottom: 8, marginHorizontal: 20 },
  epCard: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderColor, overflow: 'hidden' },
  epRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  epRowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  epRowContent: { flex: 1 },
  epRowLabel: { fontSize: 12, fontWeight: '600', color: Colors.grayText, marginBottom: 3 },
  epRowInput: { fontSize: 15, color: Colors.darkText, fontWeight: '500' },
  epDivider: { height: 1, backgroundColor: Colors.borderColor, marginLeft: 64 },
  epReadBadge: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  epReadBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.grayText },
  epCurrencyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderColor },
  epCurrencyText: { fontSize: 15, color: Colors.darkText, fontWeight: '500' },
});

export default ProfileScreen;
