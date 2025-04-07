import React from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaCoins, FaTrophy, FaGamepad, FaUserCog } from 'react-icons/fa';
import authService from '../../services/authService';

const AppNavbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const userData = authService.getUserData();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Virtual Casino
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/games">
                  <FaGamepad className="me-1" /> Games
                </Nav.Link>
                <Nav.Link as={Link} to="/rankings">
                  <FaTrophy className="me-1" /> Rankings
                </Nav.Link>
                {isAdmin && (
                  <Nav.Link as={Link} to="/admin">
                    <FaUserCog className="me-1" /> Admin Panel
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <>
                <Nav.Item className="d-flex align-items-center me-3">
                  <FaCoins className="text-warning me-1" />
                  <Badge bg="warning" text="dark">
                    {userData.balance?.toFixed(2) || '0.00'}
                  </Badge>
                </Nav.Item>
                <Nav.Link as={Link} to="/profile" className="me-2">
                  <FaUser className="me-1" /> {userData.username || 'Profile'}
                </Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  <FaSignOutAlt className="me-1" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
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
