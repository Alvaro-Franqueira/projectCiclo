/**
 * UserManagement Component
 * A comprehensive admin interface for managing both users and games in the casino platform.
 * 
 * Features:
 * - User management (CRUD operations)
 * - User balance management
 * - User search and filtering
 * - Game management (CRUD operations)
 * - Game search and filtering
 * - Real-time updates and error handling
 * - Responsive UI with loading states
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import {
  FaUserEdit,
  FaUser,
  FaCoins,
  FaTrash,
  FaSearch,
  FaGamepad,
  FaPlus,
  FaEdit,
  FaTrashAlt
} from 'react-icons/fa';
import userService from '../../services/userService';
import gameService from '../../services/gameService';
import '../../assets/styles/UserManagement.css';

// ===== Constants =====

/**
 * Initial state for user edit form
 * @type {Object}
 */
const initialUserFormState = {
  username: '',
  email: '',
  role: 'USER'
};

/**
 * Initial state for game form
 * @type {Object}
 */
const initialGameFormState = {
  name: '',
  description: '',
};

// ===== Component =====

const UserManagement = () => {
  // ===== User Management State =====
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [showUserBalanceModal, setShowUserBalanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalanceAmount, setUserBalanceAmount] = useState(0);
  const [userEditFormData, setUserEditFormData] = useState(initialUserFormState);

  // ===== Game Management State =====
  const [games, setGames] = useState([]);
  const [gameLoading, setGameLoading] = useState(true);
  const [gameError, setGameError] = useState('');
  const [gameSearchTerm, setGameSearchTerm] = useState('');
  const [showGameModal, setShowGameModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [gameFormData, setGameFormData] = useState(initialGameFormState);

  // ===== User Management Effects & Handlers =====

  /**
   * Fetches all users from the API
   * Updates the users state and handles loading/error states
   */
  const fetchUsers = useCallback(async () => {
    try {
      setUserLoading(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      setUserError('');
    } catch (err) {
      setUserError(err.message || 'Failed to load users. Please try again later.');
      console.error("User fetch error:", err);
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Filters users based on search term
   * Matches against username and email
   */
  const filteredUsers = users.filter(user =>
    (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  /**
   * Handles user search input changes
   * @param {Event} e - The input change event
   */
  const handleUserSearch = (e) => {
    setUserSearchTerm(e.target.value);
  };

  /**
   * Opens the user edit modal and populates form data
   * @param {Object} user - The user to edit
   */
  const handleUserEditClick = (user) => {
    setSelectedUser(user);
    setUserEditFormData({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setShowUserEditModal(true);
    setUserError('');
  };

  /**
   * Opens the user balance modal and sets initial balance
   * @param {Object} user - The user to update balance for
   */
  const handleUserBalanceClick = (user) => {
    setSelectedUser(user);
    setUserBalanceAmount(user.balance || 0);
    setShowUserBalanceModal(true);
    setUserError('');
  };

  /**
   * Handles changes in the user edit form
   * @param {Event} e - The form change event
   */
  const handleUserEditFormChange = (e) => {
    const { name, value } = e.target;
    setUserEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles changes in the user balance input
   * @param {Event} e - The input change event
   */
  const handleUserBalanceChange = (e) => {
    setUserBalanceAmount(parseFloat(e.target.value) || 0);
  };

  /**
   * Submits user edit form and updates user data
   * Handles success and error states
   */
  const handleUserEditSubmit = async () => {
    try {
      setUserLoading(true);
      setUserError('');

      await userService.updateUser(selectedUser.id, userEditFormData);

      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, ...userEditFormData } : user
      ));

      setShowUserEditModal(false);
    } catch (err) {
      setUserError(err.message || 'Failed to update user. Please try again.');
      console.error("User update error:", err);
    } finally {
      setUserLoading(false);
    }
  };

  /**
   * Submits user balance update
   * Updates user balance in the list and handles errors
   */
  const handleUserBalanceSubmit = async () => {
    try {
      setUserLoading(true);
      setUserError('');
      
      await userService.updateUserBalance(selectedUser.id, userBalanceAmount);

      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, balance: userBalanceAmount } : user
      ));

      setShowUserBalanceModal(false);
    } catch (err) {
      setUserError(err.message || 'Failed to update user balance. Please try again.');
      console.error("Balance update error:", err);
    } finally {
      setUserLoading(false);
    }
  };

  /**
   * Deletes a user after confirmation
   * @param {number} userId - The ID of the user to delete
   */
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUserLoading(true);
      setUserError('');
      try {
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        setUserError(err.message || 'Failed to delete user. Please try again.');
        console.error("User delete error:", err);
      } finally {
        setUserLoading(false);
      }
    }
  };

  // ===== Game Management Effects & Handlers =====

  /**
   * Fetches all games from the API
   * Updates the games state and handles loading/error states
   */
  const fetchGames = useCallback(async () => {
    try {
      setGameLoading(true);
      const gamesData = await gameService.getAllGames();
      setGames(gamesData || []);
      setGameError('');
    } catch (err) {
      setGameError(err.message || 'Failed to load games. Please try again later.');
      console.error("Game fetch error:", err);
      setGames([]);
    } finally {
      setGameLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  /**
   * Filters games based on search term
   * Matches against name and description
   */
  const filteredGames = games.filter(game =>
    (game.name && game.name.toLowerCase().includes(gameSearchTerm.toLowerCase())) ||
    (game.description && game.description.toLowerCase().includes(gameSearchTerm.toLowerCase()))
  );

  /**
   * Handles game search input changes
   * @param {Event} e - The input change event
   */
  const handleGameSearch = (e) => {
    setGameSearchTerm(e.target.value);
  };

  /**
   * Opens the add game modal with initial state
   */
  const handleShowAddModal = () => {
    setSelectedGame(null);
    setIsEditMode(false);
    setGameFormData(initialGameFormState);
    setShowGameModal(true);
    setGameError('');
  };

  /**
   * Opens the edit game modal with game data
   * @param {Object} game - The game to edit
   */
  const handleShowEditModal = (game) => {
    setSelectedGame(game);
    setIsEditMode(true);
    setGameFormData({
      name: game.name,
      description: game.description
    });
    setShowGameModal(true);
    setGameError('');
  };

  /**
   * Closes the game modal and resets state
   */
  const handleCloseGameModal = () => {
    setShowGameModal(false);
    setSelectedGame(null);
    setGameError('');
  };

  /**
   * Handles changes in the game form
   * @param {Event} e - The form change event
   */
  const handleGameFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGameFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  /**
   * Submits game form for create/update
   * Handles validation and error states
   * @param {Event} e - The form submit event
   */
  const handleGameSubmit = async (e) => {
    e.preventDefault();
    setGameLoading(true);
    setGameError('');

    if (!gameFormData.name || !gameFormData.description) {
      setGameError("Name and description are required.");
      setGameLoading(false);
      return;
    }

    try {
      if (isEditMode && selectedGame) {
        await gameService.updateGame(selectedGame.id, {
          id: selectedGame.id,
          ...gameFormData
        });
      } else {
        await gameService.addGame(gameFormData);
      }
      await fetchGames();
      handleCloseGameModal();
    } catch (err) {
      setGameError(err.message || 'Failed to save game. Please check the details.');
    } finally {
      setGameLoading(false);
    }
  };

  /**
   * Deletes a game after confirmation
   * @param {number} gameId - The ID of the game to delete
   */
  const handleDeleteGame = async (gameId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      setGameLoading(true);
      setGameError('');
      try {
        await gameService.deleteGame(gameId);
        await fetchGames();
      } catch (err) {
        setGameError(err.message || 'Failed to delete game.');
        console.error("Game delete error:", err);
      } finally {
        setGameLoading(false);
      }
    }
  };

  // ===== Render Functions =====

  /**
   * Renders loading state when no data is available
   */
  if (userLoading && users.length === 0 && gameLoading && games.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading management data...</p>
      </Container>
    );
  }

  return (
    <Container>
      {/* --- User Management Section --- */}
      <h2 className="text-center mb-4"><FaUser className="me-2"/>User Management</h2> {/* Added User icon */}

      {/* Note: Error is now userError */}
      {userError && <Alert variant="danger">{userError}</Alert>}

      <div className="d-flex justify-content-between mb-3">
        <Form.Group style={{ width: '300px' }}>
          <div className="position-relative">
            {/* Note: SearchTerm is now userSearchTerm */}
            <Form.Control
              type="text"
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={handleUserSearch} // Use handleUserSearch
            />
            <FaSearch style={{ position: 'absolute', right: '10px', top: '10px', color: '#aaa' }} />
          </div>
        </Form.Group>

        {/* Note: Loading is now userLoading */}
        <Button variant="primary2" onClick={fetchUsers} disabled={userLoading}> {/* Use secondary for refresh */}
          {userLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Refresh Users'} {/* Differentiate refresh button */}
        </Button>
      </div>

      {/* User Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Balance</th>
            <th>Registration Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <Badge bg={user.role === 'ADMIN' ? 'danger' : 'info'}>
                    {user.role}
                  </Badge>
                </td>
                <td>${user.balance?.toFixed(2) || '0.00'}</td>
                <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2 mb-1" // Added mb-1 for stacking on small screens
                    onClick={() => handleUserEditClick(user)} // Use handleUserEditClick
                  >
                    <FaUserEdit /> Edit
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2 mb-1" // Added me-2 for horizontal spacing
                    onClick={() => handleUserBalanceClick(user)}
                  >
                    <FaCoins /> Balance
                  </Button>
                  {/* Add Delete Button */}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="mb-1"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <FaTrashAlt /> Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                {userSearchTerm ? 'No users found matching your search.' : 'No users available.'} {/* Use userSearchTerm */}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* User Edit Modal */}
      <Modal show={showUserEditModal} onHide={() => setShowUserEditModal(false)} backdrop="static" keyboard={false}> {/* Use showUserEditModal */}
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); handleUserEditSubmit(); }}> {/* Added onSubmit */}
          <Modal.Body>
             {userError && showUserEditModal && <Alert variant="danger">{userError}</Alert>} {/* Show user modal error */}
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={userEditFormData.username} // Use userEditFormData
                onChange={handleUserEditFormChange} // Use handleUserEditFormChange
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={userEditFormData.email} // Use userEditFormData
                onChange={handleUserEditFormChange} // Use handleUserEditFormChange
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={userEditFormData.role} // Use userEditFormData
                onChange={handleUserEditFormChange} // Use handleUserEditFormChange
                required
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserEditModal(false)}> {/* Use setShowUserEditModal */}
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={userLoading}> {/* Use type=submit, userLoading */}
               {userLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Save Changes'} {/* userLoading */}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Balance Modal */}
      <Modal show={showUserBalanceModal} onHide={() => setShowUserBalanceModal(false)} backdrop="static" keyboard={false}> {/* Use showUserBalanceModal */}
        <Modal.Header closeButton>
          <Modal.Title>Update Balance</Modal.Title>
        </Modal.Header>
         <Form onSubmit={(e) => { e.preventDefault(); handleUserBalanceSubmit(); }}> {/* Added onSubmit */}
          <Modal.Body>
            {userError && showUserBalanceModal && <Alert variant="danger">{userError}</Alert>} {/* Show user modal error */}
            <p>Update balance for user: <strong>{selectedUser?.username}</strong></p> {/* selectedUser is fine */}
            <Form.Group className="mb-3">
              <Form.Label>Balance Amount ($)</Form.Label>
              <Form.Control
                type="number"
                value={userBalanceAmount} // Use userBalanceAmount
                onChange={handleUserBalanceChange} // Use handleUserBalanceChange
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUserBalanceModal(false)}> {/* Use setShowUserBalanceModal */}
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={userLoading}> {/* Use type=submit, userLoading */}
              {userLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Update Balance'} {/* userLoading */}
            </Button>
          </Modal.Footer>
         </Form>
      </Modal>


      {/* --- Visual Separator --- */}
      <hr className="my-5" /> {/* Add a horizontal rule with margin */}

      {/* --- Game Management Section --- */}
      <h2 className="text-center mb-4"><FaGamepad className="me-2"/>Game Management</h2> {/* Added Gamepad icon */}

      {/* Note: Error is now gameError */}
      {gameError && !showGameModal && <Alert variant="danger">{gameError}</Alert>} {/* Show general game errors */}

      <div className="d-flex justify-content-between mb-3">
        <Form.Group style={{ width: '300px' }}>
          <div className="position-relative">
            {/* Note: SearchTerm is now gameSearchTerm */}
            <Form.Control
              type="text"
              placeholder="Search games by name, description..."
              value={gameSearchTerm}
              onChange={handleGameSearch} // Use handleGameSearch
            />
            <FaSearch style={{ position: 'absolute', right: '10px', top: '10px', color: '#aaa' }} />
          </div>
        </Form.Group>
        <div>
          <Button variant="primary2" onClick={handleShowAddModal} className="me-2">
            <FaPlus /> Add Game
          </Button>
          {/* Note: Loading is now gameLoading */}
          <Button variant="secondary" onClick={fetchGames} disabled={gameLoading}>
            {gameLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Refresh Games'} {/* Differentiate refresh button */}
          </Button>
        </div>
      </div>

      {/* Game Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>{game.name}</td>
                <td>{game.description?.substring(0, 50)}{game.description?.length > 50 ? '...' : ''}</td>
                <td>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2 mb-1" // Added mb-1
                    onClick={() => handleShowEditModal(game)} // Use handleShowEditModal
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                     className="mb-1" // Added mb-1
                    onClick={() => handleDeleteGame(game.id)} // Use handleDeleteGame
                  >
                    <FaTrashAlt /> Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                {gameSearchTerm ? 'No games found matching your search.' : 'No games available. Try adding one!'} {/* Use gameSearchTerm */}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Game Add/Edit Modal */}
      {/* Note: Modal show state is showGameModal, form data is gameFormData etc. */}
      <Modal show={showGameModal} onHide={handleCloseGameModal} backdrop="static" keyboard={false}> {/* Use showGameModal */}
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit Game' : 'Add New Game'}</Modal.Title> {/* Use isEditMode */}
        </Modal.Header>
        <Form onSubmit={handleGameSubmit}> {/* Use handleGameSubmit */}
          <Modal.Body>
            {gameError && showGameModal && <Alert variant="danger">{gameError}</Alert>} {/* Show game modal-specific errors */}
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={gameFormData.name} // Use gameFormData
                onChange={handleGameFormChange} // Use handleGameFormChange
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={gameFormData.description} // Use gameFormData
                onChange={handleGameFormChange} // Use handleGameFormChange
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseGameModal}> {/* Use handleCloseGameModal */}
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={gameLoading}> {/* Use type=submit, gameLoading */}
              {gameLoading ? <Spinner as="span" animation="border" size="sm" /> : (isEditMode ? 'Save Changes' : 'Add Game')} {/* Use gameLoading, isEditMode */}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Container>
  );
};

export default UserManagement; // The component name remains UserManagement, but it now manages both