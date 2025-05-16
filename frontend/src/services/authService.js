import api from './api';
import { jwtDecode } from 'jwt-decode';

const AUTH_ENDPOINTS = {
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  CURRENT_USER: '/users/me',
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
      console.error('Login error:', error.response || error);
      throw error; // Pass the full error object to allow components to inspect response status
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response || error);
      
      // Format validation errors for easier handling in components
      if (error.response && error.response.data && error.response.data.errors) {
        // Preserve the original error structure but add a formatted property
        error.validationErrors = error.response.data.errors;
      }
      
      throw error; // Pass the full error object to allow components to inspect response details
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

  // Update user balance in localStorage
  updateUserBalance: (newBalance) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.id) {
        console.error('Cannot update balance: User not authenticated');
        return false;
      }
      
      // Ensure newBalance is a number
      const numericBalance = Number(newBalance);
      if (isNaN(numericBalance)) {
        console.error('Invalid balance value:', newBalance);
        return false;
      }
      
      // Update the balance in the user data
      userData.balance = numericBalance;
      
      // Save updated user data back to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('User balance updated in localStorage:', numericBalance);
      return true;
    } catch (error) {
      console.error('Error updating user balance in localStorage:', error);
      return false;
    }
  },

  // Get user balance from localStorage or from server if needed
  getUserBalance: async (userId) => {
    try {
      // First try to get from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If we have a valid balance in localStorage, return it
      if (userData.balance !== undefined && userData.balance !== null && typeof userData.balance !== 'object') {
        return Number(userData.balance);
      }
          
      // If we don't have a valid balance in localStorage, fetch from server
      if (userId) {
        try {
          const response = await api.get(`/users/${userId}`);
          const user = response.data;
          
          // Update localStorage with the fetched user data
          if (user) {
            const balanceValue = user.balance || 0;
            const numericBalance = Number(balanceValue);
            
            // Update the user data in localStorage
            userData.balance = numericBalance;
            localStorage.setItem('user', JSON.stringify(userData));
            
            return numericBalance;
          }
        } catch (error) {
          console.error('Error fetching user balance from server:', error);
        }
      }
      
      return 0; // Default to 0 if we couldn't get a valid balance
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  },

  // Logout user
  logout: () => {
    clearUserData();
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
    console.log('Getting user role, user object:', user);
    // Check both role and rol properties
    return user.role || user.rol || 'USER';
  },

  // Check if user is admin
  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Checking if user is admin:', user);
    // Check both role and rol properties for ADMIN value
    return user.role === 'ADMIN' || user.rol === 'ADMIN';
  },

  // Get user data from localStorage
  getUserData: () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('User data from localStorage:', userData);
    return userData;
  }
};

export default authService;