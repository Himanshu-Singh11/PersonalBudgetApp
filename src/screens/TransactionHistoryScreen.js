// src/screens/TransactionHistoryScreen.js
// Shows a list of all transactions with search, filter (All/Income/Expense),
// swipe to delete / edit options, and a floating add button.

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import {
  listenToUserTransactions,
  deleteTransaction,
} from '../services/transactionService';
import { exportTransactionsPDF } from '../services/exportService';
import { formatCurrency, formatDate } from '../utils/formatters';

import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';

const TransactionHistoryScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, userData } = useAuth();
  const currency = userData?.currency || 'INR';
  
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All' | 'income' | 'expense'

  // PDF Preview State
  const [previewUri, setPreviewUri] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = listenToUserTransactions(
      currentUser.uid,
      (data) => {
        setAllTransactions(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching history:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    applyFilters(searchQuery, filterType);
  }, [allTransactions, searchQuery, filterType]);

  const applyFilters = (query, type) => {
    let result = allTransactions;

    if (type !== 'All') {
      result = result.filter(t => t.type === type);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t => 
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }

    setFilteredTransactions(result);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Realtime listener handles updates, so we just simulate delay
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleDelete = (id) => {
    showAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
            } catch (err) {
              showAlert('Error', 'Failed to delete transaction.');
            }
          }
        }
      ]
    );
  };

  const handlePreviewPDF = async () => {
    try {
      if (!allTransactions || allTransactions.length === 0) return;
      const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const rowsHtml = allTransactions.map(t => `
        <tr>
          <td>${formatDate(t.date)}</td>
          <td style="color: ${t.type === 'income' ? 'green' : 'red'};">${t.type}</td>
          <td>${t.category}</td>
          <td>${t.description || ''}</td>
          <td>${formatCurrency(t.amount, currency)}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #2563EB; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #F3F4F6; }
            </style>
          </head>
          <body>
            <h1>Personal Budget Report</h1>
            <h3>Month: ${monthLabel}</h3>
            <table>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
              ${rowsHtml}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setPreviewUri(uri);
    } catch (e) {
      showAlert('Preview Failed', 'Could not preview PDF.');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportTransactionsPDF(
        allTransactions, 
        new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), 
        currency
      );
    } catch (e) {
      showAlert('Export Failed', 'Could not export PDF.');
    }
  };

  const handleTransactionPress = (transaction) => {
    // Show quick actions or navigate to details
    showAlert(
      'Transaction Actions',
      'Choose what you want to do:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDelete(transaction.id)
        }
      ]
    );
  };

  if (loading) {
    return <Loader visible={true} message="Loading history..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handlePreviewPDF} style={styles.actionBtn}>
            <Ionicons name="document-text" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportPDF} style={styles.actionBtn}>
            <Ionicons name="download" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search & Filter ── */}
      <View style={styles.toolsContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={Colors.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.filterRow}>
          {['All', 'income', 'expense'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterBtn,
                filterType === type && styles.filterBtnActive
              ]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[
                styles.filterText,
                filterType === type && styles.filterTextActive
              ]}>
                {type === 'All' ? 'All' : type === 'income' ? 'Income' : 'Expense'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── List ── */}
      {filteredTransactions.length > 0 ? (
        <FlatList
          style={{ marginBottom: 90, marginHorizontal: 20 }}
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item }) => (
            <TransactionItem 
              transaction={item} 
              currency={currency}
              onPress={() => handleTransactionPress(item)} 
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="receipt-outline"
            title="No Transactions Found"
            message="Try adjusting your search or filters, or add a new transaction."
          />
        </View>
      )}

      {/* ── Floating Action Button ── */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* ── PDF Preview Modal ── */}
      <Modal visible={!!previewUri} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPreviewUri(null)}>
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderColor: Colors.borderColor }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.darkText }}>PDF Preview</Text>
            <TouchableOpacity onPress={() => setPreviewUri(null)} style={{ padding: 5 }}>
              <Ionicons name="close" size={24} color={Colors.darkText} />
            </TouchableOpacity>
          </View>
          {previewUri && (
            <WebView 
              source={{ uri: previewUri }} 
              style={{ flex: 1 }} 
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowFileAccessFromFileURLs={true}
            />
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  toolsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: Colors.darkText,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayText,
  },
  filterTextActive: {
    color: Colors.white,
  },
  listContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
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
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default TransactionHistoryScreen;
