import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaDice, FaDiceD6, FaCircleNotch, FaGem } from 'react-icons/fa';
import rouletteImg from '../components/images/rouletteimg.png';


import gameService from '../services/gameService';
import { GiRollingDices } from "react-icons/gi";

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
    { id: 1, nombre: 'Ruleta', descripcion: 'Classic casino roulette game. Place your bets and try your luck!', path: '/games/roulette' },
    { id: 2, nombre: 'Dice', descripcion: 'Roll the dice and win based on your prediction.', path: '/games/dice' }
  ];
  const displayGames = Array.isArray(games) && games.length > 0 ? games : defaultGames;


  const getGameIcon = (gameName) => {
    const name = gameName.toLowerCase();
    if (name.includes('roulette')) return <img src={rouletteImg} alt="Roulette Icon" width={140} height={100} />;


    if (name.includes('dice')) return <GiRollingDices size={70} color="#3498db" />;
    return <FaGem size={50} color="#9b59b6" />;
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
                <div className="text-center mb-3 game-icon-container">
                  {getGameIcon(game.nombre)}
                </div>
                <Card.Title className="text-center text-light">{game.nombre}</Card.Title>
                <Card.Text className="flex-grow-1 text-light">{game.descripcion}</Card.Text>
                <Button 
                  variant="primary" 
                  className="w-100 mt-auto"
                  onClick={() => navigate(game.path || `/games/${game.nombre}`)}
                >
                  Play Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <style>{`
        .game-icon-container {
          background-color: #2c3e50;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </Container>
  );
};

export default GameSelection;
