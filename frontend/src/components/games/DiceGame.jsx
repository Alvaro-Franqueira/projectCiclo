/**
 * Dice Game Component
 * Implements a classic dice game with multiple betting options:
 * - Even/Odd sum betting
 * - Specific sum betting with different payouts
 * Features include:
 * - Animated dice rolling
 * - Real-time balance updates
 * - Bet history tracking
 * - Visual feedback for wins and losses
 * - Confetti animation for wins
 */
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert, Badge, Spinner, InputGroup, FormControl } from 'react-bootstrap';
import { FaDice, FaDiceOne, FaDiceTwo, FaDiceThree, FaDiceFour, FaDiceFive, FaDiceSix, FaHistory, FaDollarSign } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import diceService from '../../services/diceService';
import betService from '../../services/betService';
import confetti from 'canvas-confetti';
import '../../assets/styles/DiceGame.css';
import gameService from '../../services/gameService';

// ===== Constants =====

/**
 * Minimum duration for dice roll animation in milliseconds
 */
const MIN_ROLL_DURATION = 2000;

/**
 * Payout multipliers for specific sum bets
 * Higher risk = higher payout
 */
const PAYOUT_MULTIPLIERS = {
  7: 5.0,   // Most common sum
  6: 6.0,   // Common sum
  8: 6.0,   // Common sum
  5: 8.0,   // Less common
  9: 8.0,   // Less common
  4: 10.0,  // Rare
  10: 10.0, // Rare
  3: 15.0,  // Very rare
  11: 15.0, // Very rare
  2: 30.0,  // Rarest
  12: 30.0  // Rarest
};

const DiceGame = () => {
  // ===== Hooks =====
  const { user, updateUserBalance } = useAuth();
  
  // ===== State =====
  const [userBalance, setUserBalance] = useState(0);
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

  // ===== Effects =====
  
  /**
   * Load game information on component mount
   */
  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const gameData = await gameService.getGameById(2);
        setGameInfo(gameData);
      } catch (err) {
        console.error('Error loading game info:', err);
        setGameInfo({
          name: 'Dice Game',
          description: 'Try your luck with our classic Dice game!'
        });
      }
    };
    fetchGameInfo();
  }, []);

  /**
   * Initialize user balance and load bet history
   */
  useEffect(() => {
    if (user?.id) {
      betService.getUserBalance(user.id)
        .then(balance => {
          const numericBalance = typeof balance === 'number' ? balance : (user.balance || 0);
          setUserBalance(numericBalance);
          loadUserBetHistory();
        })
        .catch(error => {
          console.error("Error loading user balance:", error);
          setUserBalance(user.balance || 0);
        });
    } else {
      setUserBalance(0);
      setHistory([]);
    }
  }, [user?.id]);

  /**
   * Animate dice rolling
   */
  useEffect(() => {
    let animationInterval;
    if (isRolling) {
      animationInterval = setInterval(() => {
        const randomDice1 = Math.floor(Math.random() * 6) + 1;
        const randomDice2 = Math.floor(Math.random() * 6) + 1;
        setDiceValues([randomDice1, randomDice2]);
      }, 300);
    }
    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [isRolling]);

  /**
   * Manage result message visibility
   */
  useEffect(() => {
    if (resultMessage.text) {
      setMessageVisible(true);
      const visibilityTimer = setTimeout(() => {
        setMessageVisible(false);
      }, 5000);
      return () => clearTimeout(visibilityTimer);
    }
  }, [resultMessage]);

  // ===== Service Functions =====
  
  /**
   * Load user's recent bet history
   */
  const loadUserBetHistory = () => {
    if (!user?.id) return;
    
    try {
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

  // ===== Event Handlers =====
  
  /**
   * Handle bet amount changes
   * @param {Event} e - Change event from input
   */
  const handleBetAmountChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) value = '';
    else if (value > userBalance) value = userBalance;
    setBetAmount(value);
  };

  /**
   * Handle bet type changes
   * @param {Event} e - Change event from select
   */
  const handleBetTypeChange = (e) => {
    const type = e.target.value;
    setBetType(type);
    if (type === 'evenodd') {
      setBetValue('even');
    } else if (type === 'number') {
      setBetValue('2');
    }
  };

  /**
   * Handle bet value changes
   * @param {Event} e - Change event from select
   */
  const handleBetValueChange = (e) => {
    setBetValue(e.target.value);
  };

  // ===== Game Logic Functions =====
  
  /**
   * Place bet and roll dice
   * Handles the main game flow including:
   * - Validation
   * - Balance updates
   * - Dice rolling animation
   * - Result processing
   * - Win/loss handling
   */
  const placeBetAndRoll = () => {
    const currentBalanceBeforeBet = userBalance;
    
    // Validate bet
    if (!betAmount || betAmount <= 0 || betAmount > currentBalanceBeforeBet) {
      setResultMessage({ text: 'Invalid bet amount or insufficient balance.', type: 'danger' });
      return;
    }
    
    if (!user?.id) {
      setResultMessage({ text: 'User not identified. Cannot place bet.', type: 'danger' });
      return;
    }

    // Start rolling animation
    setIsRolling(true);
    setResultMessage({ text: 'Rolling the dice...', type: 'info' });

    // Prepare bet data
    const betData = {
      userId: user.id,
      gameId: 2, // Dice game ID
      amount: betAmount,
      type: betType,
      betValue: betValue,
      winningValue: null
    };

    // Record start time for minimum animation duration
    const rollStartTime = Date.now();

    // Process bet
    diceService.play(betData)
      .then(response => {
        const { diceResults, resolvedBet } = response;
        
        if (!response || !resolvedBet) {
          throw new Error('Invalid response from backend');
        }

        // Get backend balance and win/loss amount
        const backendNewBalance = resolvedBet.userBalance;
        const winlossAmount = resolvedBet.winloss;

        // Validate backend balance
        if (typeof backendNewBalance !== 'number' || isNaN(backendNewBalance)) {
          throw new Error("Backend returned invalid balance value");
        }

        // Calculate remaining animation time
        const elapsedTime = Date.now() - rollStartTime;
        const remainingTime = Math.max(0, MIN_ROLL_DURATION - elapsedTime);

        // Process result after animation
        setTimeout(() => {
          // Update dice display
          setDiceValues(diceResults);
          setUserBalance(backendNewBalance);

          // Calculate total and prepare message
          const totalResult = diceResults[0] + diceResults[1];
          const baseMessage = `Rolled: ${diceResults[0]} and ${diceResults[1]} (total: ${totalResult}). `;

          // Handle win/loss
          if (resolvedBet.status === 'WON') {
            // Trigger confetti animation
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { x: clickPosition.x, y: clickPosition.y }
            });

            // Calculate payout explanation
            let payoutExplanation = '';
            if (resolvedBet.type === 'evenodd') {
              payoutExplanation = ` (95% of your $${betAmount} bet)`;
            } else if (resolvedBet.type === 'number') {
              const odds = PAYOUT_MULTIPLIERS[totalResult] || 0;
              payoutExplanation = ` (${odds}x your $${betAmount} bet)`;
            }

            setResultMessage({
              text: baseMessage + `You won $${winlossAmount.toFixed(2)}!${payoutExplanation}`,
              type: 'success'
            });
          } else {
            setResultMessage({
              text: baseMessage + `You lost $${betAmount.toFixed(2)}.`,
              type: 'danger'
            });
          }

          // Refresh history and end rolling state
          setTimeout(loadUserBetHistory, 1500);
          setIsRolling(false);
        }, remainingTime);
      })
      .catch(error => {
        console.error('Error during dice bet:', error);
        let userMessage = `Error: ${error.message || 'Failed to place bet.'}`;
        if (error.response?.data?.message) {
          userMessage = `Error: ${error.response.data.message}`;
        }
        setResultMessage({ text: userMessage, type: 'danger' });
        setIsRolling(false);
      });
  };

  // ===== Helper Functions =====
  
  /**
   * Get dice icon component based on value
   * @param {number} value - Dice value (1-6)
   * @returns {JSX.Element} Dice icon component
   */
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
      default: return <FaDice size={isRolling ? 60 : 50} style={iconStyle} />;
    }
  };

  /**
   * Render bet value input based on bet type
   * @returns {JSX.Element} Bet value input component
   */
  const renderBetValueInput = () => {
    switch (betType) {
      case 'evenodd':
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={isRolling}>
            <option value="even">Even Sum</option>
            <option value="odd">Odd Sum</option>
          </Form.Select>
        );
      case 'number':
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={isRolling}>
            {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
              <option key={num} value={String(num)}>{num}</option>
            ))}
          </Form.Select>
        );
      default:
        return null;
    }
  };

  /**
   * Safely format balance for display
   * @returns {string} Formatted balance string
   */
  const safeDisplayBalance = () => {
    if (user?.id && typeof userBalance === 'number') {
      return `$${userBalance.toFixed(2)}`;
    }
    return '$0.00';
  };

  // ===== Render Functions =====
  
  return (
    <Container className="py-4 dice-body">
      {/* Result Message */}
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

      {/* Game Title */}
      <div className="header-card">
        <h1>
          {gameInfo?.name || 'Dice Game'}
        </h1>
        <p>
          {gameInfo?.description || 'Try your luck with our classic dice game! Roll the dice and win big.'}
        </p>
      </div>

      <Row className="justify-content-center">
        {/* Game Area */}
        <Col md={7} lg={6}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Place Your Bet</span>
              <Badge bg="success" className="p-2 fs-6">
                <FaDollarSign /> Balance: {safeDisplayBalance()}
              </Badge>
            </Card.Header>
            <Card.Body>
              {/* Dice Display */}
              <div className="d-flex justify-content-center gap-4 my-4">
                {diceValues.map((value, index) => (
                  <div 
                    key={index} 
                    className={isRolling ? 'dice-rolling' : ''}
                    style={{ transition: 'opacity 0.2s, transform 0.3s' }}
                  >
                    {getDiceIcon(value)}
                  </div>
                ))}                
              </div>

              {/* Bet Form */}
              <Form className="text-white" onSubmit={(e) => { e.preventDefault(); placeBetAndRoll(); }}>
                {/* Bet Amount */}
                <Form.Group as={Row} className="mb-3 align-items-center">
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
                        max={userBalance}
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

                {/* Roll Button */}
                <Button
                  variant="success"
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
                            : `Number ${bet.betValue || bet.valorApostado}`}
                        </span>
                        <Badge bg={
                                    bet.status === 'WON' ? 'success' :
                                    bet.status === 'LOST' ? 'danger' : 
                                    'secondary' 
                                  }>
                          {bet.status === 'WON' ? 'WON' : 'LOST'}
                          ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : bet.amount.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="history-date">
                        {bet.betDate ? new Date(bet.betDate).toLocaleString() : 'Unknown date'}
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