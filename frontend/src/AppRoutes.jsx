import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Layout components
import AppNavbar from './components/layout/Navbar';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Game components
import GameSelection from './pages/GameSelection';
import RouletteGame from './components/games/Roulette';
import DiceGame from './components/games/DiceGame';

// Ranking component
import RankingList from './components/ranking/RankingList';

// Admin component
import UserManagement from './components/admin/UserManagement';

// User Profile
import UserProfile from './pages/UserProfile';

// Payment components
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// Services
import { useAuth } from './context/AuthContext';

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const isRoulettePage = location.pathname === '/games/Roulette' || location.pathname === '/games/roulette';

  return (
    <>
      <AppNavbar noSticky={isRoulettePage} />
      <Container className="py-4">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/games" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/games" /> : <Register />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/games" element={<GameSelection />} />
            <Route path="/games/roulette" element={<RouletteGame />} />
            <Route path="/games/dice" element={<DiceGame />} />
            <Route path="/rankings" element={<RankingList />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
          </Route>
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<UserManagement />} />
          </Route>
          
          {/* Redirect to appropriate page based on auth status */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/games" /> : <Navigate to="/login" />} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </>
  );
}

export default AppRoutes;