import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaUserEdit, FaCoins, FaTrash, FaSearch } from 'react-icons/fa';
import userService from '../../services/userService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    rol: 'USER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
      setError('');
    } catch (err) {
      setError('Failed to load users. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      rol: user.rol
    });
    setShowEditModal(true);
  };

  const handleBalanceClick = (user) => {
    setSelectedUser(user);
    setBalanceAmount(user.balance);
    setShowBalanceModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleBalanceChange = (e) => {
    setBalanceAmount(parseFloat(e.target.value));
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      await userService.updateUser(selectedUser.id, editFormData);
      
      // Update user in the list
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, ...editFormData } : user
      ));
      
      setShowEditModal(false);
      setError('');
    } catch (err) {
      setError('Failed to update user. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceSubmit = async () => {
    try {
      setLoading(true);
      await userService.updateUserBalance(selectedUser.id, balanceAmount);
      
      // Update user balance in the list
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, balance: balanceAmount } : user
      ));
      
      setShowBalanceModal(false);
      setError('');
    } catch (err) {
      setError('Failed to update user balance. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading users...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-center mb-4">User Management</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between mb-3">
        <Form.Group className="mb-3" style={{ width: '300px' }}>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <FaSearch style={{ position: 'absolute', right: '10px', top: '10px', color: '#aaa' }} />
          </div>
        </Form.Group>
        
        <Button variant="primary" onClick={fetchUsers}>
          Refresh
        </Button>
      </div>
      
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
                    className="me-2"
                    onClick={() => handleEditClick(user)}
                  >
                    <FaUserEdit /> Edit
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => handleBalanceClick(user)}
                  >
                    <FaCoins /> Balance
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                {searchTerm ? 'No users found matching your search.' : 'No users available.'}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={editFormData.username}
                onChange={handleEditFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="rol"
                value={editFormData.rol}
                onChange={handleEditFormChange}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Edit Balance Modal */}
      <Modal show={showBalanceModal} onHide={() => setShowBalanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Balance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Update balance for user: <strong>{selectedUser?.username}</strong></p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Balance Amount ($)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="10"
                value={balanceAmount}
                onChange={handleBalanceChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBalanceModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleBalanceSubmit}>
            Update Balance
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
