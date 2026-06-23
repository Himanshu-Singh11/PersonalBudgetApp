// src/services/exportService.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { formatCurrency, formatDate } from '../utils/formatters';

export const exportTransactionsCSV = async (transactions) => {
  if (!transactions || transactions.length === 0) return;

  const header = 'Date,Type,Category,Description,Payment Method,Amount\n';
  const rows = transactions.map(t => {
    return `${formatDate(t.date)},${t.type},${t.category},"${t.description || ''}",${t.paymentMethod},${t.amount}`;
  }).join('\n');

  const csvString = header + rows;
  const fileUri = FileSystem.documentDirectory + 'transactions_export.csv';

  try {
    await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  } catch (error) {
    console.error('CSV Export Error:', error);
    throw error;
  }
};

export const exportTransactionsPDF = async (transactions, monthLabel, currency = 'INR') => {
  if (!transactions || transactions.length === 0) return;

  const rowsHtml = transactions.map(t => `
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

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
};

export const previewTransactionsPDF = async (transactions, monthLabel, currency = 'INR') => {
  if (!transactions || transactions.length === 0) return;

  const rowsHtml = transactions.map(t => `
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

  try {
    const { uri } = await Print.printToFileAsync({ html });
    // Try opening the local file URI natively
    const Linking = require('react-native').Linking;
    const canOpen = await Linking.canOpenURL(uri);
    if (canOpen) {
      await Linking.openURL(uri);
    } else {
      // Fallback if Linking cannot open local files on this device
      const Sharing = require('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
      }
    }
  } catch (error) {
    console.error('PDF Preview Error:', error);
    throw error;
  }
};
