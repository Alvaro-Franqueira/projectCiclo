import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { FaDice, FaDiceOne, FaDiceTwo, FaDiceThree, FaDiceFour, FaDiceFive, FaDiceSix } from 'react-icons/fa';
import betService from '../../services/betService';
import authService from '../../services/authService';

const DiceGame = () => {
  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState('exact');
  const [predictedValue, setPredictedValue] = useState(6);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [history, setHistory] = useState([]);

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
          // Filter only dice bets and take the last 5
          const diceBets = bets
            .filter(bet => bet.juego && bet.juego.nombre.toLowerCase().includes('dice'))
            .slice(0, 5);
          setHistory(diceBets);
        }
      } catch (error) {
        console.error('Failed to fetch bet history:', error);
      }
    };

    fetchBetHistory();
  }, []);

  const handleBetAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > 0 && value <= userBalance) {
      setBetAmount(value);
    }
  };

  const handleBetTypeChange = (e) => {
    setBetType(e.target.value);
  };

  const handlePredictedValueChange = (e) => {
    setPredictedValue(parseInt(e.target.value));
  };

  const getDiceIcon = (value) => {
    switch (value) {
      case 1: return <FaDiceOne size={50} />;
      case 2: return <FaDiceTwo size={50} />;
      case 3: return <FaDiceThree size={50} />;
      case 4: return <FaDiceFour size={50} />;
      case 5: return <FaDiceFive size={50} />;
      case 6: return <FaDiceSix size={50} />;
      default: return <FaDice size={50} />;
    }
  };

  const placeBet = async () => {
    if (betAmount <= 0 || betAmount > userBalance) {
      setMessage('Invalid bet amount');
      setMessageType('danger');
      return;
    }

    try {
      setIsRolling(true);
      setMessage('Rolling the dice...');
      setMessageType('info');

      // Prepare bet data
      const userData = authService.getUserData();
      const betData = {
        usuario: { id: userData.id },
        juego: { id: 2 }, // Assuming dice game ID is 2
        cantidad: betAmount,
        tipo: betType,
        valor: predictedValue.toString()
      };

      // Place the bet
      const newBet = await betService.createBet(betData);
      
      // Simulate dice rolling
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate random result (this would come from the backend in a real implementation)
      const diceResult = Math.floor(Math.random() * 6) + 1; // 1-6
      
      // Determine if bet won
      let won = false;
      
      if (betType === 'exact') {
        won = diceResult === predictedValue;
      } else if (betType === 'higher') {
        won = diceResult > predictedValue;
      } else if (betType === 'lower') {
        won = diceResult < predictedValue;
      }
      
      // Update result
      setResult({
        value: diceResult,
        won: won
      });
      
      // Update message
      if (won) {
        setMessage(`You won! The dice rolled ${diceResult}`);
        setMessageType('success');
        
        // Calculate winnings based on bet type (odds are different for each type)
        let winnings = 0;
        if (betType === 'exact') {
          winnings = betAmount * 6; // 6:1 odds for exact prediction
        } else if (betType === 'higher' || betType === 'lower') {
          // Calculate odds based on probability
          const probability = betType === 'higher' 
            ? (6 - predictedValue) / 6 
            : (predictedValue - 1) / 6;
          
          // Ensure we don't divide by zero
          if (probability > 0) {
            winnings = betAmount * (1 / probability);
          }
        }
        
        setUserBalance(prevBalance => prevBalance + winnings);
      } else {
        setMessage(`You lost. The dice rolled ${diceResult}`);
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
      setIsRolling(false);
    }
  };

  return (
    <Container>
      <h2 className="text-center mb-4">
        <FaDice className="me-2" />
        Dice Game
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
                        <option value="exact">Exact Value</option>
                        <option value="higher">Higher Than</option>
                        <option value="lower">Lower Than</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>
                    {betType === 'exact' ? 'Predicted Value' : 
                     betType === 'higher' ? 'Higher Than' : 'Lower Than'}
                  </Form.Label>
                  <Form.Select value={predictedValue} onChange={handlePredictedValueChange}>
                    {betType === 'higher' ? (
                      // For "higher than", we can only select 1-5
                      [1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))
                    ) : betType === 'lower' ? (
                      // For "lower than", we can only select 2-6
                      [2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))
                    ) : (
                      // For "exact", we can select 1-6
                      [1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  className="w-100" 
                  onClick={placeBet}
                  disabled={isRolling || betAmount <= 0 || betAmount > userBalance}
                >
                  {isRolling ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Rolling...
                    </>
                  ) : (
                    'Roll the Dice'
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
                  <div className="dice-result mx-auto mb-2">
                    {getDiceIcon(result.value)}
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

export default DiceGame;
