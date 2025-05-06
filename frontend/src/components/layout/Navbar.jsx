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
import { GiAbstract013 } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import neonFavicon from '../images/neonfavicon.png';

const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const navRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Collapse on route change
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  // Collapse if click outside the navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      expanded={expanded}
      onToggle={() => setExpanded((prev) => !prev)}
      className="mb-4"
      sticky="top"
      ref={navRef}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src={neonFavicon}
            alt="Logo"
            className="me-2"
            style={{ width: '40px', height: '40px' }}
          />
          <span className="fw-bold fs-4">Virtual Casino</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
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
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/games">
                      <FaGamepad className="me-2" /> All Games
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <Nav.Link as={Link} to="/rankings">
                  <FaTrophy className="me-1" /> Rankings
                </Nav.Link>

                {user?.rol === 'ADMIN' && (
                  <Nav.Link as={Link} to="/admin">
                    <FaUserCog className="me-1" /> Admin Panel
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>

          <Nav className="ms-auto d-flex align-items-center">
            {isAuthenticated ? (
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
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to="/login"
                  className="btn btn-outline-primary btn-sm me-2 my-2 my-lg-0"
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  className="btn btn-primary btn-sm my-2 my-lg-0"
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
