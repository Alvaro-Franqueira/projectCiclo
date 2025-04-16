import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaCoins, FaTrophy, FaGamepad, FaUserCog, FaDice, FaRandom } from 'react-icons/fa';
import { GiAbstract013 } from "react-icons/gi";
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { GiTakeMyMoney } from "react-icons/gi";
import neonFavicon from '../images/neonfavicon.png';


const AppNavbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  
  useEffect(() => {
    const updateBalance = async () => {
      if (!user || !user.id) return;
      
      try {
        // Try to get balance directly from user object first
        let balanceValue = 0;
        
        // Check if user has a balance property that's not a Promise
        if (user.balance !== undefined && user.balance !== null && typeof user.balance !== 'object') {
          balanceValue = user.balance;
        } 
        // Check if user has a saldo property that's not a Promise
        else if (user.saldo !== undefined && user.saldo !== null && typeof user.saldo !== 'object') {
          balanceValue = user.saldo;
        }
        // If we couldn't get a valid balance from the user object, try to fetch it from the server
        else {
          try {
            // Get the current user's balance from the server
            const userBalance = await authService.getUserBalance(user.id);
            if (userBalance !== undefined && userBalance !== null) {
              balanceValue = userBalance;
            }
          } catch (error) {
            console.error('Error fetching user balance:', error);
          }
        }
        
        // Convert to number and validate
        const numericBalance = Number(balanceValue);
        if (!isNaN(numericBalance)) {
          setBalance(numericBalance);
        } else {
          console.warn(`Invalid balance value: ${balanceValue}. Setting to 0.`);
          setBalance(0);
        }
      } catch (error) {
        console.error('Error in updateBalance:', error);
        setBalance(0);
      }
    };
    
    updateBalance();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4" sticky="top">
      <Container>
      <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
        <img
          src={neonFavicon}
          alt="Virtual Casino Logo"
          className="me-2"
          style={{ width: '50px', height: '50px' }}
        />
        <span className="fw-bold fs-2">Virtual Casino</span>
        <img
          src={neonFavicon}
          alt="Virtual Casino Logo"
          className="me-2"
          style={{ width: '50px', height: '50px' }}
        />
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
                {user && user.rol === 'ADMIN' && (
                  <Nav.Link as={Link} to="/admin">
                    <FaUserCog className="me-1" /> Admin Panel
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated && user ? (
              <>
                <Nav.Item className="d-flex align-items-center me-3">
                  <FaCoins className="text-warning me-1" />
                  <Badge bg="warning" text="dark" className="py-1 px-2">
                    ${balance.toFixed(2)}
                  </Badge>
                </Nav.Item>
                <Nav.Link as={Link} to="/profile" className="me-2 d-flex align-items-center">
                  <FaUser className="me-1" /> {user.username || 'Profile'}
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
