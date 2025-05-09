import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Card } from 'react-bootstrap';
import SlotMachine from '../components/games/slotmachine/SlotMachine';
import { useAuth } from '../context/AuthContext';
import gameService from '../services/gameService';

const SlotMachinePage = () => {
  const { isAuthenticated } = useAuth();
  const [gameInfo, setGameInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        setLoading(true);
        // Try to fetch game info from backend if it exists
        const gameData = await gameService.getGameByName('Slot Machine');
        setGameInfo(gameData);
      } catch (err) {
        console.log('Game info not available from API, using default');
        // Set default game info if not available from API
        setGameInfo({
          nombre: 'Slot Machine',
          descripcion: 'Try your luck with our classic slot machine game! Match symbols to win big prizes.'
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
    <div className="slot-machine-page" style={{ 
      background: 'linear-gradient(to bottom, #000428, #004e92)',
      minHeight: '90vh',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      position: 'relative'
    }}>
      {/* Decorative elements */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1 }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          background: 'linear-gradient(to bottom right, #FFD700, #FFA500)', 
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.7)'
        }}></div>
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 1 }}>
        <div style={{ 
          width: '70px', 
          height: '70px', 
          borderRadius: '50%', 
          background: 'linear-gradient(to bottom right, #FF416C, #FF4B2B)', 
          boxShadow: '0 0 20px rgba(255, 75, 43, 0.7)'
        }}></div>
      </div>

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
                {gameInfo?.nombre || 'Slot Machine'}
              </h1>
              <p className="text-center" style={{ color: 'white' }}>
                {gameInfo?.descripcion || 'Try your luck with our classic slot machine game! Match symbols to win big prizes.'}
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
            <SlotMachine />
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
                  <li className="mb-2">Select your bet amount using the + and - buttons</li>
                  <li className="mb-2">Click the SPIN button to start the reels</li>
                  <li className="mb-2">Match 3 identical symbols for big wins</li>
                  <li className="mb-2">Three 7s will give you the jackpot (50x your bet)</li>
                  <li className="mb-2">Even a single cherry can win you a prize</li>
                  <li className="mb-2">Your winnings are automatically added to your balance</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SlotMachinePage; 