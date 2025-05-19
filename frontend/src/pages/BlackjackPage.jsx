import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Card } from 'react-bootstrap';
import Blackjack from '../components/games/blackjack/Blackjack';
import { useAuth } from '../context/AuthContext';
import gameService from '../services/gameService';

const BlackjackPage = () => {
  const { isAuthenticated } = useAuth();
  const [gameInfo, setGameInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        setLoading(true);
        // Try to fetch game info from backend if it exists
        const gameData = await gameService.getGameByName('Blackjack');
        setGameInfo(gameData);
      } catch (err) {
        console.log('Game info not available from API, using default');
        // Set default game info if not available from API
        setGameInfo({
          nombre: 'Blackjack',
          descripcion: 'Classic card game where the objective is to get a hand total of 21 or as close as possible without going over.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGameInfo();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <div className="blackjack-page" style={{ 
      background: 'linear-gradient(to bottom, #003300, #006600)',
      minHeight: '90vh',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      position: 'relative'
    }}>
      <Container>
        <Row className="justify-content-center mb-4">
          <Col md={10}>
          <div className="text-center" style={{ 
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        border: '2px solid gold'
    }}>
        <h1 className="text-center mb-3" style={{ 
        color: 'gold', 
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
        fontFamily: '"Playfair Display", serif'
        }}>
        {gameInfo?.name || 'Slot Machine'}
        </h1>
        <p className="text-center" style={{ color: 'white' }}>
        {gameInfo?.description || 'Try your luck with our classic slot machine game! Match symbols to win big prizes.'}
        </p>
    </div>

            {!isAuthenticated && (
              <Alert variant="warning" className="text-center">
                Please log in to play and save your progress.
              </Alert>
            )}
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col md={10}>
            <Blackjack />
          </Col>
        </Row>

        <Row className="justify-content-center mt-4">
          <Col md={10}>
            <Card className="shadow" style={{ 
              background: 'rgba(0, 0, 0, 0.7)', 
              color: 'white', 
              borderRadius: '10px',
              border: '1px solid gold'
            }}>
              <Card.Body>
                <h3 className="mb-3" style={{ color: 'gold', borderBottom: '1px solid rgba(255, 215, 0, 0.3)', paddingBottom: '10px' }}>How to Play</h3>
                <ul style={{ paddingLeft: '20px' }}>
                  <li className="mb-2">Place your bet to start a new game</li>
                  <li className="mb-2">Try to get a hand value as close to 21 as possible without going over</li>
                  <li className="mb-2">Face cards (J, Q, K) are worth 10 points</li>
                  <li className="mb-2">Aces are worth 1 or 11 points, whichever benefits you more</li>
                  <li className="mb-2">Hit to draw another card</li>
                  <li className="mb-2">Stand to keep your current hand and let the dealer play</li>
                  <li className="mb-2">If your hand exceeds 21, you bust and lose your bet</li>
                  <li className="mb-2">The dealer must hit until they have at least 17 points</li>
                  <li className="mb-2">If your hand is closer to 21 than the dealer's, you win</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BlackjackPage; 