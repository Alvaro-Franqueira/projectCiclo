import api from './api';

const USER_ENDPOINTS = {
  ALL_USERS: '/usuarios/admin/users',
  USER_BY_ID: (id) => `/usuarios/id/${id}`,
  UPDATE_USER: (id) => `/usuarios/${id}`,
  GET_BALANCE: (id) => `/usuarios/balance/${id}`,
  UPDATE_BALANCE: (id) => `/usuarios/balance/${id}`
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
      // --- CRITICAL: Ensure response.data contains the balance field ---
      // Example: response.data might look like { id: 1, username: 'test', email: '...', saldo: 123.45, rol: 'USER', ... }
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
    // The backend expects a query parameter 'nuevoBalance', not a request body
    const response = await api.put(
      `${USER_ENDPOINTS.UPDATE_BALANCE(userId)}?nuevoBalance=${amount}`
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
};

export default userService;
