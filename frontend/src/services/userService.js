import api from './api';

const USER_ENDPOINTS = {
  ALL_USERS: '/users/admin/users',
  USER_BY_ID: (id) => `/users/id/${id}`,
  UPDATE_USER: (id) => `/users/${id}`,
  GET_BALANCE: (id) => `/users/balance/${id}`,
  UPDATE_BALANCE: (id) => `/users/balance/${id}`,
  DELETE_USER: (id) => `/users/admin/${id}`
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
      console.log("User data from getUserById:", response.data); // Add log to verify
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
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
    // The backend expects a query parameter 'newBalance', not a request body
    const response = await api.put(
      `${USER_ENDPOINTS.UPDATE_BALANCE(userId)}?newBalance=${amount}`
    );
    
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

  // Delete a user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(USER_ENDPOINTS.DELETE_USER(userId));
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },
};

export default userService;
