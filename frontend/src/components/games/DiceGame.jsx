import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, FormControl, Card, ListGroup, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { FaDice, FaDiceOne, FaDiceTwo, FaDiceThree, FaDiceFour, FaDiceFive, FaDiceSix, FaTrophy, FaUser, FaHistory, FaDollarSign } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import betService from '../../services/betService';
import diceService from '../../services/diceService';
import rankingService from '../../services/rankingService';

function DiceGame() {
  const { user, updateUserBalance } = useAuth(); // Use updateUserBalance from context
  const [userBalance, setUserBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(5); // Default bet
  const [betType, setBetType] = useState('parimpar'); // Default: Odd/Even
  const [betValue, setBetValue] = useState('par'); // Default: Even
  const [result, setResult] = useState(null); // Stores { message, type: 'success'/'danger', dice: [d1, d2] }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [activeTab, setActiveTab] = useState('game');
  
  // User stats
  const [userStats, setUserStats] = useState({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalProfit: 0,
    winRate: 0
  });
  
  // Rankings
  const [rankings, setRankings] = useState([]);
  const [rankingType, setRankingType] = useState('OVERALL_PROFIT');
  const [loadingRankings, setLoadingRankings] = useState(false);
  
  // State to store the actual dice values from backend
  const [diceValues, setDiceValues] = useState([1, 1]);
  const [animationStep, setAnimationStep] = useState(0);
  
  // Timer ref for animation sequence
  const animationTimerRef = React.useRef(null);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    // Set isMounted to false when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Set initial balance from user object
      setUserBalance(user.saldo || 0);
      
      // Load user's bet history
      loadUserBetHistory();
    }
  }, [user]);

  const loadUserBetHistory = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Loading bet history for user:', user.id);
      
      // Use the new endpoint to get bets for this user in the dice game (juegoId = 2)
      const bets = await betService.getUserGameBets(user.id, 2);
      console.log('Dice game bets response:', bets);
      
      // Check if bets is an array
      if (!Array.isArray(bets)) {
        console.error('Expected array of bets but got:', typeof bets);
        return;
      }
      
      console.log('Total dice game bets found:', bets.length);
      
      // Sort by date (newest first) and limit to 10
      const sortedBets = bets
        .sort((a, b) => new Date(b.fechaApuesta) - new Date(a.fechaApuesta))
        .slice(0, 10);
      
      console.log('Sorted and limited bets:', sortedBets);
      
      // Update history state
      setHistory(sortedBets);
      
      // Update user stats based on all bets
      updateUserStats(bets);
      
    } catch (error) {
      console.error('Error loading bet history:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setUserBalance(user.saldo || 0); // Set balance directly from context user
      fetchUserStats();
    } else {
      console.error('User data not found in context!');
      setUserBalance(0);
    }
  }, [user]);
  
  // Fetch rankings when tab changes to rankings or ranking type changes
  useEffect(() => {
    if (activeTab === 'rankings') {
      fetchRankings();
    }
  }, [activeTab, rankingType]);

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get user's dice bets
      const bets = await betService.getUserGameBets(user.id, 2);
      
      // Calculate stats
      const totalBets = bets.length;
      const wonBets = bets.filter(bet => bet.estado === 'GANADA').length;
      const lostBets = bets.filter(bet => bet.estado === 'PERDIDA').length;
      const totalProfit = bets.reduce((acc, bet) => acc + bet.winloss, 0);
      const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
      const totalAmount = bets.reduce((acc, bet) => acc + bet.cantidad, 0);
      
      setUserStats({
        totalBets,
        wonBets,
        lostBets,
        totalProfit,
        winRate,
        totalAmount
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Don't update stats on error, keep previous values
      // This prevents flickering between values
    }
  }, [user]);

  const fetchRankings = useCallback(async () => {
    if (loadingRankings) return;
    
    setLoadingRankings(true);
    try {
      let rankingsData;
      
      // Get rankings for dice game (assuming dice game ID is 2)
      rankingsData = await rankingService.getRankingsByGameAndType(2, rankingType);
      
      if (isMounted.current) {
        setRankings(rankingsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
      if (isMounted.current) {
        // Provide fallback mock data for rankings when API fails
        const mockRankings = [
          { 
            usuario: { id: 1, username: 'player1' }, 
            valor: 1250.50 
          },
          { 
            usuario: { id: 2, username: 'player2' }, 
            valor: 875.25 
          },
          { 
            usuario: { id: 3, username: 'player3' }, 
            valor: 520.75 
          }
        ];
        
        setRankings(mockRankings);
      }
    } finally {
      if (isMounted.current) {
        setLoadingRankings(false);
      }
    }
  }, [rankingType, loadingRankings]);

  const handleBetAmountChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) value = '';
    else if (value > userBalance) value = userBalance;
    setBetAmount(value);
  };

  const handleBetTypeChange = (e) => {
    const type = e.target.value;
    setBetType(type);
    if (type === 'numero') setBetValue('2'); // Default to sum 2
    else if (type === 'parimpar') setBetValue('par'); // Default to even
  };

  const handleBetValueChange = (e) => {
    setBetValue(e.target.value);
  };
  
  const handleRankingTypeChange = (e) => {
    setRankingType(e.target.value);
  };

  // Function to get the dice icon based on value
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

  // Function to animate dice with random values first, then show real values
  const animateDiceRoll = (diceResults, resultData, newBalance, balanceChange) => {
    // Clear any existing animation timer
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }
    
    setRolling(true);
    setAnimationStep(0);
    
    // Start animation sequence
    const totalSteps = 15;
    let currentStep = 0;
    
    const animateStep = () => {
      if (currentStep < totalSteps) {
        // Generate random dice values during animation
        const randomDice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ];
        
        setDiceValues(randomDice);
        currentStep++;
        setAnimationStep(currentStep);
        
        // Gradually slow down the animation
        const delay = 50 + (currentStep * 10);
        animationTimerRef.current = setTimeout(animateStep, delay);
      } else {
        // Final step - show actual values from backend
        setDiceValues(diceResults);
        setAnimationStep(0);
        setRolling(false);
        
        // Update the balance only after the animation completes
        if (newBalance !== undefined) {
          setUserBalance(newBalance);
          
          // Update the user balance in the auth context to ensure it's updated everywhere
          if (updateUserBalance) {
            updateUserBalance(newBalance);
          }
          
          // Debug the balance update
          console.log('Balance updated after animation:', {
            previousBalance: userBalance,
            newBalance: newBalance,
            difference: newBalance - userBalance,
            username: user.username || user.nombre
          });
        }
        
        // Only show the result message after animation completes
        if (resultData) {
          setResult(resultData);
        }
        
        // Reload bet history to show the new bet
        setTimeout(() => {
          if (isMounted.current) {
            console.log('Reloading bet history after placing bet');
            loadUserBetHistory();
          }
        }, 2000); // Wait 2 seconds after animation starts to reload history
      }
    };
    
    // Start animation sequence
    animateStep();
  };

  const handleRollDice = async () => {
    if (!betAmount || betAmount <= 0 || betAmount > userBalance || !user?.id) {
      setResult({ message: 'Invalid bet or user state.', type: 'danger' });
      return;
    }

    setLoading(true);
    setRolling(true);
    setResult(null);

    const betData = {
      usuarioId: user.id,
      juegoId: 2, // Dice game ID is 2
      cantidad: betAmount,
      tipo: betType,
      valorApostado: betValue,
    };

    // Debug information about the user making the bet
    console.log('User placing bet:', {
      userId: user.id,
      username: user.username || user.nombre,
      currentBalance: userBalance,
      betAmount: betAmount,
      betType: betType,
      betValue: betValue
    });

    try {
      // Call the backend to place the bet and roll the dice
      console.log('Sending bet to backend:', betData);
      const response = await diceService.jugar(betData);
      console.log('Full dice roll response:', response);
      
      const { diceResults, resolvedBet } = response;
      const totalResult = diceResults[0] + diceResults[1];

      // Debug the response from the server
      console.log('Dice roll response details:', {
        diceResults,
        resolvedBet,
        totalResult,
        userAfterBet: resolvedBet.usuario
      });

      // Calculate the proper balance update
      // If won, add the bet amount (player gets their bet back plus an equal amount as winnings)
      // If lost, subtract the bet amount (which is already reflected in winloss as negative)
      let balanceChange = resolvedBet.estado === 'GANADA' ? betAmount : -betAmount;
      
      // We'll update the balance after the animation ends
      // Store the new balance for later use
      const newBalance = userBalance + balanceChange;
      
      // Prepare result message but don't set it yet
      const baseMessage = `Rolled: ${diceResults[0]} + ${diceResults[1]} = ${totalResult}. `;
      
      // Calculate the actual winnings (double the bet amount on win)
      const winAmount = resolvedBet.estado === 'GANADA' ? betAmount * 2 : 0;
      
      const resultData = resolvedBet.estado === 'GANADA' 
        ? { 
            message: baseMessage + `You won $${betAmount.toFixed(2)}! (Total return: $${winAmount.toFixed(2)})`, 
            type: 'success',
            dice: diceResults 
          }
        : { 
            message: baseMessage + `You lost $${betAmount.toFixed(2)}.`, 
            type: 'danger',
            dice: diceResults 
          };
      
      // Start dice animation sequence and pass the result and balance update to be applied after animation
      animateDiceRoll(diceResults, resultData, newBalance, balanceChange);
    } catch (error) {
      console.error('Error rolling dice:', error);
      setResult({ message: error.response?.data?.message || 'Failed to roll dice.', type: 'danger' });
      setRolling(false);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStats = (bets) => {
    if (!bets || bets.length === 0) return;
    
    const totalBets = bets.length;
    const wonBets = bets.filter(bet => bet.estado === 'GANADA').length;
    const lostBets = totalBets - wonBets;
    const totalProfit = bets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
    const totalAmount = bets.reduce((sum, bet) => sum + (bet.cantidad || 0), 0);
    
    setUserStats({
      totalBets,
      wonBets,
      lostBets,
      totalProfit,
      winRate,
      totalAmount
    });
  };

  const renderBetValueInput = () => {
    switch (betType) {
      case 'parimpar': // Even/Odd
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={loading || rolling}>
            <option value="par">Even</option>
            <option value="impar">Odd</option>
          </Form.Select>
        );
      case 'numero': // Specific sum
        return (
          <Form.Select value={betValue} onChange={handleBetValueChange} disabled={loading || rolling}>
            {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
              <option key={num} value={num.toString()}>{num}</option>
            ))}
          </Form.Select>
        );
      default:
        return null;
    }
  };

  // CSS for dice animation
  const diceContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    padding: '2rem',
    background: '#0a5c36',
    borderRadius: '8px',
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
    margin: '1rem 0',
    position: 'relative',
    minHeight: '120px'
  };

  const diceStyle = (index) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontSize: '3rem',
    transform: rolling ? `rotate(${(animationStep * 30) % 360}deg)` : 'rotate(0deg)',
    transition: 'transform 0.1s ease-out',
    animation: rolling ? `dice-bounce 0.5s ease-in-out ${index * 0.1}s infinite alternate` : 'none'
  });
  
  // Render user stats card
  const renderUserStats = () => (
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white d-flex align-items-center">
        <FaUser className="me-2" /> 
        <span>{user ? `${user.nombre || user.username}'s Dice Game Stats` : 'Your Dice Game Stats'}</span>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col xs={12}>
            <Alert variant="info">
              <strong>Current Balance:</strong> ${userBalance.toFixed(2)}
            </Alert>
          </Col>
        </Row>
        <Row>
          <Col xs={6} md={4} className="mb-3">
            <div className="text-center text-light">
              <h6>Total Bets</h6>
              <h3>{userStats.totalBets}</h3>
            </div>
          </Col>
          <Col xs={6} md={4} className="mb-3">
            <div className="text-center text-success">
              <h6>Wins</h6>
              <h3>{userStats.wonBets}</h3>
            </div>
          </Col>
          <Col xs={6} md={4} className="mb-3">
            <div className="text-center text-danger">
              <h6>Losses</h6>
              <h3>{userStats.lostBets}</h3>
            </div>
          </Col>
          <Col xs={6} md={6} className="mb-3">
            <div className="text-center text-light">
              <h6>Total Amount</h6>
              <h3>${userStats.totalAmount}</h3>
            </div>
          </Col>
          <Col xs={6} md={6} className="mb-3">
            <div className="text-center text-light">
              <h6>Win Rate</h6>
              <h3>{userStats.winRate.toFixed(1)}%</h3>
            </div>
          </Col>
          
          <Col xs={6} md={6} className="mb-3">
            <div className={`text-center ${userStats.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              <h6>Total Profit</h6>
              <h3>${userStats.totalProfit.toFixed(2)}</h3>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const renderBetHistory = () => {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex align-items-center bg-dark text-white">
          <FaHistory className="me-2" /> Bet History
        </Card.Header>
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Game</th>
              <th>Bet Type</th>
              <th>Amount</th>
              <th>Result</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((bet, index) => {
                // Format the date
                const betDate = bet.fechaApuesta ? new Date(bet.fechaApuesta) : new Date();
                const formattedDate = betDate.toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                // Get game name
                const gameName = bet.juego?.nombre || 
                                (bet.juegoId === 2 ? 'Dice' : 
                                 bet.juegoId === 1 ? 'Roulette' : 'Unknown');
                
                // Format the bet type
                let betTypeDisplay = '';
                if (bet.tipo === 'numero') {
                  betTypeDisplay = `Sum = ${bet.valorApostado}`;
                } else if (bet.tipo === 'parimpar') {
                  betTypeDisplay = bet.valorApostado === 'par' ? 'Even' : 'Odd';
                } else {
                  betTypeDisplay = `${bet.tipo}: ${bet.valorApostado}`;
                }
                
                // Calculate winnings or losses
                const betAmount = bet.cantidad || 0;
                const winAmount = bet.estado === 'GANADA' ? betAmount * 2 : 0;
                
                // Determine if bet was won or lost
                const isWon = bet.estado === 'GANADA' || bet.winloss > 0;
                
                return (
                  <tr key={bet.id || `bet-${index}`} className={isWon ? 'table-success' : 'table-danger'}>
                    <td>{formattedDate}</td>
                    <td>{gameName}</td>
                    <td>{betTypeDisplay}</td>
                    <td>${betAmount.toFixed(2)}</td>
                    <td>
                      <Badge bg={isWon ? 'success' : 'danger'}>
                        {isWon ? 'WON' : 'LOST'}
                      </Badge>
                    </td>
                    <td className={isWon ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      {isWon 
                        ? `+$${betAmount.toFixed(2)} (Total: $${winAmount.toFixed(2)})` 
                        : `-$${betAmount.toFixed(2)}`}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No bet history available. Place your first bet!</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    );
  };

  const renderRankings = () => (
    <Card>
      <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
        <div>
          <FaTrophy className="me-2" /> Dice Game Rankings
        </div>
        <Form.Select 
          value={rankingType} 
          onChange={handleRankingTypeChange}
          style={{ width: 'auto' }}
          size="sm"
        >
          <option value="OVERALL_PROFIT">By Profit</option>
          <option value="TOTAL_BETS_AMOUNT">By Bet Amount</option>
          <option value="BY_GAME_WINS">By Wins</option>
        </Form.Select>
      </Card.Header>
      <Card.Body>
        {loadingRankings ? (
          <div className="text-center p-4">Loading rankings...</div>
        ) : rankings.length > 0 ? (
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((rank, index) => {
                const isCurrentUser = user && rank.usuario && rank.usuario.id === user.id;
                const rankValue = parseFloat(rank.valor || 0);
                const isPositiveValue = rankValue >= 0;
                
                return (
                  <tr key={index} className={isCurrentUser ? 'table-primary' : ''}>
                    <td>
                      {index === 0 ? <FaTrophy className="text-warning" /> : 
                       index === 1 ? <FaTrophy className="text-secondary" /> : 
                       index === 2 ? <FaTrophy style={{color: '#cd7f32'}} /> : 
                       index + 1}
                    </td>
                    <td>{rank.usuario ? rank.usuario.username : 'Unknown Player'}</td>
                    <td>
                      {rankingType === 'OVERALL_PROFIT' ? 
                        <span className={isPositiveValue ? 'text-success' : 'text-danger'}>
                          ${rankValue.toFixed(2)}
                        </span> : 
                        rankingType === 'TOTAL_BETS_AMOUNT' ? 
                        <span>${rankValue.toFixed(2)}</span> : 
                        <span>{rankValue} wins</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <div className="text-center p-4">No rankings available</div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="py-4">
      <h2 className="text-center mb-4">Casino Dice Game</h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        fill
      >
        <Tab eventKey="game" title={<><FaDice className="me-2" />Game</>}>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Place Your Bets</span>
                  <span className="fw-bold">
                    <FaDollarSign /> Balance: ${userBalance.toFixed(2)}
                  </span>
                </Card.Header>
                <Card.Body>
                  {/* Dice Display Area */}
                  <div style={diceContainerStyle}>
                    {diceValues.map((value, index) => (
                      <div key={index} style={diceStyle(index)}>
                        {getDiceIcon(value)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Result Message */}
                  {result && (
                    <Alert variant={result.type} className="text-center">
                      {result.message}
                    </Alert>
                  )}
                  
                  <Form onSubmit={(e) => { e.preventDefault(); handleRollDice(); }}>
                    {/* Bet Amount */}
                    <Form.Group as={Row} className="mb-3">
                      <Form.Label column sm={4} className="text-light">Amount:</Form.Label>
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
                            disabled={loading || rolling}
                          />
                        </InputGroup>
                        {betAmount > userBalance && <Form.Text className="text-danger">Insufficient balance.</Form.Text>}
                      </Col>
                    </Form.Group>
                    
                    {/* Bet Type */}
                    <Form.Group as={Row} className="mb-3">
                      <Form.Label column sm={4} className="text-light">Bet Type:</Form.Label>
                      <Col sm={8}>
                        <Form.Select value={betType} onChange={handleBetTypeChange} disabled={loading || rolling}>
                          <option value="parimpar">Odd/Even</option>
                          <option value="numero">Specific Sum</option>
                        </Form.Select>
                      </Col>
                    </Form.Group>
                    
                    {/* Bet Value */}
                    <Form.Group as={Row} className="mb-3">
                      <Form.Label column sm={4} className="text-light">Bet On:</Form.Label>
                      <Col sm={8}>
                        {renderBetValueInput()}
                      </Col>
                    </Form.Group>
                    
                    {/* Roll Button */}
                    <div className="d-grid">
                      <Button 
                        variant="success" 
                        size="lg" 
                        type="submit" 
                        disabled={loading || rolling || !betAmount || betAmount <= 0}
                        className="roll-button"
                      >
                        {rolling ? 'Rolling...' : (loading ? 'Placing Bet...' : 'Roll Dice')}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Bets */}
          <Row className="justify-content-center mt-4">
            <Col md={8} lg={6}>
              <Card>
                <Card.Header className="d-flex align-items-center">
                  <FaHistory className="me-2" /> Recent Dice Bets
                </Card.Header>
                <ListGroup variant="flush">
                  {history.length > 0 ? (
                    history.map(bet => (
                      <ListGroup.Item key={bet.id} className={`d-flex justify-content-between align-items-center ${bet.estado === 'GANADA' ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                        <span>
                           Bet ${bet.cantidad.toFixed(2)} on Sum {bet.tipo === 'numero' ? ` = ${bet.valorApostado}` : (bet.valorApostado === 'par' ? 'Even' : 'Odd') }
                        </span>
                        <span className={`fw-bold ${bet.estado === 'GANADA' ? 'text-success' : 'text-danger'}`}>
                          {bet.estado === 'GANADA' 
                            ? `Won $${bet.cantidad.toFixed(2)} (Total: $${(bet.cantidad * 2).toFixed(2)})` 
                            : `Lost $${bet.cantidad.toFixed(2)}`}
                        </span>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No recent dice bets found.</ListGroup.Item>
                  )}
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="stats" title={<><FaUser className="me-2" />My Stats</>}>
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              {renderUserStats()}
              
              {/* Recent Bets in Stats Tab */}
              {renderBetHistory()}
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="rankings" title={<><FaTrophy className="me-2" />Rankings</>}>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              {renderRankings()}
            </Col>
          </Row>
        </Tab>
      </Tabs>

      <style>{`
        @keyframes dice-bounce {
          0% {
            transform: translateY(0) rotate(${Math.random() * 360}deg);
          }
          100% {
            transform: translateY(-10px) rotate(${Math.random() * 360}deg);
          }
        }
        
        .roll-button {
          padding: 10px 40px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 30px;
          background-color: #28a745;
          border-color: #28a745;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .roll-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
          background-color: #218838;
          border-color: #1e7e34;
        }
        
        .roll-button:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </Container>
  );
}

export default DiceGame;
