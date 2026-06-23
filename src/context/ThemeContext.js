import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { ThemeColors } from '../styles/colors';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      const colorScheme = Appearance.getColorScheme();
      setIsDarkMode(colorScheme === 'dark');
      
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        if (themeMode === 'system') {
          setIsDarkMode(colorScheme === 'dark');
        }
      });
      return () => subscription.remove();
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('@theme_mode');
      if (storedTheme) {
        setThemeMode(storedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme', e);
    }
  };

  const changeTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('@theme_mode', mode);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const Colors = isDarkMode ? ThemeColors.dark : ThemeColors.light;

  return (
    <ThemeContext.Provider value={{ themeMode, changeTheme, isDarkMode, Colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
