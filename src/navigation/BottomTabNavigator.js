// src/navigation/BottomTabNavigator.js
// Bottom tab bar shown to authenticated users.
// Tabs: Dashboard · Transactions · Budget · Analytics · Profile

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import BudgetScreen from '../screens/BudgetScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// ── Tab icon helper ──────────────────────────────────────
const TabIcon = ({ name, color, size, focused, Colors }) => {
  const iconActive = { backgroundColor: Colors.primary + '22', borderRadius: 10 };
  return (
    <View style={[{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, focused && iconActive]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
};

// ── Navigator ────────────────────────────────────────────
const BottomTabNavigator = () => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grayText,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Budget':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return (
            <TabIcon
              name={iconName}
              color={color}
              size={size}
              focused={focused}
              Colors={Colors}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{ tabBarLabel: 'Budget' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analytics' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// ── Styles ───────────────────────────────────────────────
const createStyles = (Colors) => StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.borderColor,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default BottomTabNavigator;
