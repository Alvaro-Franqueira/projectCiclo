/**
 * Main routing configuration for the casino application.
 * Handles all route definitions and access control based on authentication and user roles.
 */
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Layout Components
import AppNavbar from './components/layout/Navbar';

// Authentication Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Game Components
import GameSelection from './pages/GameSelection';
import RouletteGame from './components/games/Roulette';
import DiceGame from './components/games/DiceGame';
import BlackjackPage from './pages/BlackjackPage';
import SlotMachinePage from './pages/SlotMachinePage';
import ComingSoon from './pages/ComingSoon';

// Ranking and User Management Components
import RankingList from './components/ranking/RankingList';
import UserManagement from './components/admin/UserManagement';
import UserProfile from './pages/UserProfile';

// Payment Processing Components
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// Authentication Context
import { useAuth } from './context/AuthContext';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  
  // Determine if user has admin privileges
  const isAdmin = user?.role === 'ADMIN';
  const location = useLocation();
  
  // Special handling for Roulette page to disable sticky navbar
  const isRoulettePage = location.pathname === '/games/Roulette' || location.pathname === '/games/roulette';

  return (
    <>
      <AppNavbar noSticky={isRoulettePage} />
      <Container className="py-4">
        <Routes>
          {/* Public Routes - Accessible without authentication */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/games" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/games" /> : <Register />} />
          
          {/* Protected Routes - Require user authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/games" element={<GameSelection />} />
            <Route path="/games/roulette" element={<RouletteGame />} />
            <Route path="/games/dice" element={<DiceGame />} />
            <Route path="/games/poker" element={<ComingSoon />} />
            <Route path="/games/tragaperras" element={<SlotMachinePage />} />
            <Route path="/games/slotmachine" element={<SlotMachinePage />} />
            <Route path="/games/blackjack" element={<BlackjackPage />} />
            <Route path="/games/sportsbetting" element={<ComingSoon />} />
            <Route path="/rankings" element={<RankingList />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
          </Route>
          
          {/* Admin Routes - Require both authentication and admin privileges */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<UserManagement />} />
          </Route>
          
          {/* Default Routes - Handle root path and redirects */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/games" /> : <Navigate to="/login" />} />
          
          {/* Fallback Route - Catch all unmatched paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </>
  );
}

export default AppRoutes;