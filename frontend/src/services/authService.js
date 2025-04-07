import api from './api';
import { jwtDecode } from 'jwt-decode';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  CURRENT_USER: '/usuarios/me',
};

// Helper to store user data in localStorage
const setUserData = (token, userData) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
};

// Helper to clear user data from localStorage
const clearUserData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const authService = {
  // Login user and store token
  login: async (credentials) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
      const { token, user } = response.data;
      setUserData(token, user);
      return user;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      const response = await api.get(AUTH_ENDPOINTS.CURRENT_USER);
      return response.data;
    } catch (error) {
      clearUserData();
      throw error;
    }
  },

  // Logout user
  logout: () => {
    clearUserData();
    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        clearUserData();
        return false;
      }
      
      return true;
    } catch (error) {
      clearUserData();
      return false;
    }
  },

  // Get user role
  getUserRole: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.rol || 'USER';
  },

  // Check if user is admin
  isAdmin: () => {
    return authService.getUserRole() === 'ADMIN';
  },

  // Get user data from localStorage
  getUserData: () => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }
};

export default authService;
