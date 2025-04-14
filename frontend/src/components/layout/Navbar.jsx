import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaCoins, FaTrophy, FaGamepad, FaUserCog, FaDice, FaRandom } from 'react-icons/fa';
import { GiAbstract013 } from "react-icons/gi";
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { GiTakeMyMoney } from "react-icons/gi";


const AppNavbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const userData = authService.getUserData();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  
  // Update balance from auth context when it changes
  useEffect(() => {
    if (user && user.saldo !== undefined) {
      setBalance(user.saldo);
    } else if (userData && userData.balance !== undefined) {
      setBalance(userData.balance);
    }
  }, [user, userData]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4" sticky="top">
      <Container>
      <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
  <GiTakeMyMoney className="me-2 text-warning size={32}" size={50} />
  <span className="fw-bold fs-2">Virtual Casino</span>
  <GiTakeMyMoney className="me-2 text-warning size={32}" size={50} />
</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <Dropdown as={Nav.Item}>
                  <Dropdown.Toggle as={Nav.Link} id="games-dropdown" className="d-flex align-items-center">
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
                  <Badge bg="warning" text="dark" className="py-1 px-2">
                    ${balance.toFixed(2) || '0.00'}
                  </Badge>
                </Nav.Item>
                <Nav.Link as={Link} to="/profile" className="me-2 d-flex align-items-center">
                  <FaUser className="me-1" /> {userData.username || 'Profile'}
                </Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout} className="d-flex align-items-center">
                  <FaSignOutAlt className="me-1" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2 btn btn-outline-primary btn-sm">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn btn-primary btn-sm">
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
