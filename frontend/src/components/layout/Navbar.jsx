/**
 * Navbar Component
 * A responsive navigation bar for the casino platform that provides access to games,
 * user features, and administrative functions.
 * 
 * Features:
 * - Responsive design with mobile menu
 * - Dynamic navigation based on authentication state
 * - Game dropdown menu with icons
 * - User profile and balance management
 * - Admin panel access for authorized users
 * - Automatic collapse on route change
 * - Click outside detection for mobile menu
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Navbar,
  Nav,
  Container,
  Button,
  Dropdown
} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaUser,
  FaSignOutAlt,
  FaTrophy,
  FaGamepad,
  FaUserCog,
  FaDice,
  FaCreditCard
} from 'react-icons/fa';
import { GiAbstract013, GiCoins, GiPokerHand } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import logoCasino from '../images/logo-casino.png';

// ===== Component =====

/**
 * AppNavbar Component
 * Main navigation component for the casino platform
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.noSticky - Whether to disable sticky positioning
 */
const AppNavbar = ({ noSticky }) => {
  // ===== Hooks =====
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  
  // ===== State =====
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef();

  // ===== Event Handlers =====

  /**
   * Handles user logout and redirects to login page
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ===== Effects =====

  /**
   * Collapses navbar when route changes
   */
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  /**
   * Handles click outside navbar to collapse mobile menu
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== Render Functions =====

  /**
   * Renders the games dropdown menu
   * @returns {JSX.Element} Games dropdown menu
   */
  const renderGamesDropdown = () => (
    <Dropdown as={Nav.Item}>
      <Dropdown.Toggle as={Nav.Link} id="games-dropdown">
        <FaGamepad className="me-1" /> Games
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item as={Link} to="/games/roulette">
          <GiAbstract013 className="me-2" /> Roulette
        </Dropdown.Item>
        <Dropdown.Item as={Link} to="/games/dice">
          <FaDice className="me-2" /> Dice Game
        </Dropdown.Item>
        <Dropdown.Item as={Link} to="/games/blackjack">
          <GiPokerHand className="me-2" /> Blackjack
        </Dropdown.Item>
        <Dropdown.Item as={Link} to="/games/slotmachine">
          <GiCoins className="me-2" /> Slot Machine
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item as={Link} to="/games">
          <FaGamepad className="me-2" /> All Games
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  /**
   * Renders authenticated user navigation items
   * @returns {JSX.Element} Authenticated user navigation
   */
  const renderAuthenticatedNav = () => (
    <>
      <Nav.Link as={Link} to="/payment">
        <FaCreditCard className="me-1" /> Add Credits
      </Nav.Link>

      <Nav.Link as={Link} to="/profile">
        <FaUser className="me-1" /> {user?.username || 'Profile'}
      </Nav.Link>

      <Button
        variant="outline-light"
        className="ms-2 my-2 my-lg-0"
        onClick={handleLogout}
      >
        <FaSignOutAlt className="me-1" />
        Logout
      </Button>
    </>
  );

  /**
   * Renders unauthenticated user navigation items
   * @returns {JSX.Element} Unauthenticated user navigation
   */
  const renderUnauthenticatedNav = () => (
    <>
      <Nav.Link
        as={Link}
        to="/login"
        className="button btn-success pad-2"
      >
        Login
      </Nav.Link>
      <Nav.Link
        as={Link}
        to="/register"
        className="btn btn-outline-primary pad-2 ms-2"
      >
        Register
      </Nav.Link>
    </>
  );

  // ===== Main Render =====
  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      expanded={expanded}
      onToggle={() => setExpanded((prev) => !prev)}
      className="mb-4 rounded-3 shadow-sm"
      sticky={noSticky ? undefined : "top"}
      ref={navRef}
    >
      <Container fluid className="d-flex justify-content-around align-items-center">
        {/* Brand/Logo Section */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src={logoCasino}
            alt="Logo"
            className="me-2 navbar-logo"
            style={{ width: '40px', height: '40px' }}
          />
          <span className="fw-bold casino-navbar">Virtual Casino</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          {/* Main Navigation Section */}
          <Nav className="me-auto navbar-nav align-items-center justify-content-center">
            {isAuthenticated && (
              <>
                {renderGamesDropdown()}

                <Nav.Link as={Link} to="/rankings">
                  <FaTrophy className="me-1" /> Rankings
                </Nav.Link>

                {user?.role === 'ADMIN' && (
                  <Nav.Link as={Link} to="/admin">
                    <FaUserCog className="me-1" /> Admin Panel
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>

          {/* User Navigation Section */}
          <Nav className="ms-auto d-flex align-items-center justify-content-center">
            {isAuthenticated ? renderAuthenticatedNav() : renderUnauthenticatedNav()}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
