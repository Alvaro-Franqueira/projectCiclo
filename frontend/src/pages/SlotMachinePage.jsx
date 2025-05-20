import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import SlotMachine from '../components/games/SlotMachine';
import gameService from '../services/gameService';

const SlotMachinePage = () => {
  const [gameInfo, setGameInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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
          name: 'Slot Machine',
          description: 'Try your luck with our classic slot machine game! Match symbols to win big prizes.'
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
    <div className="slot-machine-page">
        <Row className="justify-content-center mb-4">
          <Col md={10}>
            <div className="header-card">
              <h1>
                {gameInfo?.name}
              </h1>
              <p>
                {gameInfo?.description}
              </p>
            </div>
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
                <h3>How to Play</h3>
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
    </div>
  );
};

export default SlotMachinePage; 