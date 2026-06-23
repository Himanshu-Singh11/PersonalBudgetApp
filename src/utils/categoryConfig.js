// src/utils/categoryConfig.js
// Maps every expense/income category to an icon and color.
// Used by TransactionItem, CategorySpending, and the Add Transaction form.

export const CATEGORY_CONFIG = {
  // ── Expense categories ───────────────────────────────
  Food: {
    icon: 'fast-food-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    type: 'expense',
  },
  Transport: {
    icon: 'car-outline',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    type: 'expense',
  },
  Shopping: {
    icon: 'bag-handle-outline',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    type: 'expense',
  },
  Entertainment: {
    icon: 'game-controller-outline',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    type: 'expense',
  },
  Health: {
    icon: 'medical-outline',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    type: 'expense',
  },
  Housing: {
    icon: 'home-outline',
    color: '#10B981',
    type: 'expense',
  },
  Rent: {
    icon: 'home-outline',
    color: '#10B981',
    type: 'expense',
  },
  Utilities: {
    icon: 'flash-outline',
    color: '#F59E0B',
    type: 'expense',
  },
  Bills: {
    icon: 'receipt-outline',
    color: '#6366F1',
    type: 'expense',
  },
  Education: {
    icon: 'school-outline',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    type: 'expense',
  },
  Travel: {
    icon: 'airplane-outline',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    type: 'expense',
  },
  Subscriptions: {
    icon: 'repeat-outline',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    type: 'expense',
  },
  Personal: {
    icon: 'person-outline',
    color: '#F97316',
    bgColor: '#FFF7ED',
    type: 'expense',
  },

  // ── Income categories ────────────────────────────────
  Salary: {
    icon: 'briefcase-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },
  Freelance: {
    icon: 'laptop-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },
  Investment: {
    icon: 'trending-up-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },
  Business: {
    icon: 'storefront-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },
  Gift: {
    icon: 'gift-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },
  Bonus: {
    icon: 'star-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },
  Refund: {
    icon: 'return-down-back-outline',
    color: '#10B981',
    bgColor: '#ECFDF5',
    type: 'income',
  },

  // ── Fallback ─────────────────────────────────────────
  Other: {
    icon: 'ellipse-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    type: 'expense',
  },
};

/** Get config for a category, falling back to 'Other', and injecting dynamic transparent background */
export const getCategoryConfig = (category) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other;
  return { ...config, bgColor: config.color + '20' };
};

/** All expense categories as an array */
export const EXPENSE_CATEGORIES = Object.entries(CATEGORY_CONFIG)
  .filter(([, v]) => v.type === 'expense')
  .map(([k]) => k);

/** All income categories as an array */
export const INCOME_CATEGORIES = Object.entries(CATEGORY_CONFIG)
  .filter(([, v]) => v.type === 'income')
  .map(([k]) => k);
