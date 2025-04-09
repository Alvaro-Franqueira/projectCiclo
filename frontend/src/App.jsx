import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Services
import { useAuth } from './context/AuthContext';

// CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Router>
      <AppNavbar />
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
    </Router>
  );
}

export default App;
