import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import AppRoutes from './AppRoutes';
import ensureBlackjackGame from './utils/ensureBlackjackGame';

function App() {
  // Run once on application startup to ensure Blackjack game exists
  useEffect(() => {
    const initializeGames = async () => {
      try {
        await ensureBlackjackGame();
      } catch (error) {
        console.error('Failed to initialize games:', error);
      }
    };

    initializeGames();
  }, []);

  return (
    <Router future={{ 
      v7_relativeSplatPath: true,
      v7_startTransition: true 
    }}>
      <AppRoutes />
    </Router>
  );
}

export default App;