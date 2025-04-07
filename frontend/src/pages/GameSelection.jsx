import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaDice, FaCircleNotch } from 'react-icons/fa';
import { PiPokerChipFill } from "react-icons/pi";
import gameService from '../services/gameService';

const GameSelection = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gamesData = await gameService.getAllGames();
        setGames(gamesData);
      } catch (err) {
        setError('Failed to load games. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Fallback games if API call fails or no games are available
  const defaultGames = [
    { id: 1, nombre: 'Roulette', descripcion: 'Classic casino roulette game. Place your bets and try your luck!', path: '/games/roulette' },
    { id: 2, nombre: 'Dice', descripcion: 'Roll the dice and win based on your prediction.', path: '/games/dice' }
  ];

  const displayGames = games.length > 0 ? games : defaultGames;

  const getGameIcon = (gameName) => {
    const name = gameName.toLowerCase();
    if (name.includes('roulette')) return <PiPokerChipFill size={40} />;
    if (name.includes('dice')) return <FaDice size={40} />;
    return <FaCircleNotch size={40} />;
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <FaCircleNotch className="fa-spin" size={50} />
        <p className="mt-3">Loading games...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-center mb-4">Select a Game</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="g-4">
        {displayGames.map((game) => (
          <Col key={game.id} md={6} lg={4}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-3">
                  {getGameIcon(game.nombre)}
                </div>
                <Card.Title className="text-center">{game.nombre}</Card.Title>
                <Card.Text className="flex-grow-1">{game.descripcion}</Card.Text>
                <Button 
                  variant="primary" 
                  className="w-100 mt-auto"
                  onClick={() => navigate(game.path || `/games/${game.id}`)}
                >
                  Play Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default GameSelection;
