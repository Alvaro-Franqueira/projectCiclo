import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaCoins, FaTrophy, FaGamepad, FaUserCog, FaDice, FaRandom, FaCreditCard } from 'react-icons/fa';
import { GiAbstract013 } from "react-icons/gi";
import { useAuth } from '../../context/AuthContext';
import neonFavicon from '../images/neonfavicon.png';


const AppNavbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  }


  return (
    <Navbar bg="dark" 
            variant="dark" 
            expand="lg" 
            className="mb-4" 
            sticky="top" 
            align="right">
      <Container>
        
      <Navbar.Brand as={Link} to="/" >
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
  <Nav className="me-auto ">
    {isAuthenticated && (
      <>
        <Dropdown as={Nav.Item}>
          <Dropdown.Toggle as={Nav.Link} id="games-dropdown" >
            <FaGamepad className="me-1" /> Games
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} to="/games/roulette" onClick={handleDropdownToggle}>
              <GiAbstract013 className="me-2" /> Roulette
            </Dropdown.Item>
            <Dropdown.Item as={Link} to="/games/dice" onClick={handleDropdownToggle}>
              <FaDice className="me-2" /> Dice Game
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} to="/games" onClick={handleDropdownToggle}>
              <FaGamepad className="me-2" /> All Games
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <Nav.Link as={Link} to="/rankings" onClick={handleDropdownToggle}>
          <FaTrophy className="me-1" /> Rankings
        </Nav.Link>

        {user && user.rol === 'ADMIN' && (
          <Nav.Link as={Link} to="/admin"  onClick={handleDropdownToggle}>
            <FaUserCog className="me-1" /> Admin Panel
          </Nav.Link>
        )}

        <Nav.Link as={Link} to="/profile" className="" onClick={handleDropdownToggle}>
          <FaUser className="me-1" /> {user.username || 'Profile'}
        </Nav.Link>

        <Nav.Link as={Link} to="/payment" className="ms-auto align-items-center"  onClick={handleDropdownToggle}>
          <FaCreditCard className="me-1" /> Add Credits

        </Nav.Link>

        <Button variant="outline-light" className=" ms-auto d-inline-flex align-items-center" onClick={handleLogout} >
          <FaSignOutAlt /> Logout
        </Button>
      </>
    )}

    {!isAuthenticated && (
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
