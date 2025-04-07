import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { PiPokerChipFill } from "react-icons/pi";
import betService from '../../services/betService';
import authService from '../../services/authService';

const RouletteGame = () => {
  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState('color');
  const [betValue, setBetValue] = useState('red');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [customNumber, setCustomNumber] = useState(1);

  // Roulette wheel numbers and colors
  const rouletteNumbers = Array.from({ length: 37 }, (_, i) => i); // 0-36
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  useEffect(() => {
    // Get user balance
    const userData = authService.getUserData();
    setUserBalance(userData.balance || 0);

    // Get user bet history
    const fetchBetHistory = async () => {
      try {
        const userId = userData.id;
        if (userId) {
          const bets = await betService.getUserBets(userId);
          // Filter only roulette bets and take the last 5
          const rouletteBets = bets
            .filter(bet => bet.juego && bet.juego.nombre.toLowerCase().includes('roulette'))
            .slice(0, 5);
          setHistory(rouletteBets);
        }
      } catch (error) {
        console.error('Failed to fetch bet history:', error);
      }
    };

    fetchBetHistory();
  }, []);

  const getNumberColor = (number) => {
    if (number === 0) return 'green';
    if (redNumbers.includes(number)) return 'red';
    return 'black';
  };

  const handleBetAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > 0 && value <= userBalance) {
      setBetAmount(value);
    }
  };

  const handleBetTypeChange = (e) => {
    const type = e.target.value;
    setBetType(type);
    
    // Set default values based on bet type
    if (type === 'color') {
      setBetValue('red');
    } else if (type === 'evenOdd') {
      setBetValue('even');
    } else if (type === 'highLow') {
      setBetValue('high');
    } else if (type === 'dozen') {
      setBetValue('first');
    } else if (type === 'column') {
      setBetValue('first');
    } else if (type === 'number') {
      setBetValue(customNumber.toString());
    }
  };

  const handleCustomNumberChange = (e) => {
    const num = parseInt(e.target.value);
    if (num >= 0 && num <= 36) {
      setCustomNumber(num);
      if (betType === 'number') {
        setBetValue(num.toString());
      }
    }
  };

  const placeBet = async () => {
    if (betAmount <= 0 || betAmount > userBalance) {
      setMessage('Invalid bet amount');
      setMessageType('danger');
      return;
    }

    try {
      setIsSpinning(true);
      setMessage('Spinning the wheel...');
      setMessageType('info');

      // Prepare bet data
      const userData = authService.getUserData();
      const betData = {
        usuario: { id: userData.id },
        juego: { id: 1 }, // Assuming roulette game ID is 1
        cantidad: betAmount,
        tipo: betType,
        valor: betValue
      };

      // Place the bet
      const newBet = await betService.createBet(betData);
      
      // Simulate wheel spinning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate random result (this would come from the backend in a real implementation)
      const randomNumber = Math.floor(Math.random() * 37); // 0-36
      const resultColor = getNumberColor(randomNumber);
      const isEven = randomNumber !== 0 && randomNumber % 2 === 0;
      const isHigh = randomNumber > 18;
      
      // Determine if bet won
      let won = false;
      
      if (betType === 'color') {
        won = betValue === resultColor;
      } else if (betType === 'evenOdd') {
        won = (betValue === 'even' && isEven) || (betValue === 'odd' && !isEven && randomNumber !== 0);
      } else if (betType === 'highLow') {
        won = (betValue === 'high' && isHigh) || (betValue === 'low' && !isHigh && randomNumber !== 0);
      } else if (betType === 'dozen') {
        const dozen = randomNumber === 0 ? -1 : Math.floor((randomNumber - 1) / 12);
        won = (betValue === 'first' && dozen === 0) || 
              (betValue === 'second' && dozen === 1) || 
              (betValue === 'third' && dozen === 2);
      } else if (betType === 'column') {
        const column = randomNumber === 0 ? -1 : (randomNumber - 1) % 3;
        won = (betValue === 'first' && column === 0) || 
              (betValue === 'second' && column === 1) || 
              (betValue === 'third' && column === 2);
      } else if (betType === 'number') {
        won = betValue === randomNumber.toString();
      }
      
      // Update result
      setResult({
        number: randomNumber,
        color: resultColor,
        won: won
      });
      
      // Update message
      if (won) {
        setMessage(`You won! The number is ${randomNumber} (${resultColor})`);
        setMessageType('success');
        
        // Update user balance (this would be handled by the backend in reality)
        const winnings = betType === 'number' ? betAmount * 35 : betAmount * 2;
        setUserBalance(prevBalance => prevBalance + winnings);
      } else {
        setMessage(`You lost. The number is ${randomNumber} (${resultColor})`);
        setMessageType('danger');
        setUserBalance(prevBalance => prevBalance - betAmount);
      }
      
      // Update history
      const updatedBet = {
        ...newBet,
        estado: won ? 'GANADA' : 'PERDIDA',
        winloss: won ? betAmount : -betAmount
      };
      setHistory(prev => [updatedBet, ...prev.slice(0, 4)]);
      
    } catch (error) {
      setMessage('Error placing bet: ' + (error.message || 'Unknown error'));
      setMessageType('danger');
    } finally {
      setIsSpinning(false);
    }
  };

  const renderBetValueOptions = () => {
    switch (betType) {
      case 'color':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <Form.Select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
              <option value="red">Red</option>
              <option value="black">Black</option>
            </Form.Select>
          </Form.Group>
        );
      case 'evenOdd':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Even/Odd</Form.Label>
            <Form.Select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
              <option value="even">Even</option>
              <option value="odd">Odd</option>
            </Form.Select>
          </Form.Group>
        );
      case 'highLow':
        return (
          <Form.Group className="mb-3">
            <Form.Label>High/Low</Form.Label>
            <Form.Select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
              <option value="high">High (19-36)</option>
              <option value="low">Low (1-18)</option>
            </Form.Select>
          </Form.Group>
        );
      case 'dozen':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Dozen</Form.Label>
            <Form.Select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
              <option value="first">First (1-12)</option>
              <option value="second">Second (13-24)</option>
              <option value="third">Third (25-36)</option>
            </Form.Select>
          </Form.Group>
        );
      case 'column':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Column</Form.Label>
            <Form.Select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
              <option value="first">First Column</option>
              <option value="second">Second Column</option>
              <option value="third">Third Column</option>
            </Form.Select>
          </Form.Group>
        );
      case 'number':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Number (0-36)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="36"
              value={customNumber}
              onChange={handleCustomNumberChange}
            />
          </Form.Group>
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <h2 className="text-center mb-4">
        <PiPokerChipFill className="me-2" />
        Roulette
      </h2>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Place Your Bet</h5>
                <Badge bg="success" className="p-2">
                  Balance: ${userBalance.toFixed(2)}
                </Badge>
              </div>
              
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bet Amount ($)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        step="1"
                        value={betAmount}
                        onChange={handleBetAmountChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bet Type</Form.Label>
                      <Form.Select value={betType} onChange={handleBetTypeChange}>
                        <option value="color">Color</option>
                        <option value="evenOdd">Even/Odd</option>
                        <option value="highLow">High/Low</option>
                        <option value="dozen">Dozen</option>
                        <option value="column">Column</option>
                        <option value="number">Single Number</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                {renderBetValueOptions()}
                
                <Button 
                  variant="primary" 
                  className="w-100" 
                  onClick={placeBet}
                  disabled={isSpinning || betAmount <= 0 || betAmount > userBalance}
                >
                  {isSpinning ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Spinning...
                    </>
                  ) : (
                    'Spin the Wheel'
                  )}
                </Button>
              </Form>
              
              {message && (
                <Alert variant={messageType} className="mt-3">
                  {message}
                </Alert>
              )}
              
              {result && (
                <div className="text-center mt-4">
                  <div 
                    className="roulette-result mx-auto mb-2"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: result.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: result.color === 'black' ? 'white' : result.color === 'red' ? 'white' : 'black',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}
                  >
                    {result.number}
                  </div>
                  <h5>{result.won ? 'You Won!' : 'You Lost'}</h5>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>Recent Bets</Card.Header>
            <Card.Body>
              {history.length > 0 ? (
                <div>
                  {history.map((bet, index) => (
                    <div key={index} className="mb-2 p-2 border-bottom">
                      <div className="d-flex justify-content-between">
                        <span>
                          {bet.tipo} - {bet.valor}
                        </span>
                        <Badge bg={bet.estado === 'GANADA' ? 'success' : 'danger'}>
                          {bet.estado === 'GANADA' ? '+' : '-'}${bet.cantidad}
                        </Badge>
                      </div>
                      <small className="text-muted">
                        {new Date(bet.fechaApuesta).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted">No recent bets</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RouletteGame;
