// src/services/NotificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }
  
  return finalStatus === 'granted';
};

export const scheduleBillReminder = async (billName, dueDate) => {
  const trigger = new Date(dueDate);
  trigger.setDate(trigger.getDate() - 1); // 1 day before

  if (trigger <= new Date()) return; // Already passed

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bill Reminder 📅',
      body: `Your bill for ${billName} is due tomorrow!`,
    },
    trigger,
  });
};

export const sendBudgetWarning = async (category) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Budget Alert ⚠️',
      body: `You are nearing or have exceeded your budget for ${category}. Check your app.`,
    },
    trigger: null, // Send immediately
  });
};
