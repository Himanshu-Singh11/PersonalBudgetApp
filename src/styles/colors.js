// src/styles/colors.js

const sharedColors = {
  primary: '#2563EB',         // Main blue
  primaryLight: '#3B82F6',    
  primaryDark: '#1D4ED8',     
  green: '#10B981',           // Income
  red: '#EF4444',             // Expenses
  orange: '#F59E0B',          // Warnings
  purple: '#8B5CF6',
  indigo: '#6366F1',
  pink: '#EC4899',
  teal: '#14B8A6',
};

const ThemeColors = {
  light: {
    ...sharedColors,
    background: '#F3F4F6',
    cardBackground: '#FFFFFF',
    white: '#FFFFFF',
    darkText: '#111827',
    grayText: '#6B7280',
    lightText: '#9CA3AF',
    borderColor: '#E5E7EB',
  },
  dark: {
    ...sharedColors,
    background: '#111827',
    cardBackground: '#1F2937',
    white: '#1F2937',         // Treating "white" backgrounds as dark-gray in dark mode
    darkText: '#F9FAFB',      // Inverse text
    grayText: '#9CA3AF',
    lightText: '#6B7280',
    borderColor: '#374151',
  }
};

// Default export uses light mode for backwards compatibility
export default ThemeColors.light;
export { ThemeColors };
