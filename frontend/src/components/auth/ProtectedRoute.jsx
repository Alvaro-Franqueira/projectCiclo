import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If admin access is required but user is not admin, redirect to games
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/games" replace />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default ProtectedRoute;
