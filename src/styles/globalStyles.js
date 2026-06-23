// src/styles/globalStyles.js
// Shared, reusable StyleSheet definitions

import { StyleSheet, Platform } from 'react-native';
import Colors from './colors';

const GlobalStyles = StyleSheet.create({
  // ── Containers ──────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // ── Cards ───────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardSmall: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ── Typography ──────────────────────────────────────────
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkText,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkText,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.darkText,
    lineHeight: 22,
  },
  bodyTextGray: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.grayText,
    lineHeight: 20,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.grayText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Buttons ─────────────────────────────────────────────
  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: Colors.red,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Form Inputs ─────────────────────────────────────────
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.grayText,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.darkText,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.red,
  },

  // ── Utility ─────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: 16,
  },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
});

export default GlobalStyles;
