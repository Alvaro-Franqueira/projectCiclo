import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Debug: Log user object to see what's coming from the backend
  console.log('User object in ProtectedRoute:', user);
  console.log('User role:', user?.role);
  console.log('Is admin check:', user?.role === 'ADMIN');
  
  // Check for admin role directly from user object
  const isAdmin = user?.role === 'ADMIN';

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If admin access is required but user is not admin, redirect to games
  if (requireAdmin) {
    console.log('Admin route accessed, requireAdmin:', requireAdmin);
    console.log('Is user admin?', isAdmin);
    
    if (!isAdmin) {
      console.log('Admin access required but user is not admin:', user);
      return <Navigate to="/games" replace />;
    } else {
      console.log('User is admin, should allow access to admin page');
    }
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default ProtectedRoute;
