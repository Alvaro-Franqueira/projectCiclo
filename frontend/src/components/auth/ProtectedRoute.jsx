import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedRoute = ({ requireAdmin = false }) => {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If admin access is required but user is not admin, redirect to games
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/games" replace />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default ProtectedRoute;
