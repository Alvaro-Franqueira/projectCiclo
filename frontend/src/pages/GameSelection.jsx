import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaDice, FaDiceD6, FaCircleNotch, FaGem, FaCoins } from 'react-icons/fa';
import rouletteImg from '../components/images/rouletteimg.png';


import gameService from '../services/gameService';
import { GiRollingDices } from "react-icons/gi";

import Icon from '@mdi/react';
import { mdiSlotMachineOutline } from '@mdi/js';
import pokerChip from '../components/images/poker-chip.png';
import blackjackImg from '../components/images/blackjack-white.png';
import sportBettingImg from '../components/images/betting.png';
import '../assets/styles/GameSelection.css';

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
    if (name.includes('roulette')) return <img src={rouletteImg} alt="Roulette Icon" width={140} height={100} className="game-icon" />;

    if (name.includes('dice')) return <GiRollingDices size={70} className="game-icon dice-icon" />;
  
    if (name.includes('slot machine') || name.includes('tragaperras')) return <Icon path={mdiSlotMachineOutline} size={3} className="game-icon slot-icon" />;  
    
    if (name.includes('blackjack')) return <img src={blackjackImg} alt="Blackjack Icon" width={80} height={80} className="game-icon" />;

    if (name.includes('poker')) return <img src={pokerChip} alt="Poker Icon" width={65} height={65} className="game-icon" />;
    
    if (name.includes('sports betting')) return <img src={sportBettingImg} alt="Sports Betting Icon" width={80} height={80} className="game-icon" />;
    return <FaGem size={50} className="game-icon gem-icon" />;
  };

  if (loading) {
    return (
      <Container className="text-center mt-5 game-selection-loading">
        <div className="spinner-container">
          <Spinner animation="border" className="gold-spinner" />
          <div className="spinner-light spinner-light-1"></div>
          <div className="spinner-light spinner-light-2"></div>
          <div className="spinner-light spinner-light-3"></div>
          <div className="spinner-light spinner-light-4"></div>
        </div>
        <p className="mt-3 loading-text">Loading games...</p>
      </Container>
    );
  }

  return (
    <div className="game-selection-container">
      {/* Decorative elements */}
      <div className="corner-decoration corner-top-left"></div>
      <div className="corner-decoration corner-top-right"></div>
      <div className="corner-decoration corner-bottom-left"></div>
      <div className="corner-decoration corner-bottom-right"></div>
      
      <Container className="py-4">
        <div>
          <h2 className="text-center mb-4">
            <FaCoins className="title-icon me-2" />
            Select a Game
          </h2>
        </div>
        
        {error && <Alert variant="danger" className="custom-alert">{error}</Alert>}
        
        <Row className="g-4 justify-content-center">
          {games.map((game) => (
            <Col key={game.id} md={6} lg={4}>
              <Card className="game-card">
                <div className="card-light card-light-top-left"></div>
                <div className="card-light card-light-top-right"></div>
                <div className="card-light card-light-bottom-left"></div>
                <div className="card-light card-light-bottom-right"></div>
                
                <Card.Body className="d-flex flex-column game-card-body">
                  <div 
                      className="text-center mb-3 game-icon-container" 
                      onClick={() => navigate(`/games/${game.name.replace(/\s+/g, '')}`)}
                  >
                    {getGameIcon(game.name)}
                  </div>
                  <Card.Title className="game-title">{game.name}</Card.Title>
                  <Card.Text className="game-description">{game.description}</Card.Text>
                  <Button 
                    className="play-now-btn mt-auto"
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
    </div>
  );
};

export default GameSelection;
