// src/components/games/DiceGame.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Badge, Spinner, InputGroup, FormControl, Image } from 'react-bootstrap';
import { FaDice, FaDiceOne, FaDiceTwo, FaDiceThree, FaDiceFour, FaDiceFive, FaDiceSix, FaHistory, FaDollarSign, FaUser, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext'; // Correct path assumed
import diceService from '../../services/diceService'; // Correct path assumed
import betService from '../../services/betService';   // Correct path assumed
import { Link } from 'react-router-dom';
import flyingChips from '../images/flying-chips.png'; // Adjust the path as needed
import confetti from 'canvas-confetti';
import bigWin from '../images/bigwin.png'; 
import logoCasino from '../images/logo-casino.png';
import '../../assets/styles/DiceGame.css'; // Import our new styles

const DiceGame = () => {
  const { user, updateUserBalance } = useAuth(); // Get user and updater function
  const [userBalance, setUserBalance] = useState(); //update in useEffect
  const [betAmount, setBetAmount] = useState(5);
  const [betType, setBetType] = useState('evenodd');
  const [betValue, setBetValue] = useState('even');
  const [diceValues, setDiceValues] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [resultMessage, setResultMessage] = useState({ text: '', type: '' });
  const [messageVisible, setMessageVisible] = useState(false);
  const [history, setHistory] = useState([]);
  const [clickPosition, setClickPosition] = useState({ x: 0.5, y: 0.5 });
  const [gameInfo, setGameInfo] = useState(null);
  // --- Effects ---
  useEffect(() => {
    const fetchGameInfo = async () => {
        try {
          const gameData = await gameService.getGameById(1);
          console.log('Game data from API:', gameData);
          setGameInfo(gameData);
        } 
        catch (err) {
            console.error('Error managing game:', err);
            // Set default game info if all else fails
            setGameInfo({
            name: 'Roulette',
            description: 'Try your luck with our classic Roulette!'
            });
        } 
        };
fetchGameInfo();
  }, []);
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

  // Simulate random dice values during rolling animation
  useEffect(() => {
    let animationInterval;
    if (isRolling) {
      // Create an interval that changes dice values rapidly during rolling
      animationInterval = setInterval(() => {
        // Generate two random dice values (1-6)
        const randomDice1 = Math.floor(Math.random() * 6) + 1;
        const randomDice2 = Math.floor(Math.random() * 6) + 1;
        setDiceValues([randomDice1, randomDice2]);
      }, 300); // Change dice values less frequently (300ms instead of 150ms)
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [isRolling]);

  // Message visibility management
  useEffect(() => {
    if (resultMessage.text) {
      // When a new message is set, make it visible
      setMessageVisible(true);
      
      // After 5 seconds, trigger the fade-out by setting visibility to false
      const visibilityTimer = setTimeout(() => {
        setMessageVisible(false);
      }, 5000);
      
      return () => clearTimeout(visibilityTimer);
    }
  }, [resultMessage]);

  // --- Data Fetching ---
  const loadUserBetHistory = () => {
    if (!user?.id) return;
    
    try {
      // Use Promise then/catch instead of async/await
      betService.getUserGameBets(user.id, 2)
        .then(bets => {
          if (Array.isArray(bets)) {
            const sortedBets = bets
              .sort((a, b) => new Date(b.betDate) - new Date(a.betDate))
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
    if (type === 'evenodd') {
      setBetValue('even');
    } else if (type === 'number') {
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
      userId: user.id,
      gameId: 2, // Hardcoded game ID for Dice game
      amount: betAmount,
      type: betType,
      betValue: betValue,
      winningValue: null
    };
    console.log('Placing bet with data:', betData, `Current local balance: ${currentBalanceBeforeBet}`);

    // Get the current timestamp for minimum animation duration
    const rollStartTime = Date.now();
    const minRollDuration = 2000; // Minimum 2 seconds of animation

    // Use Promise chain instead of async/await
    diceService.play(betData)
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
        console.log('User data within resolvedBet - ID:', resolvedBet.userId, 'Balance:', resolvedBet.userBalance);

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

        // Calculate how much time has elapsed since the roll started
        const elapsedTime = Date.now() - rollStartTime;
        const remainingTime = Math.max(0, minRollDuration - elapsedTime);

        // If we haven't animated for at least minRollDuration, wait before showing the result
        setTimeout(() => {
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

          const betAmount = resolvedBet.amount;
          let payoutExplanation = '';

          if (resolvedBet.status === 'WON') {
            // Trigger confetti animation
            confetti({
              particleCount: 200,
              spread: 100,
              origin: {
                x: clickPosition.x,
                y: clickPosition.y
              },
            });
            // Add explanation of the payout calculation based on bet type

            if (resolvedBet.type === 'evenodd') {
                // For even/odd bets, payout is 95% of bet amount
                payoutExplanation = ` (95% of your $${betAmount} bet)`;
            } else if (resolvedBet.type === 'number') {
                // For number bets, payout depends on the number (using odds table from backend)
                const odds = totalResult === 7 ? 5.0 : 
                            (totalResult === 6 || totalResult === 8) ? 6.0 :
                            (totalResult === 5 || totalResult === 9) ? 8.0 :
                            (totalResult === 4 || totalResult === 10) ? 10.0 :
                            (totalResult === 3 || totalResult === 11) ? 15.0 :
                            (totalResult === 2 || totalResult === 12) ? 30.0 : 0;
                payoutExplanation = ` (${odds}x your $${betAmount} bet)`;
            } else if (resolvedBet.type === 'half') {
                // For half bets, payout is 95% of bet amount
                payoutExplanation = ` (95% of your $${betAmount} bet)`;
            }

          
            setResultMessage({
                text: baseMessage + `You won $${winlossAmount.toFixed(2)}!${payoutExplanation}`, // Display the actual profit with explanation
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
          
          // End rolling state
          setIsRolling(false);
        }, remainingTime);
      })
      .catch(error => {
        console.error('CRITICAL ERROR during dice bet:', error);
        // Provide more specific feedback if possible
        let userMessage = `Error: ${error.message || 'Failed to place bet.'}`;
        if (error.response?.data?.message) {
          userMessage = `Error: ${error.response.data.message}`;
        }
        setResultMessage({ text: userMessage, type: 'danger' });
        setIsRolling(false);
      });
  };

  // --- UI Rendering ---

  const getDiceIcon = (value) => {
    const iconStyle = { 
      color: 'white',
      fontSize: isRolling ? '60px' : '50px',
      transition: 'font-size 0.3s'
    }; 

    switch (value) {
      case 1: return <FaDiceOne size={isRolling ? 60 : 50} style={iconStyle} />;
      case 2: return <FaDiceTwo size={isRolling ? 60 : 50} style={iconStyle} />;
      case 3: return <FaDiceThree size={isRolling ? 60 : 50} style={iconStyle} />;
      case 4: return <FaDiceFour size={isRolling ? 60 : 50} style={iconStyle} />;
      case 5: return <FaDiceFive size={isRolling ? 60 : 50} style={iconStyle} />;
      case 6: return <FaDiceSix size={isRolling ? 60 : 50} style={iconStyle} />;
      default: return <FaDice size={isRolling ? 60 : 50} style={iconStyle} />; // Fallback
    }
  };

  const renderBetValueInput = () => {
    switch (betType) {
      case 'evenodd': // Even/Odd
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={isRolling}>
            <option value="even">Even Sum</option>
            <option value="odd">Odd Sum</option>
          </Form.Select>
        );
      case 'number': // Specific sum
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
    <Container className="py-4 dice-body">
      {/* Floating message with logo */}
      {resultMessage.text && (
        <div 
          className={`floating-message alert alert-${resultMessage.type}`}
          style={{
            position: 'fixed',
            bottom: messageVisible ? '30px' : '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1050,
            minWidth: '300px',
            maxWidth: '80%',
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
            textAlign: 'center',
            padding: '15px',
            borderRadius: '10px',
            opacity: messageVisible ? 0.95 : 0,
            fontWeight: 'bold',
            border: '2px solid',
            transition: 'all 0.8s ease-in-out',
            borderColor: resultMessage.type === 'success' ? 'var(--success-color)' : 
                         resultMessage.type === 'danger' ? 'var(--danger-color)' : 
                         resultMessage.type === 'warning' ? '#f59e0b' : '#0d6efd'
          }}
        >
          {resultMessage.text}
        </div>
      )}

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
                  <div 
                    key={index} 
                    className={isRolling ? 'dice-rolling' : ''}
                    style={{ 
                      transition: 'opacity 0.2s, transform 0.3s'
                    }}
                  >
                    {getDiceIcon(value)}
                  </div>
                ))}                
              </div>

              {/* Bet Form */}
              <Form className="text-white" onSubmit={(e) => { e.preventDefault(); placeBetAndRoll(); }}>
                                {/* Roll Button */}
                <Button
                  variant="primary"
                  className="dice-roll-btn"
                  type="submit"
                  disabled={isRolling || !betAmount || betAmount <= 0 || betAmount > userBalance}
                  onClick={(e) => {
                    const x = e.clientX / window.innerWidth;
                    const y = e.clientY / window.innerHeight;
                    setClickPosition({ x, y });
                  }}
                >
                  {isRolling ? (
                    <div className="d-flex align-items-center justify-content-center">
                      <div className="position-relative me-3">
                        <Spinner animation="border" size="sm" role="status" aria-hidden="true" className="justify-content-center align-items-center" style={{ top: '-3px', left: '-3px' }} />
                      </div>
                      <span>Rolling...</span>
                    </div>
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
                      <option value="evenodd">Odd/Even Sum</option>
                      <option value="number">Specific Sum</option>
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
                    <div key={bet.id || `bet-${Math.random()}`} className="history-item">
                      <div className="d-flex justify-content-between">
                        <span>
                        
                          {bet.type || bet.tipo === 'parimpar' 
                            ? (bet.betValue || bet.valorApostado) 
                            : `Número ${bet.betValue || bet.valorApostado}`}
                       

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
                          className="history-date"
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