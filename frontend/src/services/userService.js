import api from './api';

const USER_ENDPOINTS = {
  ALL_USERS: '/usuarios',
  USER_BY_ID: (id) => `/usuarios/${id}`,
  UPDATE_USER: (id) => `/usuarios/${id}`,
  UPDATE_BALANCE: (id) => `/usuarios/${id}/balance`,
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

  // Update user balance (admin only)
  updateUserBalance: async (userId, amount) => {
    try {
      const response = await api.patch(USER_ENDPOINTS.UPDATE_BALANCE(userId), { balance: amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user balance' };
    }
  }
};

export default userService;
