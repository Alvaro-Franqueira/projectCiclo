// src/components/admin/GameManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Form, Modal, Alert, Spinner, Badge, Image } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaSearch, FaPlus, FaGamepad } from 'react-icons/fa';
import gameService from '../../services/gameService'; // Adjust path as needed

const GameManagement = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null); // For editing
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    urlImagen: '',
    precio: 0,
    genero: ''
  });

  const initialFormState = {
    nombre: '',
    descripcion: '',
    urlImagen: '',
    precio: 0,
    genero: ''
  };

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const gamesData = await gameService.getAllGames();
      setGames(gamesData || []); // Ensure gamesData is an array
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load games. Please try again later.');
      console.error(err);
      setGames([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredGames = games.filter(game =>
    (game.nombre && game.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (game.descripcion && game.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (game.genero && game.genero.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleShowAddModal = () => {
    setSelectedGame(null);
    setIsEditMode(false);
    setFormData(initialFormState);
    setShowModal(true);
    setError(''); // Clear previous modal errors
  };

  const handleShowEditModal = (game) => {
    setSelectedGame(game);
    setIsEditMode(true);
    setFormData({
      nombre: game.nombre,
      descripcion: game.descripcion,
      urlImagen: game.urlImagen || '',
      precio: game.precio || 0,
      genero: game.genero || ''
    });
    setShowModal(true);
    setError(''); // Clear previous modal errors
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGame(null);
    setError(''); // Clear errors when modal closes
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    // Basic validation
    if (!formData.nombre || !formData.descripcion || formData.precio < 0) {
        setError("Name, description are required, and price cannot be negative.");
        setLoading(false);
        return;
    }

    try {
      if (isEditMode && selectedGame) {
        await gameService.updateGame(selectedGame.id, formData);
      } else {
        await gameService.addGame(formData);
      }
      await fetchGames(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      setError(err.message || 'Failed to save game. Please check the details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      setLoading(true);
      setError('');
      try {
        await gameService.deleteGame(gameId);
        await fetchGames(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to delete game.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && games.length === 0) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading games...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-center mb-4">Game Management <FaGamepad /></h2>

      {error && !showModal && <Alert variant="danger">{error}</Alert>} {/* Show general errors here */}

      <div className="d-flex justify-content-between mb-3">
        <Form.Group style={{ width: '300px' }}>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder="Search games by name, description, genre..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <FaSearch style={{ position: 'absolute', right: '10px', top: '10px', color: '#aaa' }} />
          </div>
        </Form.Group>
        <div>
          <Button variant="primary" onClick={handleShowAddModal} className="me-2">
            <FaPlus /> Add Game
          </Button>
          <Button variant="secondary" onClick={fetchGames} disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Genre</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>
                  {game.urlImagen ? (
                    <Image src={game.urlImagen} alt={game.nombre} thumbnail style={{ width: '70px', height: 'auto' }} />
                  ) : (
                    <div style={{ width: '70px', height: '50px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>
                      No Image
                    </div>
                  )}
                </td>
                <td>{game.nombre}</td>
                <td>{game.descripcion?.substring(0, 50)}{game.descripcion?.length > 50 ? '...' : ''}</td>
                <td>${game.precio?.toFixed(2) || '0.00'}</td>
                <td><Badge bg="secondary">{game.genero || 'N/A'}</Badge></td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2 mb-1"
                    onClick={() => handleShowEditModal(game)}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="mb-1"
                    onClick={() => handleDeleteGame(game.id)}
                  >
                    <FaTrashAlt /> Delete
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                {searchTerm ? 'No games found matching your search.' : 'No games available. Try adding one!'}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add/Edit Game Modal */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Edit Game' : 'Add New Game'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && showModal && <Alert variant="danger">{error}</Alert>} {/* Show modal-specific errors here */}
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="text"
                name="urlImagen"
                placeholder="https://example.com/image.png"
                value={formData.urlImagen}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price ($) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                name="precio"
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Genre</Form.Label>
              <Form.Control
                type="text"
                name="genero"
                value={formData.genero}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : (isEditMode ? 'Save Changes' : 'Add Game')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default GameManagement;