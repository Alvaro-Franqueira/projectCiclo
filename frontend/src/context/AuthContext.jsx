import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import userService from '../services/userService'; // Import userService for backend updates

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage data if available
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return authService.isAuthenticated();
  });
  
  const [user, setUser] = useState(() => {
    // Try to get user data from localStorage
    return authService.getUserData();
  });
  
  const [loading, setLoading] = useState(false);

  // Effect to check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (isAuthenticated) {
        try {
          // Refresh user data from the server
          await refreshUserData();
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };
    
    checkAuthStatus();
  }, [isAuthenticated]);

  // Function to refresh user data from the server
  const refreshUserData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      
      if (userData) {
        // Ensure we have numeric balance
        if (userData.balance !== undefined || userData.saldo !== undefined) {
          const balanceValue = userData.balance !== undefined ? userData.balance : userData.saldo;
          userData.balance = Number(balanceValue);
        }
        
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If there's an error getting the current user, we might be unauthorized
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);
      
      // Ensure we have numeric balance
      if (userData.balance !== undefined || userData.saldo !== undefined) {
        const balanceValue = userData.balance !== undefined ? userData.balance : userData.saldo;
        userData.balance = Number(balanceValue);
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };
  
  // Function to update user balance
  const updateUserBalance = async (newBalance) => {
    if (!user || !user.id) {
      console.error('Cannot update balance: User not authenticated');
      return;
    }
    
    // Make sure newBalance is a number
    const numericBalance = Number(newBalance);
    
    if (isNaN(numericBalance)) {
      console.error('Invalid balance value:', newBalance);
      return;
    }
    
    // Update state with numeric balance
    setUser(prevUser => ({
      ...prevUser,
      balance: numericBalance
    }));
    
    // Update localStorage with numeric balance
    authService.updateUserBalance(numericBalance);
    
    // Update backend (optional, as the balance is usually updated by the game logic)
    try {
      // Make sure we're passing a numeric value to the backend
      await userService.updateUserBalance(user.id, numericBalance);
      console.log('User balance updated to:', numericBalance);
    } catch (error) {
      console.error(':', error);
    }
  };

  // Update user in context (for other user data updates)
  const updateUserInContext = (updatedUserData) => {
    if (!updatedUserData) return;
    
    // Ensure balance is numeric if present
    if (updatedUserData.balance !== undefined) {
      updatedUserData.balance = Number(updatedUserData.balance);
    }
    
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify({
      ...user,
      ...updatedUserData
    }));
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.rol === 'ADMIN';
  };

  // Provide auth context values
  const value = {
    isAuthenticated,
    user,
    isAdmin,
    login,
    logout,
    loading,
    updateUserBalance,
    refreshUserData,
    updateUserInContext
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
