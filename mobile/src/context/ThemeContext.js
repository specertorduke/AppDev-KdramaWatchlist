import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, warmColors } from '../theme';

const THEME_STORAGE_KEY = '@sarangtv_theme';

const ThemeContext = createContext({
  theme: 'dark', // 'dark', 'light', 'warm'
  isDark: true,
  colors: darkColors,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'warm') {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.warn('Failed to load theme from storage:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light' && newTheme !== 'warm') return;
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Failed to save theme to storage:', e);
    }
  };

  const isDark = theme === 'dark';
  let currentColors = darkColors;
  if (theme === 'light') currentColors = lightColors;
  if (theme === 'warm') currentColors = warmColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: currentColors,
        setTheme,
        isLoaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
