import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/App.css';
import './assets/styles/Theme.css';
import './assets/styles/Utilities.css';

import AppRoutes from './AppRoutes';

function App() {


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