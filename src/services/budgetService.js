// src/services/budgetService.js
// Firestore read/write operations for category-specific budgets.
// Data model:
//   /budgets/{budgetId}
//     userId       : string
//     category     : string
//     limitAmount  : number
//     month        : number (0-11)
//     year         : number
//     createdAt    : Timestamp
//     updatedAt    : Timestamp

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
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const COLLECTION = 'budgets';

/**
 * Adds a new budget.
 */
export const addBudget = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('addBudget error:', error);
    throw error;
  }
};

/**
 * Listens to user budgets for the current month and year in real-time.
 */
export const listenToUserBudgets = (userId, month, year, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const budgets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(budgets);
    },
    (error) => {
      console.error('listenToUserBudgets error:', error);
    }
  );
};

/**
 * Updates an existing budget.
 */
export const updateBudget = async (budgetId, data) => {
  try {
    const ref = doc(db, COLLECTION, budgetId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('updateBudget error:', error);
    throw error;
  }
};

/**
 * Deletes a budget.
 */
export const deleteBudget = async (budgetId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, budgetId));
  } catch (error) {
    console.error('deleteBudget error:', error);
    throw error;
  }
};

/**
 * Calculates budget status based on spent vs limit.
 * @returns {string} 'safe' | 'warning' | 'exceeded'
 */
export const calculateBudgetStatus = (limitAmount, spentAmount) => {
  if (limitAmount <= 0) return 'safe';
  const percentage = (spentAmount / limitAmount) * 100;
  
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 70) return 'warning';
  return 'safe';
};
