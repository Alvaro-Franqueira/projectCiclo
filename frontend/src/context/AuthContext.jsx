import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import userService from '../services/userService'; // Import userService for backend updates

const AuthContext = createContext(null);

// Mock user data
const mockUser = {
  id: 1, // Admin ID from database
  username: 'admin',
  nombre: 'Admin',
  apellidos: 'User',
  email: 'admin@casino.com',
  saldo: 5000, // Starting balance from database
  roles: ['ADMIN'] // Admin role
};

export const AuthProvider = ({ children }) => {
  // Initialize state to authenticated with mock user or localStorage data
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState(() => {
    // Try to get user data from localStorage first
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    }
    // Fall back to mock user if localStorage data is not available
    return mockUser;
  });
  const [loading, setLoading] = useState(false); // Start as not loading

  // Save initial user data to localStorage if not already there
  useEffect(() => {
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Initial user data saved to localStorage');
    }
  }, []);

  // Mock login/logout or make them no-op if not needed for testing
  const login = async (credentials) => {
    console.log('Mock login called, already authenticated.');
    // No actual API call, state is already set
    return user;
  };

  const logout = () => {
    console.log('Mock logout called, setting state to unauthenticated.');
    // For testing purposes, allow logout to clear the mock state
    setIsAuthenticated(false);
    setUser(null);
    // Actual localStorage clearing can be skipped or kept depending on needs
    authService.logout(); // Optional: clear localStorage if service does it
  };
  
  // Function to update user balance
  const updateUserBalance = async (newBalance) => {
    if (user) {
      // Update state
      setUser(prevUser => ({
        ...prevUser,
        saldo: newBalance
      }));
      
      // Update localStorage for persistence
      authService.updateUserBalance(newBalance);
      
      // Skip backend update for now as it's causing errors
      // The dice game already updates the user balance in the backend
      // when a bet is placed, so we don't need a separate update
      
      console.log('User balance updated to:', newBalance);
    }
  };

  const value = {
    isAuthenticated,
    user,
    // Use mock user data for isAdmin check or adapt authService.isAdmin
    isAdmin: () => user?.roles?.includes('ADMIN'), 
    login,
    logout,
    loading,
    updateUserBalance // Add the update balance function to context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
