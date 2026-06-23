// src/components/SummaryCard.js
// Shows top 4 expense categories in a neat list.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryConfig } from '../utils/categoryConfig';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const SummaryCard = ({ categoryData = [], currency = 'USD' }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  if (!categoryData || categoryData.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Top Categories</Text>
      
      <View style={styles.list}>
        {categoryData.map((item, index) => {
          const config = getCategoryConfig(item.category);
          
          return (
            <View key={index} style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
                <Ionicons name={config.icon} size={18} color={config.color} />
              </View>
              
              <View style={styles.info}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <View style={styles.barBg}>
                  <View 
                    style={[
                      styles.barFill, 
                      { width: `${item.percentage}%`, backgroundColor: config.color }
                    ]} 
                  />
                </View>
              </View>
              
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(item.amount, currency)}</Text>
                <Text style={styles.percentage}>{item.percentage}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 6,
  },
  barBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkText,
  },
  percentage: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 2,
  },
});

export default SummaryCard;
