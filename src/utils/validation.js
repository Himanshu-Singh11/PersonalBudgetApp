// src/utils/validation.js
// Common validation helpers.

export const validateTransaction = (data) => {
  const errors = {};
  
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!data.category) {
    errors.category = 'Please select a category';
  }

  if (!data.type) {
    errors.type = 'Please select transaction type';
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = 'Please select a payment method';
  }

  return errors;
};
