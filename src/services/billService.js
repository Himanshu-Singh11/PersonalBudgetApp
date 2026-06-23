// src/services/billService.js
// Firestore read/write operations for recurring and one-time bills.
// Data model:
//   /bills/{billId}
//     userId          : string
//     billName        : string
//     amount          : number
//     dueDate         : Timestamp
//     isPaid          : boolean
//     repeatType      : 'none' | 'weekly' | 'monthly' | 'yearly'
//     reminderEnabled : boolean
//     createdAt       : Timestamp
//     updatedAt       : Timestamp

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

const COLLECTION = 'bills';

export const addBill = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      ...data,
      isPaid: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('addBill error:', error);
    throw error;
  }
};

export const listenToUserBills = (userId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const bills = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort client-side (ascending by dueDate)
      bills.sort((a, b) => {
        const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || 0);
        const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || 0);
        return dateA - dateB;
      });
      
      callback(bills);
    },
    (error) => {
      console.error('listenToUserBills error:', error);
    }
  );
};

export const updateBill = async (billId, data) => {
  try {
    const ref = doc(db, COLLECTION, billId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('updateBill error:', error);
    throw error;
  }
};

export const deleteBill = async (billId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, billId));
  } catch (error) {
    console.error('deleteBill error:', error);
    throw error;
  }
};

export const markBillAsPaid = async (billId, isPaid = true) => {
  try {
    const ref = doc(db, COLLECTION, billId);
    await updateDoc(ref, {
      isPaid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('markBillAsPaid error:', error);
    throw error;
  }
};
