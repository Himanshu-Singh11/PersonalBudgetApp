// src/navigation/AppNavigator.js
// Root navigator — decides which flow to show based on auth state.
// Logged in  → MainStack (Bottom Tabs + Modals)
// Logged out → AuthNavigator (onboarding / login / signup)

import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BillsScreen from '../screens/BillsScreen';
import SavingsGoalsScreen from '../screens/SavingsGoalsScreen';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="Bills" component={BillsScreen} />
      <Stack.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen} 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return currentUser ? <MainStack /> : <AuthNavigator />;
};

const createStyles = (Colors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;
