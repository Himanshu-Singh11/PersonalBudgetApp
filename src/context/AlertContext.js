// src/context/AlertContext.js
import React, { createContext, useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from './ThemeContext';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

export const AlertProvider = ({ children }) => {
  const { Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const handleButtonPress = (btn) => {
    if (btn.onPress) {
      // Small delay to allow modal to start closing visually before heavy work, or vice versa
      btn.onPress();
    }
    // Only hide if the button doesn't specify otherwise, but typically alert buttons close the alert
    hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={alertConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <TouchableWithoutFeedback onPress={hideAlert}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.alertBox}>
                <Text style={styles.title}>{alertConfig.title}</Text>
                {!!alertConfig.message && <Text style={styles.message}>{alertConfig.message}</Text>}
                
                <View style={styles.buttonContainer}>
                  {alertConfig.buttons.map((btn, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.button,
                        alertConfig.buttons.length > 1 ? { flex: 1 } : { width: '100%' },
                        idx === 0 && alertConfig.buttons.length === 2 ? { borderRightWidth: StyleSheet.hairlineWidth, borderColor: Colors.borderColor } : null
                      ]}
                      onPress={() => handleButtonPress(btn)}
                    >
                      <Text style={[
                        styles.buttonText,
                        btn.style === 'destructive' ? styles.btnTextDestructive : styles.btnTextDefault,
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    width: '75%',
    paddingTop: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 13,
    color: Colors.grayText,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderColor,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
  btnTextDefault: {
    color: Colors.primary,
    fontWeight: '400',
  },
  btnTextDestructive: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
