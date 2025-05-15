import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react'; // Import useMemo and useCallback
import authService from '../services/authService';
import userService from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return authService.isAuthenticated();
  });

  const [user, setUser] = useState(() => {
    return authService.getUserData();
  });

  const [loading, setLoading] = useState(false); // Keep track of initial loading/refreshing

  // --- Wrap Functions with useCallback ---

  // Logout function (dependency: none, as setters are stable)
  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []); // No dependencies needed for state setters

  // Function to refresh user data from the server
  const refreshUserData = useCallback(async () => {
    // No need to check isAuthenticated here, rely on caller or effect dependency
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      // Ensure balance is a number if present in userData
      if (userData && userData.balance !== undefined) {
           userData.balance = Number(userData.balance);
       }
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) { // Check for 401 or 403
        console.log('Unauthorized during refresh, logging out.');
        logout(); // Use the memoized logout function
      }
       // Optionally re-throw or handle other errors
    } finally {
      setLoading(false);
    }
  }, [logout]); // Dependency on logout (which is stable)

  // Effect to check authentication status on mount and refresh
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (authService.isAuthenticated()) { // Check storage directly first
         setIsAuthenticated(true); // Ensure state consistency
         await refreshUserData();
      } else {
         setIsAuthenticated(false);
         setUser(null);
      }
    };
    checkAuthStatus();
  }, [refreshUserData]); // Run when refreshUserData function reference changes (which is stable now)


  // Login function (dependency: none)
  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const userData = await authService.login(credentials);

      setUser(userData);
      setIsAuthenticated(true);
      return userData; // Return data for potential chaining
    } catch (error) {
      // Do not clear authentication state or redirect on login failure
      console.error("Login failed:", error);
      throw error; // Re-throw error for the calling component to handle
    } finally {
      setLoading(false);
    }
  }, []); // State setters are stable


  // Function to update user balance (client-side focus)
  // Assumes backend updates happen via game/transaction logic primarily
  const updateUserBalance = useCallback((newBalance) => {
    const numericBalance = Number(newBalance);
    if (isNaN(numericBalance)) {
      console.error('Invalid balance value provided to updateUserBalance:', newBalance);
      return;
    }

    // Update React state using functional update for safety
    setUser(prevUser => {
      if (!prevUser) return null; // Handle case where user might be null briefly
      const updatedUser = { ...prevUser, balance: numericBalance };
      // Update localStorage simultaneously
      authService.updateUserBalance(numericBalance); // Assumes this updates the user object in localStorage
      return updatedUser;
    });
  }, []); // Dependency only needed if accessing user.id directly for a backend call


  // Update user in context (for other user data updates like profile changes)
  const updateUserInContext = useCallback((updatedUserData) => {
    if (!updatedUserData) return;

    setUser(prevUser => {
      if (!prevUser) return null;
      // Ensure balance is numeric if present in the update
      if (updatedUserData.balance !== undefined) {
        updatedUserData.balance = Number(updatedUserData.balance);
      }
      const newUser = { ...prevUser, ...updatedUserData };
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(newUser)); // Update the whole user object in storage
      return newUser;
    });
  }, []); // State setter is stable


  // --- Memoize derived value (isAdmin) ---
  const isAdmin = useMemo(() => user?.rol === 'ADMIN', [user?.rol]); // Only recalculate when user role changes

  // --- Memoize the context value object ---
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    isAdmin, // Use the memoized boolean value
    login,
    logout,
    loading,
    updateUserBalance,
    refreshUserData,
    updateUserInContext
  }), [
    isAuthenticated,
    user,
    isAdmin, // The memoized boolean
    login,    // Stable function ref
    logout,   // Stable function ref
    loading,
    updateUserBalance, // Stable function ref
    refreshUserData,   // Stable function ref
    updateUserInContext // Stable function ref
  ]);

  // --- Render Provider ---
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};