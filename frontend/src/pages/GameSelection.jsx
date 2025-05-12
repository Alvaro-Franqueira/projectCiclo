import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaDice, FaDiceD6, FaCircleNotch, FaGem } from 'react-icons/fa';
import rouletteImg from '../components/images/rouletteimg.png';


import gameService from '../services/gameService';
import { GiRollingDices } from "react-icons/gi";

import Icon from '@mdi/react';
import { mdiSlotMachineOutline } from '@mdi/js';
import pokerChip from '../components/images/poker-chip.png';
import blackjackImg from '../components/images/blackjack-white.png';
import sportBettingImg from '../components/images/betting.png';

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


  const getGameIcon = (gameName) => {
    const name = gameName.toLowerCase();
    if (name.includes('roulette')) return <img src={rouletteImg} alt="Roulette Icon" width={140} height={100} />;

    if (name.includes('dice')) return <GiRollingDices size={70} color="#3498db" />;
  
    if (name.includes('slot machine') || name.includes('tragaperras')) return <Icon path={mdiSlotMachineOutline} size={3} color="#e74c3c" />;  
    
    if (name.includes('blackjack')) return <img src={blackjackImg} alt="Blackjack Icon" width={80} height={80} />;

    if (name.includes('poker')) return <img src={pokerChip} alt="Poker Icon" width={65} height={65} />;
    
    if (name.includes('sports betting')) return <img src={sportBettingImg} alt="Sports Betting Icon" width={80} height={80} />;
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
      <h2 className="text-center mb-4 ">Select a Game</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="g-4 justify-content-center">
        {games.map((game) => (
          <Col key={game.id} md={6} lg={4}>
            <Card className="h-100 shadow-sm ">
              <Card.Body className="d-flex flex-column">
                <div 
                    className="text-center mb-3 game-icon-container" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => navigate(`/games/${game.name}`)}
                >
                  {getGameIcon(game.name)}
                </div>
                <Card.Title className="text-light">{game.name}</Card.Title>
                <Card.Text className="text-light">{game.description}</Card.Text>
                <Button 
                  className="w-100 mt-auto"
                  onClick={() => navigate(`/games/${game.name.replace(/\s+/g, '')}`)}
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
