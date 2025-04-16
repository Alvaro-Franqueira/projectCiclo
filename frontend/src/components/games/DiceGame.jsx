// src/components/games/DiceGame.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Badge, Spinner, InputGroup, FormControl } from 'react-bootstrap';
import { FaDice, FaDiceOne, FaDiceTwo, FaDiceThree, FaDiceFour, FaDiceFive, FaDiceSix, FaHistory, FaDollarSign, FaUser, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext'; // Correct path assumed
import diceService from '../../services/diceService'; // Correct path assumed
import betService from '../../services/betService';   // Correct path assumed
import { Link } from 'react-router-dom';
import flyingChips from '../images/flying-chips.png'; // Adjust the path as needed
import confetti from 'canvas-confetti';
import bigWin from '../images/bigwin.png'; 

const DiceGame = () => {
  const { user, updateUserBalance } = useAuth(); // Get user and updater function
  const [userBalance, setUserBalance] = useState(0); // Start with 0, update in useEffect
  const [betAmount, setBetAmount] = useState(5);
  const [betType, setBetType] = useState('parimpar');
  const [betValue, setBetValue] = useState('par');
  const [diceValues, setDiceValues] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [resultMessage, setResultMessage] = useState({ text: '', type: '' });
  const [history, setHistory] = useState([]);
  // --- Effects ---

  // Initialize balance from context ONCE or when user ID changes
  useEffect(() => {
    if (user?.id) {
      // Properly handle the Promise returned by getUserBalance
      betService.getUserBalance(user.id)
        .then(balance => {
          console.log("Initializing balance from user context:", balance);
          // If balance is a number, use it; otherwise, use user.balance or 0
          const numericBalance = typeof balance === 'number' ? balance : 
                               (user.balance || 0);
          setUserBalance(numericBalance);
          loadUserBetHistory();
        })
        .catch(error => {
          console.error("Error loading user balance:", error);
          // Fallback to user.balance from context if available
          setUserBalance(user.balance || 0);
        });
    } else {
      setUserBalance(0);
      setHistory([]);
    }
  }, [user?.id]); // Depend only on user.id to avoid loops

  // Log context user changes for debugging
  useEffect(() => {
    console.log("Auth Context User State:", user);
  }, [user]);

  // --- Data Fetching ---

  const loadUserBetHistory = () => {
    if (!user?.id) return;
    
    try {
      // Use Promise then/catch instead of async/await
      betService.getUserGameBets(user.id, 2)
        .then(bets => {
          if (Array.isArray(bets)) {
            const sortedBets = bets
              .sort((a, b) => new Date(b.fechaApuesta) - new Date(a.fechaApuesta))
              .slice(0, 5);
            setHistory(sortedBets);
          } else {
            console.error("Expected array from getUserGameBets, got:", bets);
            setHistory([]);
          }
        })
        .catch(error => {
          console.error('Failed to fetch dice bet history:', error);
          setResultMessage({ text: 'Could not load bet history.', type: 'warning' });
          setHistory([]);
        });
    } catch (error) {
      console.error('Error in loadUserBetHistory:', error);
      setHistory([]);
    }
  };

  // --- Handlers ---
  const handleBetAmountChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) value = '';
    else if (value > userBalance) value = userBalance; // Cap at user balance
    setBetAmount(value);
  };

  const handleBetTypeChange = (e) => {
    const type = e.target.value;
    setBetType(type);
    // Reset bet value based on new type
    if (type === 'parimpar') {
      setBetValue('par');
    } else if (type === 'numero') {
      setBetValue('2'); // Default to sum 2
    }
  };

  const handleBetValueChange = (e) => {
    setBetValue(e.target.value);
  };

  // --- Core Game Logic ---

  const placeBetAndRoll = () => {
    const currentBalanceBeforeBet = userBalance; // Capture balance before bet
    if (!betAmount || betAmount <= 0 || betAmount > currentBalanceBeforeBet) {
      setResultMessage({ text: 'Invalid bet amount or insufficient balance.', type: 'danger' });
      return;
    }
    if (!user?.id) {
      setResultMessage({ text: 'User not identified. Cannot place bet.', type: 'danger' });
      return;
    }

    setIsRolling(true);
    setResultMessage({ text: 'Rolling the dice...', type: 'info' });

    // Dice will be rolled by the backend
    // We'll update the dice display when we get the response

    const betData = {
      usuarioId: user.id,
      juegoId: 2, // Hardcoded game ID for Dice game
      cantidad: betAmount,
      tipo: betType,
      valorApostado: betValue,
      valorGanador: null
    };
    console.log('Placing bet with data:', betData, `Current local balance: ${currentBalanceBeforeBet}`);

    // Use Promise chain instead of async/await
  diceService.jugar(betData)
      .then(response => {
        const { diceResults, resolvedBet } = response;
        // Log the RAW response from the backend
        console.log('Backend RAW response:', response);
        // Check if the response is valid
        if (!response || !resolvedBet) {
          console.error('Invalid response from backend:', response);
          setResultMessage({ text: 'Invalid response from backend.', type: 'danger' });
          return;
        }

        // Check for user data in the DTO
        console.log('Parsed Response:', { diceResults, resolvedBet });
        console.log('User data within resolvedBet - ID:', resolvedBet.usuarioId, 'Balance:', resolvedBet.userBalance);

        // Use the userBalance field from the ApuestaDTO - this is the authoritative balance from the backend
        let backendNewBalance = resolvedBet.userBalance;
        
        // Get the winloss value directly from the backend response
        const winlossAmount = resolvedBet.winloss;
        
        console.log(`Win/Loss amount from backend: ${winlossAmount}`);

        if (backendNewBalance === undefined || backendNewBalance === null || typeof backendNewBalance !== 'number' || isNaN(backendNewBalance)) {
            console.error(`CRITICAL: Backend DTO missing or has invalid balance! Value: ${backendNewBalance}`);
            throw new Error("Backend returned invalid balance value in DTO.");
        }

        console.log(`Balance Check: Before Bet (local) = ${currentBalanceBeforeBet}, After Bet (backend DTO) = ${backendNewBalance}`);
        console.log(`Win/Loss calculation: ${winlossAmount > 0 ? 'Won' : 'Lost'} ${Math.abs(winlossAmount)}`);

        // Update dice display
        setDiceValues(diceResults);

        // Update balance: Local state AND Context using backend's authoritative value
        setUserBalance(backendNewBalance);
        /*if (updateUserBalance) {
            console.log(`Calling context updateUserBalance with: ${backendNewBalance}`);
            updateUserBalance(backendNewBalance);
        } else {
            console.warn("AuthContext does not provide updateUserBalance function!");
        }*/

// Update result message (use resolvedBet which is ApuestaDTO)
const totalResult = diceResults[0] + diceResults[1];
const baseMessage = `Rolled: ${diceResults[0]} and ${diceResults[1]} (total: ${totalResult}). `;


const betAmount = resolvedBet.cantidad;

// Add explanation of the payout calculation based on bet type
let payoutExplanation = '';
if (resolvedBet.tipo === 'parimpar') {
    // For even/odd bets, payout is 95% of bet amount
    payoutExplanation = ` (95% of your $${betAmount} bet)`;
} else if (resolvedBet.tipo === 'numero') {
    // For number bets, payout depends on the number (using odds table from backend)
    const odds = totalResult === 7 ? 5.0 : 
                 (totalResult === 6 || totalResult === 8) ? 6.0 :
                 (totalResult === 5 || totalResult === 9) ? 8.0 :
                 (totalResult === 4 || totalResult === 10) ? 10.0 :
                 (totalResult === 3 || totalResult === 11) ? 15.0 :
                 (totalResult === 2 || totalResult === 12) ? 30.0 : 0;
    payoutExplanation = ` (${odds}x your $${betAmount} bet)`;
} else if (resolvedBet.tipo === 'mitad') {
    // For half bets, payout is 95% of bet amount
    payoutExplanation = ` (95% of your $${betAmount} bet)`;
}

if (resolvedBet.estado === 'GANADA') {
  // Trigger confetti animation
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.6 },// center confetti after roll button
  });
  
    setResultMessage({
        text: baseMessage + `You won $${winLossDisplayAmount.toFixed(2)}!${payoutExplanation}`, // Display the actual profit with explanation
        type: 'success'
    });
} else {
    setResultMessage({
        text: baseMessage + `You lost $${betAmount.toFixed(2)}.`, // Display the actual amount lost (betAmount)
        type: 'danger'
    });
}

// Refresh history
setTimeout(loadUserBetHistory, 1500);
  })
      .catch(error => {
        console.error('CRITICAL ERROR during dice bet:', error);
        // Provide more specific feedback if possible
        let userMessage = `Error: ${error.message || 'Failed to place bet.'}`;
        if (error.response?.data?.message) {
          userMessage = `Error: ${error.response.data.message}`;
        }
        setResultMessage({ text: userMessage, type: 'danger' });
      })
      .finally(() => {
        setIsRolling(false);
      });
  };

  // --- UI Rendering ---

  const getDiceIcon = (value) => {
    const iconStyle = { color: 'white' }; 

    switch (value) {
      case 1: return <FaDiceOne size={50} style={iconStyle} />;
      case 2: return <FaDiceTwo size={50} style={iconStyle} />;
      case 3: return <FaDiceThree size={50} style={iconStyle} />;
      case 4: return <FaDiceFour size={50} style={iconStyle} />;
      case 5: return <FaDiceFive size={50} style={iconStyle} />;
      case 6: return <FaDiceSix size={50} style={iconStyle} />;
      default: return <FaDice size={50} style={iconStyle} />; // Fallback
    }
  };

  const renderBetValueInput = () => {
    switch (betType) {
      case 'parimpar': // Even/Odd
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={isRolling}>
            <option value="par">Even Sum</option>
            <option value="impar">Odd Sum</option>
          </Form.Select>
        );
      case 'numero': // Specific sum
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={isRolling}>
            {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
              <option key={num} value={String(num)}>{num}</option> // Use string value
            ))}
          </Form.Select>
        );
      default:
        return null;
    }
  };

  // This is a safe way to handle the balance display
  const safeDisplayBalance = () => {
    if (user?.id && typeof userBalance === 'number') {
      return `$${userBalance.toFixed(2)}`;
    }
    return '$0.00';
  };

  // Component Return (JSX)
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaDice className="me-2" /> Casino Dice
        </h2>
        <Link to="/profile" className="btn btn-outline-primary">
          <FaChartBar className="me-2" /> View My Statistics
        </Link>
      </div>

      <Row className="justify-content-center">
        {/* Game Area */}
        <Col md={7} lg={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Place Your Bet</span>
              {/* Safe balance display */}
              <Badge bg="success" className="p-2 fs-6">
                <FaDollarSign /> Balance: {safeDisplayBalance()}
              </Badge>
            </Card.Header>
            <Card.Body>
              {/* Dice Display - Apply color via getDiceIcon */}
              <div className="d-flex justify-content-center gap-4 my-4">
                {diceValues.map((value, index) => (
                  <div key={index} style={{ opacity: isRolling ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    {getDiceIcon(value)}
                  </div>
                ))}                
              </div>

              {/* Result Message */}
                  {resultMessage.text && (
                    <div className="result-message-container mt-3 text-center">
                      {resultMessage.type === 'success' && (
                        <>
                          {betType === 'numero' ? (
                            <img
                              src={bigWin}
                              alt="Big Win"
                              className="winning-image"
                            />
                          ) : (
                            <img
                              src={flyingChips}
                              alt="Winning Chips"
                              className="winning-image"
                            />
                          )}
                        </>
                      )}
                      <Alert variant={resultMessage.type}>
                        {resultMessage.text}
                      </Alert>
                      
                    </div>
                  )}

              {/* Bet Form */}
              <Form className="text-white" onSubmit={(e) => { e.preventDefault(); placeBetAndRoll(); }}>
                                {/* Roll Button */}
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  style={{ marginBottom: '20px' }}
                  type="submit"
                  disabled={isRolling || !betAmount || betAmount <= 0 || betAmount > userBalance}
                >
                  {isRolling ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Rolling...
                    </>
                  ) : (
                    'Roll Dice'
                  )}
                </Button>
                {/* Bet Amount */}
                <Form.Group as={Row} className="mb-3 align-items-center ">
                  <Form.Label column sm={4}>Amount:</Form.Label>
                  <Col sm={8}>
                    <InputGroup>
                      <InputGroup.Text>$</InputGroup.Text>
                      <FormControl
                        type="number"
                        value={betAmount}
                        onChange={handleBetAmountChange}
                        min="1"
                        step="1"
                        max={userBalance} // Use local state for max check
                        isInvalid={betAmount > userBalance}
                        disabled={isRolling}
                        placeholder="Enter bet amount"
                      />
                    </InputGroup>
                    {betAmount > userBalance && <Form.Text className="text-danger">Insufficient balance.</Form.Text>}
                  </Col>
                </Form.Group>

                {/* Bet Type */}
                <Form.Group as={Row} className="mb-3 align-items-center">
                  <Form.Label column sm={4}>Bet Type:</Form.Label>
                  <Col sm={8}>
                    <Form.Select value={betType} onChange={handleBetTypeChange} disabled={isRolling}>
                      <option value="parimpar">Odd/Even Sum</option>
                      <option value="numero">Specific Sum</option>
                    </Form.Select>
                  </Col>
                </Form.Group>

                {/* Bet Value */}
                <Form.Group as={Row} className="mb-3 align-items-center">
                  <Form.Label column sm={4}>Bet On:</Form.Label>
                  <Col sm={8}>
                    {renderBetValueInput()}
                  </Col>
                </Form.Group>


              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* History Area */}
        <Col md={5} lg={4}>
          <Card className="text-white">
            <Card.Header><FaHistory className="me-2" />Recent Dice Bets</Card.Header>
            <Card.Body>
              {history.length > 0 ? (
                <div>
                  {history.map((bet) => (
                    <div key={bet.id || `bet-${Math.random()}`} className="mb-2 p-2 border-bottom small">
                      <div className="d-flex justify-content-between">
                        <span>
                        
                          {bet.tipo === 'parimpar' ? bet.valorApostado : `Número ${bet.valorApostado}`}
                       

                        </span>
                        <Badge   style={{
                                    display: 'flex',
                                    alignItems: 'center'// opcional: separa el texto del monto
                                  }} bg={bet.estado === 'GANADA' ? 'success' : 'danger'}>
                          {bet.estado === 'GANADA' ? 'WON' : 'LOST'}
                          ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : bet.cantidad.toFixed(2)}
                        </Badge>
                      </div>
                      <div
                          className="text-white"
                          style={{
                            fontSize: '0.8em',
                            marginTop: '0.5rem' // or '8px' or whatever spacing you prefer
                          }}
>
                        {bet.fechaApuesta ? new Date(bet.fechaApuesta).toLocaleString() : 'Unknown date'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted">No recent dice bets</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DiceGame;