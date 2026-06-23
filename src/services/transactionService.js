// src/services/transactionService.js
// Enhanced with AsyncStorage caching for offline support.

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLECTION = 'transactions';
const CACHE_KEY = '@cached_transactions_';

export const addTransaction = async (data) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('addTransaction error:', error);
    throw error;
  }
};

export const listenToUserTransactions = (userId, callback, errorCallback) => {
  // 1. Immediately load and callback cached data for fast offline support
  AsyncStorage.getItem(CACHE_KEY + userId).then((cached) => {
    if (cached) {
      callback(JSON.parse(cached));
    }
  });

  // 2. Set up live listener
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const txs = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          // Convert Timestamp to iso string for caching
          date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });
      
      // Sort client-side (descending by date)
      txs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Update cache
      AsyncStorage.setItem(CACHE_KEY + userId, JSON.stringify(txs)).catch(console.error);
      
      // Callback fresh data
      callback(txs);
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    }
  );
};

export const updateTransaction = async (transactionId, data) => {
  try {
    const ref = doc(db, COLLECTION, transactionId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('updateTransaction error:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, transactionId));
  } catch (error) {
    console.error('deleteTransaction error:', error);
    throw error;
  }
};

// ... Utility pure functions (filterCurrentMonth, calcTotalIncome, etc) remain below ...
export const filterCurrentMonth = (transactions) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
};

export const calcTotalIncome = (transactions) => {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export const calcTotalExpense = (transactions) => {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export const calcCategorySpending = (transactions, topN = 4) => {
  const map = {};
  let totalExpense = 0;

  transactions.forEach((t) => {
    if (t.type === 'expense') {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + (t.amount || 0);
      totalExpense += (t.amount || 0);
    }
  });

  const sorted = Object.keys(map).map((cat) => ({
    category: cat,
    amount: map[cat],
    percentage: totalExpense > 0 ? Math.round((map[cat] / totalExpense) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  return sorted.slice(0, topN);
};

export const getCurrentMonthTransactions = async (userId) => {
  // Convenience method for single fetches
  return new Promise((resolve) => {
    AsyncStorage.getItem(CACHE_KEY + userId).then((cached) => {
      const data = cached ? JSON.parse(cached) : [];
      resolve(filterCurrentMonth(data));
    });
  });
};
