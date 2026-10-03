import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, setOnUnauthorizedCallback } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      setUser(null);
      setToken(null);
    });
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    // Rely strictly on backend validation
    const response = await authService.login({ email, password });
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem('auth_token', authToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    return response.data;
  };

  const register = async (name, email, password, passwordConfirmation) => {
    // Rely strictly on backend validation
    const response = await authService.register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem('auth_token', authToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    return response.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout().catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
