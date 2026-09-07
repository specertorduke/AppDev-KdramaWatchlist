import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, setOnUnauthorizedCallback } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isChoosingAccount, setIsChoosingAccount] = useState(false);

  useEffect(() => {
    setOnUnauthorizedCallback(async () => {
      setUser(null);
      setToken(null);
      const stored = await AsyncStorage.getItem('saved_accounts');
      const accounts = stored ? JSON.parse(stored) : [];
      if (accounts.length > 0) {
        setIsChoosingAccount(true);
      }
    });
    loadStoredAuth();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getPaletteColor = (index) => {
    const palette = ['#6B2638', '#29234D', '#19313B', '#3A315A', '#2D4B3E', '#5C2D43'];
    return palette[index % palette.length];
  };

  const updateSavedAccountsList = async (userData, authToken) => {
    try {
      const stored = await AsyncStorage.getItem('saved_accounts');
      let accounts = stored ? JSON.parse(stored) : [];
      const existingIdx = accounts.findIndex((a) => a.id === userData.id || a.email === userData.email);

      const existing = existingIdx >= 0 ? accounts[existingIdx] : null;
      const updatedAccount = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        token: authToken,
        color: existing?.color || getPaletteColor(accounts.length),
        avatarIcon: existing?.avatarIcon || null,
        initials: getInitials(userData.name),
        user: userData,
      };

      if (existingIdx >= 0) {
        accounts[existingIdx] = updatedAccount;
      } else {
        accounts.push(updatedAccount);
      }

      await AsyncStorage.setItem('saved_accounts', JSON.stringify(accounts));
      setSavedAccounts(accounts);
    } catch (e) {
      console.warn('Failed to update saved accounts:', e);
    }
  };

  const updateProfileAvatar = async ({ avatarIcon, color }) => {
    try {
      if (!user) return;
      const updatedUser = { ...user, avatarIcon, color };
      setUser(updatedUser);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));

      const stored = await AsyncStorage.getItem('saved_accounts');
      let accounts = stored ? JSON.parse(stored) : [];
      accounts = accounts.map((a) => {
        if (a.id === user.id || a.email === user.email) {
          return {
            ...a,
            avatarIcon: avatarIcon !== undefined ? avatarIcon : a.avatarIcon,
            color: color !== undefined ? color : a.color,
            user: { ...a.user, avatarIcon, color },
          };
        }
        return a;
      });
      await AsyncStorage.setItem('saved_accounts', JSON.stringify(accounts));
      setSavedAccounts(accounts);
    } catch (e) {
      console.warn('Failed to update profile avatar:', e);
    }
  };

  const loadStoredAuth = async () => {
    try {
      const storedAccountsStr = await AsyncStorage.getItem('saved_accounts');
      let accounts = storedAccountsStr ? JSON.parse(storedAccountsStr) : [];
      setSavedAccounts(accounts);

      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        if (accounts.length === 0) {
          const defaultAcc = {
            id: parsedUser.id,
            name: parsedUser.name,
            email: parsedUser.email,
            token: storedToken,
            color: getPaletteColor(0),
            initials: getInitials(parsedUser.name),
            user: parsedUser,
          };
          accounts = [defaultAcc];
          await AsyncStorage.setItem('saved_accounts', JSON.stringify(accounts));
          setSavedAccounts(accounts);
        }
      } else if (accounts.length > 0) {
        // If no active session but saved accounts exist, go to account chooser
        setIsChoosingAccount(true);
      }
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, rememberMe = true) => {
    // Rely strictly on backend validation
    const response = await authService.login({ email, password });
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    setIsChoosingAccount(false);
    await AsyncStorage.setItem('auth_token', authToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    if (rememberMe) {
      await updateSavedAccountsList(userData, authToken);
    }
    return response.data;
  };

  const register = async (name, email, password, passwordConfirmation, rememberMe = true) => {
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
    setIsChoosingAccount(false);
    await AsyncStorage.setItem('auth_token', authToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    if (rememberMe) {
      await updateSavedAccountsList(userData, authToken);
    }
    return response.data;
  };

  const switchAccount = async (account) => {
    try {
      if (account.token && account.user) {
        await AsyncStorage.setItem('auth_token', account.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(account.user));
        setUser(account.user);
        setToken(account.token);
        setIsChoosingAccount(false);
        return { success: true };
      }
      return { success: false, reason: 'missing_credentials' };
    } catch (e) {
      console.error('Failed to switch account:', e);
      return { success: false, error: e };
    }
  };

  const removeSavedAccount = async (accountId) => {
    try {
      const targetAccount = savedAccounts.find((a) => a.id === accountId);
      if (targetAccount?.token) {
        // Revoke token on server when profile is permanently removed
        await authService.logout().catch(() => {});
      }

      const updated = savedAccounts.filter((a) => a.id !== accountId);
      setSavedAccounts(updated);
      await AsyncStorage.setItem('saved_accounts', JSON.stringify(updated));

      // If active user is the one removed
      if (user && user.id === accountId) {
        setUser(null);
        setToken(null);
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
        if (updated.length > 0) {
          setIsChoosingAccount(true);
        } else {
          setIsChoosingAccount(false);
        }
      }
    } catch (e) {
      console.error('Failed to remove saved account:', e);
    }
  };

  const openAccountChooser = () => {
    setIsChoosingAccount(true);
  };

  const closeAccountChooser = () => {
    setIsChoosingAccount(false);
  };

  const logout = async () => {
    try {
      // 1-Click Logout:
      // We do NOT revoke the token on the backend if this profile is saved in savedAccounts,
      // allowing seamless 1-click switching back later from the profile chooser!
      // (Permanent token revocation happens when removing the account via 'Manage Accounts').
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');

      const stored = await AsyncStorage.getItem('saved_accounts');
      const accounts = stored ? JSON.parse(stored) : [];
      if (accounts.length > 0) {
        setIsChoosingAccount(true);
      } else {
        setIsChoosingAccount(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        savedAccounts,
        isChoosingAccount,
        openAccountChooser,
        closeAccountChooser,
        switchAccount,
        removeSavedAccount,
        updateProfileAvatar,
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
