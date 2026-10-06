import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, userService, setOnUnauthorizedCallback } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    setOnUnauthorizedCallback(async () => {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
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
    const response = await authService.login({ email, password });
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    await AsyncStorage.setItem('auth_token', authToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    return response.data;
  };

  const register = async (
    nameOrData,
    email,
    password,
    passwordConfirmation,
    termsPrivacyAccepted = true,
    otp = null
  ) => {
    let payload;
    if (typeof nameOrData === 'object' && nameOrData !== null) {
      payload = {
        name: nameOrData.name,
        email: nameOrData.email,
        password: nameOrData.password,
        password_confirmation: nameOrData.passwordConfirmation || nameOrData.password_confirmation,
        terms_privacy_accepted: nameOrData.termsPrivacyAccepted ?? nameOrData.terms_privacy_accepted ?? true,
      };
      if (nameOrData.otp) {
        payload.otp = nameOrData.otp;
      }
    } else {
      payload = {
        name: nameOrData,
        email,
        password,
        password_confirmation: passwordConfirmation,
        terms_privacy_accepted: termsPrivacyAccepted,
      };
      if (otp) {
        payload.otp = otp;
      }
    }
    const response = await authService.register(payload);
    const { user: userData, token: authToken } = response.data;
    if (authToken && userData) {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      setNeedsOnboarding(true);
    }
    return response.data;
  };

  const updateProfileAvatar = async ({ avatarIcon, color, avatarUrl }) => {
    try {
      if (!user) return;
      const updatedUser = {
        ...user,
        ...(avatarIcon !== undefined ? { avatarIcon } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));

      if (avatarUrl !== undefined) {
        try {
          await userService.updatePreferences({ avatar_url: avatarUrl });
        } catch (prefErr) {
          console.warn('Backend preferences sync failed:', prefErr);
        }
      }
    } catch (e) {
      console.warn('Failed to update profile avatar:', e);
    }
  };

  const updateUserPreferences = async ({ favoriteGenres, avatarUrl }) => {
    try {
      const response = await userService.updatePreferences({
        favorite_genres: favoriteGenres,
        avatar_url: avatarUrl,
      });
      const updated = response.data.data;
      if (updated) {
        const newUser = {
          ...user,
          ...updated,
          favorite_genres: updated.favorite_genres ?? user?.favorite_genres,
        };
        setUser(newUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
      }
      return response.data;
    } catch (e) {
      console.warn('Failed to sync preferences:', e);
      if (favoriteGenres && user) {
        const localUser = { ...user, favorite_genres: favoriteGenres };
        setUser(localUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(localUser));
      }
      throw e;
    }
  };

  const updateProfileName = async (name) => {
    try {
      const response = await userService.updateProfile({ name });
      const updated = response.data.data;
      if (updated) {
        const newUser = { ...user, ...updated };
        setUser(newUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
      }
      return response.data;
    } catch (e) {
      console.warn('Failed to update profile name:', e);
      throw e;
    }
  };

  const updateUserEmail = async ({ newEmail, currentPassword, verificationOtp }) => {
    try {
      const response = await userService.updateEmail({
        email: newEmail,
        current_password: currentPassword,
        otp: verificationOtp,
      });
      const updatedUser = response?.data?.data?.user || response?.data?.data;
      if (updatedUser) {
        const merged = { ...user, ...updatedUser };
        setUser(merged);
        await AsyncStorage.setItem('auth_user', JSON.stringify(merged));
      } else if (newEmail) {
        const merged = { ...user, email: newEmail };
        setUser(merged);
        await AsyncStorage.setItem('auth_user', JSON.stringify(merged));
      }
      return response.data;
    } catch (e) {
      console.warn('Failed to update email in context:', e);
      throw e;
    }
  };

  const sendSignupOtp = async (formData) => {
    const response = await authService.sendSignupOtp(formData);
    return response.data;
  };

  const verifyOtp = async ({ email, otp }) => {
    const response = await authService.verifyOtp({ email, otp });
    const { user: userData, token: authToken } = response.data;
    if (authToken && userData) {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
      setNeedsOnboarding(true);
    }
    return response.data;
  };

  const resendOtp = async ({ email }) => {
    const response = await authService.resendOtp({ email });
    return response.data;
  };

  const logout = async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('saved_accounts').catch(() => {});
    }
  };

  const deleteAccount = async (currentPassword) => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      await userService.deleteAccount({ current_password: currentPassword });

      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('saved_accounts').catch(() => {});

      return { success: true };
    } catch (e) {
      console.warn('Failed to delete account:', e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.current_password?.[0] ||
        'Failed to delete account. Please verify your password.';
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        updateProfileAvatar,
        updateUserPreferences,
        updateProfileName,
        updateUserEmail,
        deleteAccount,
        needsOnboarding,
        setNeedsOnboarding,
        login,
        register,
        sendSignupOtp,
        verifyOtp,
        resendOtp,
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
