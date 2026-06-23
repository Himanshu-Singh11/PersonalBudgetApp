// src/services/savingsService.js
// Firestore read/write operations for savings goals.
// Data model:
//   /savings/{goalId}
//     userId             : string
//     goalName           : string
//     targetAmount       : number
//     savedAmount        : number
//     deadline           : Timestamp
//     progressPercentage : number (calculated before save or on client)
//     createdAt          : Timestamp
//     updatedAt          : Timestamp

import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from './firebaseConfig';

const COLLECTION = 'savings';

export const calculateProgress = (savedAmount, targetAmount) => {
  if (targetAmount <= 0) return 0;
  const progress = (savedAmount / targetAmount) * 100;
  return Math.min(Math.round(progress), 100);
};

export const addSavingsGoal = async (userId, data) => {
  try {
    const progressPercentage = calculateProgress(data.savedAmount || 0, data.targetAmount);
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      ...data,
      savedAmount: data.savedAmount || 0,
      progressPercentage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('addSavingsGoal error:', error);
    throw error;
  }
};

export const listenToSavingsGoals = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const goals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort client-side (descending by createdAt)
      goals.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      callback(goals);
    },
    (error) => {
      console.error('listenToSavingsGoals error:', error);
    }
  );
};

export const updateSavingsGoal = async (goalId, data) => {
  try {
    const ref = doc(db, COLLECTION, goalId);
    let updateData = { ...data, updatedAt: serverTimestamp() };
    
    // Recalculate progress if amounts are being updated
    if (data.targetAmount !== undefined || data.savedAmount !== undefined) {
      // In a real app, you might want to fetch the current doc first or require both, 
      // but assuming the client passes both for simplicity:
      if (data.targetAmount && data.savedAmount !== undefined) {
        updateData.progressPercentage = calculateProgress(data.savedAmount, data.targetAmount);
      }
    }

    await updateDoc(ref, updateData);
  } catch (error) {
    console.error('updateSavingsGoal error:', error);
    throw error;
  }
};

export const deleteSavingsGoal = async (goalId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, goalId));
  } catch (error) {
    console.error('deleteSavingsGoal error:', error);
    throw error;
  }
};
