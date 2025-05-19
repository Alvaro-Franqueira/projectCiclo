/**
 * AuthContext Component
 * A comprehensive authentication context provider that manages user authentication state,
 * user data, and related operations throughout the application.
 * 
 * Features:
 * - User authentication state management
 * - User data persistence and synchronization
 * - Automatic authentication status checking
 * - Secure token management
 * - User balance updates
 * - Role-based access control
 * - Loading state management
 * - Error handling and recovery
 */

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import authService from '../services/authService';

// ===== Context Creation =====

/**
 * Authentication context for managing user authentication state
 */
const AuthContext = createContext(null);

// ===== Provider Component =====

/**
 * AuthProvider Component
 * Provides authentication context to the application
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped
 */
export const AuthProvider = ({ children }) => {
  // ===== State Management =====

  /**
   * Authentication state
   * Tracks whether a user is currently authenticated
   */
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return authService.isAuthenticated();
  });

  /**
   * User data state
   * Stores the current user's information
   */
  const [user, setUser] = useState(() => {
    return authService.getUserData();
  });

  /**
   * Loading state
   * Tracks ongoing authentication operations
   */
  const [loading, setLoading] = useState(false);

  // ===== Authentication Functions =====

  /**
   * Handles user logout
   * Clears authentication state and user data
   */
  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  /**
   * Refreshes user data from the server
   * Updates local user state with latest server data
   * Handles unauthorized errors by logging out
   */
  const refreshUserData = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      
      // Ensure balance is a number if present
      if (userData && userData.balance !== undefined) {
        userData.balance = Number(userData.balance);
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Unauthorized during refresh, logging out.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  /**
   * Handles user login
   * Authenticates user and updates application state
   * 
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} User data on successful login
   * @throws {Error} If login fails
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== User Data Management =====

  /**
   * Updates user balance in state and storage
   * 
   * @param {number|string} newBalance - New balance value
   */
  const updateUserBalance = useCallback((newBalance) => {
    const numericBalance = Number(newBalance);
    if (isNaN(numericBalance)) {
      console.error('Invalid balance value provided to updateUserBalance:', newBalance);
      return;
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, balance: numericBalance };
      authService.updateUserBalance(numericBalance);
      return updatedUser;
    });
  }, []);

  /**
   * Updates user data in context and storage
   * 
   * @param {Object} updatedUserData - Updated user data
   */
  const updateUserInContext = useCallback((updatedUserData) => {
    if (!updatedUserData) return;

    setUser(prevUser => {
      if (!prevUser) return null;
      if (updatedUserData.balance !== undefined) {
        updatedUserData.balance = Number(updatedUserData.balance);
      }
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  // ===== Effects =====

  /**
   * Effect to check authentication status on mount and refresh
   * Verifies token validity and updates user data
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (authService.isAuthenticated()) {
        setIsAuthenticated(true);
        await refreshUserData();
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    checkAuthStatus();
  }, [refreshUserData]);

  // ===== Derived Values =====

  /**
   * Memoized admin status check
   * Only recalculates when user role changes
   */
  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user?.role]);

  // ===== Context Value =====

  /**
   * Memoized context value
   * Prevents unnecessary re-renders of consuming components
   */
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    isAdmin,
    login,
    logout,
    loading,
    updateUserBalance,
    refreshUserData,
    updateUserInContext
  }), [
    isAuthenticated,
    user,
    isAdmin,
    login,
    logout,
    loading,
    updateUserBalance,
    refreshUserData,
    updateUserInContext
  ]);

  // ===== Render =====
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== Custom Hook =====

/**
 * Custom hook to access the authentication context
 * 
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};