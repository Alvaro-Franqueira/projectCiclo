import api from './api';

const USER_ENDPOINTS = {
  ALL_USERS: '/usuarios/admin/users',
  USER_BY_ID: (id) => `/usuarios/id/${id}`,
  UPDATE_USER: (id) => `/usuarios/${id}`,
  GET_BALANCE: (id) => `/usuarios/balance/${id}`
};

const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get(USER_ENDPOINTS.ALL_USERS);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(USER_ENDPOINTS.USER_BY_ID(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user details' };
    }
  },

  // Update user details
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(USER_ENDPOINTS.UPDATE_USER(userId), userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Update user balance
  updateUserBalance: async (userId, amount) => {
    try {
      // Create a balance update object instead of sending the entire user object
      const balanceUpdate = {
        balance: Number(amount)
      };
      
      // Use the main update endpoint
      const response = await api.put(USER_ENDPOINTS.UPDATE_USER(userId), balanceUpdate);
      
      console.log('Balance update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error.response?.data || { message: 'Failed to update user balance' };
    }
  },
  
  // Get user balance
  getUserBalance: async (userId) => {
    try {
      const response = await api.get(USER_ENDPOINTS.GET_BALANCE(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user balance' };
    }
  },
};

export default userService;
