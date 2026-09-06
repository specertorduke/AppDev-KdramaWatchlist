import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach bearer token if stored
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to retrieve token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler
let onUnauthorizedCallback = null;

export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

// API Service Functions strictly matching backend contracts

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updatePassword: (data) => api.patch('/auth/password', data),
};

// User Profile & Stats
export const userService = {
  getProfile: () => api.get('/user/profile'),
  getStats: () => api.get('/user/stats'),
  deleteAccount: (data) => api.delete('/user', { data }),
};

// Home Dashboard
export const homeService = {
  getDashboard: () => api.get('/home'),
};

// Discover
export const discoverService = {
  discover: (params) => api.get('/discover', { params }),
  getGenres: () => api.get('/discover/genres'),
  search: (params) => api.get('/discover/search', { params }),
  getDramaDetail: (tmdbId) => api.get(`/discover/${tmdbId}`),
};

// Tracker
export const trackerService = {
  getWatchlist: (params) => api.get('/tracker', { params }),
  getDramaProgress: (tmdbId) => api.get(`/tracker/${tmdbId}`),
  addDrama: (data) => api.post('/tracker', data),
  updateProgress: (tmdbId, data) => api.patch(`/tracker/${tmdbId}`, data),
  incrementEpisode: (tmdbId) => api.post(`/tracker/${tmdbId}/increment`),
  deleteDrama: (tmdbId) => api.delete(`/tracker/${tmdbId}`),
};

export default api;
