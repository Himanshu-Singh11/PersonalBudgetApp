// src/utils/formatters.js

export const formatCurrency = (amount, currencyCode = 'INR') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }
  const num = parseFloat(amount);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (timestamp, style = 'short') => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (style === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const getFirstName = (fullName) => {
  if (!fullName) return 'User';
  return fullName.split(' ')[0];
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 23) return 'Good Evening';
  return 'Good Night';
};

export const currentMonthLabel = () => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
