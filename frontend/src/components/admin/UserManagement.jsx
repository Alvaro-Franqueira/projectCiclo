// src/components/admin/UserManagement.js (or whatever its path is)
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Form, Modal, Alert, Spinner, Badge, Image } from 'react-bootstrap'; // Added Image
import {
  FaUserEdit,
  FaUser,
  FaCoins,
  FaTrash,
  FaSearch, // Use FaSearch for both or differentiate if needed
  FaGamepad, // Added Gamepad icon
  FaPlus,    // Added Plus icon
  FaEdit,    // Added Edit icon
  FaTrashAlt // Added TrashAlt icon
} from 'react-icons/fa';
import userService from '../../services/userService'; // Adjust path as needed
import gameService from '../../services/gameService'; // Import gameService

// --- User Management Section ---
const UserManagement = () => { // NOTE: This component now handles BOTH users and games
  // --- User Management State ---
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true); // Renamed for clarity
  const [userError, setUserError] = useState('');     // Renamed for clarity
  const [userSearchTerm, setUserSearchTerm] = useState(''); // Renamed for clarity
  const [showUserEditModal, setShowUserEditModal] = useState(false); // Renamed for clarity
  const [showUserBalanceModal, setShowUserBalanceModal] = useState(false); // Renamed for clarity
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalanceAmount, setUserBalanceAmount] = useState(0); // Renamed for clarity
  const [userEditFormData, setUserEditFormData] = useState({ // Renamed for clarity
    username: '',
    email: '',
    rol: 'USER'
  });
  // No longer need currentUser state if not used

  // --- User Management Effects & Handlers ---
  const fetchUsers = useCallback(async () => {
    try {
      setUserLoading(true); // Use renamed state
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      setUserError(''); // Use renamed state
    } catch (err) {
      setUserError(err.message || 'Failed to load users. Please try again later.'); // Use renamed state
      console.error("User fetch error:", err);
      setUsers([]); // Clear users on error
    } finally {
      setUserLoading(false); // Use renamed state
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserSearch = (e) => {
    setUserSearchTerm(e.target.value); // Use renamed state
  };

  const filteredUsers = users.filter(user =>
    (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase())) || // Use renamed state
    (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const handleUserEditClick = (user) => {
    setSelectedUser(user);
    setUserEditFormData({ // Use renamed state
      username: user.username,
      email: user.email,
      rol: user.rol
    });
    setShowUserEditModal(true); // Use renamed state
    setUserError(''); // Clear errors on opening modal
  };

  const handleUserBalanceClick = (user) => {
    setSelectedUser(user);
    setUserBalanceAmount(user.balance || 0); // Use renamed state, default to 0
    setShowUserBalanceModal(true); // Use renamed state
    setUserError(''); // Clear errors on opening modal
  };

  const handleUserEditFormChange = (e) => {
    const { name, value } = e.target;
    setUserEditFormData({ // Use renamed state
      ...userEditFormData, // Use renamed state
      [name]: value
    });
  };

  const handleUserBalanceChange = (e) => {
    setUserBalanceAmount(parseFloat(e.target.value) || 0); // Use renamed state, default to 0
  };

  const handleUserEditSubmit = async () => {
    try {
      setUserLoading(true); // Use renamed state
      setUserError(''); // Clear previous errors

      await userService.updateUser(selectedUser.id, userEditFormData); // Use renamed state

      // Update user in the list
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, ...userEditFormData } : user // Use renamed state
      ));

      setShowUserEditModal(false); // Use renamed state
    } catch (err) {
      setUserError(err.message || 'Failed to update user. Please try again.'); // Use renamed state
      console.error("User update error:", err);
    } finally {
      setUserLoading(false); // Use renamed state
    }
  };

  const handleUserBalanceSubmit = async () => {
    try {
      setUserLoading(true); // Use renamed state
      setUserError(''); // Clear previous errors
      console.log('Updating balance for user:', selectedUser.id, 'to:', userBalanceAmount); // Use renamed state
      await userService.updateUserBalance(selectedUser.id, userBalanceAmount); // Use renamed state

      // Update user balance in the list
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, balance: userBalanceAmount } : user // Use renamed state
      ));

      setShowUserBalanceModal(false); // Use renamed state
    } catch (err) {
      setUserError(err.message || 'Failed to update user balance. Please try again.'); // Use renamed state
      console.error("Balance update error:", err);
    } finally {
      setUserLoading(false); // Use renamed state
    }
  };


  // --- Game Management Section ---
  // --- Game Management State ---
  const [games, setGames] = useState([]);
  const [gameLoading, setGameLoading] = useState(true); // New state for game loading
  const [gameError, setGameError] = useState('');     // New state for game errors
  const [gameSearchTerm, setGameSearchTerm] = useState(''); // New state for game search
  const [showGameModal, setShowGameModal] = useState(false); // New state for game modal
  const [selectedGame, setSelectedGame] = useState(null); // New state for selected game (edit)
  const [isEditMode, setIsEditMode] = useState(false); // New state to distinguish add/edit
  const [gameFormData, setGameFormData] = useState({ // New state for game form data
    nombre: '',
    descripcion: '',

  });

  const initialGameFormState = { // New initial state for game form
    nombre: '',
    descripcion: '',
  };

  // --- Game Management Effects & Handlers ---
  const fetchGames = useCallback(async () => {
    try {
      setGameLoading(true); // Use new state
      const gamesData = await gameService.getAllGames();
      setGames(gamesData || []); // Use new state, default to empty array
      setGameError(''); // Use new state
    } catch (err) {
      setGameError(err.message || 'Failed to load games. Please try again later.'); // Use new state
      console.error("Game fetch error:", err);
      setGames([]); // Clear games on error
    } finally {
      setGameLoading(false); // Use new state
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleGameSearch = (e) => {
    setGameSearchTerm(e.target.value); // Use new state
  };

  const filteredGames = games.filter(game =>
    (game.nombre && game.nombre.toLowerCase().includes(gameSearchTerm.toLowerCase())) || // Use new state
    (game.descripcion && game.descripcion.toLowerCase().includes(gameSearchTerm.toLowerCase()))
  );

  const handleShowAddModal = () => {
    setSelectedGame(null);
    setIsEditMode(false);
    setGameFormData(initialGameFormState);
    setShowGameModal(true);
    setGameError(''); // Clear errors on opening modal
  };

  const handleShowEditModal = (game) => {
    setSelectedGame(game);
    setIsEditMode(true);
    setGameFormData({
      nombre: game.nombre,
      descripcion: game.descripcion
    });
    setShowGameModal(true);
    setGameError(''); // Clear errors on opening modal
  };

  const handleCloseGameModal = () => {
    setShowGameModal(false);
    setSelectedGame(null);
    setGameError(''); // Clear errors on closing modal
  };

  const handleGameFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGameFormData({
      ...gameFormData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    });
  };

  const handleGameSubmit = async (e) => {
    e.preventDefault();
    setGameLoading(true); // Use new state
    setGameError(''); // Clear previous errors

    // Basic validation
    if (!gameFormData.nombre || !gameFormData.descripcion) {
        setGameError("Name and description are required.");
        setGameLoading(false);
        return;
    }
    const gameDataToSend = {
      nombre: gameFormData.nombre,
      descripcion: gameFormData.descripcion,
  };
    try {
      if (isEditMode && selectedGame) {
        await gameService.updateGame(selectedGame.id,{id: selectedGame.id, ... gameDataToSend} );
      } else {
        await gameService.addGame(gameFormData);
      }
      await fetchGames(); // Refresh the game list
      handleCloseGameModal();
    } catch (err) {
      setGameError(err.message || 'Failed to save game. Please check the details.'); // Use new state
      console.error("Game submit error:", err);
    } finally {
      setGameLoading(false); // Use new state
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      setGameLoading(true); // Use new state
      setGameError(''); // Clear errors
      try {
        await gameService.deleteGame(gameId);
        await fetchGames(); // Refresh the game list
      } catch (err) {
        setGameError(err.message || 'Failed to delete game.'); // Use new state
        console.error("Game delete error:", err);
      } finally {
        setGameLoading(false); // Use new state
      }
    }
  };

  // --- Combined Render ---
  // Display loading spinner only if NO data for either section is loaded yet
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
        <Button variant="secondary" onClick={fetchUsers} disabled={userLoading}> {/* Use secondary for refresh */}
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
                  <Badge bg={user.rol === 'ADMIN' ? 'danger' : 'info'}>
                    {user.rol}
                  </Badge>
                </td>
                <td>${user.balance?.toFixed(2) || '0.00'}</td>
                <td>{new Date(user.fechaRegistro).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2 mb-1" // Added mb-1 for stacking on small screens
                    onClick={() => handleUserEditClick(user)} // Use handleUserEditClick
                  >
                    <FaUserEdit /> Edit
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="mb-1" // Added mb-1
                    onClick={() => handleUserBalanceClick(user)} // Use handleUserBalanceClick
                  >
                    <FaCoins /> Balance
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
                name="rol"
                value={userEditFormData.rol} // Use userEditFormData
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
              placeholder="Search games by name, description, genre..."
              value={gameSearchTerm}
              onChange={handleGameSearch} // Use handleGameSearch
            />
            <FaSearch style={{ position: 'absolute', right: '10px', top: '10px', color: '#aaa' }} />
          </div>
        </Form.Group>
        <div>
          <Button variant="primary" onClick={handleShowAddModal} className="me-2">
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
                <td>{game.nombre}</td>
                <td>{game.descripcion?.substring(0, 50)}{game.descripcion?.length > 50 ? '...' : ''}</td>
                <td>
                  <Button
                    variant="outline-primary"
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
              <td colSpan="7" className="text-center">
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
                name="nombre"
                value={gameFormData.nombre} // Use gameFormData
                onChange={handleGameFormChange} // Use handleGameFormChange
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={gameFormData.descripcion} // Use gameFormData
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