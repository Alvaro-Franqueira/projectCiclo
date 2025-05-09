import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../../context/AuthContext';
import userService from '../../../services/userService';
import betService from '../../../services/betService';
import './SlotMachine.css';
import cherryImg from '../../../components/images/cherry-icon.png';
import lemonImg from '../../../components/images/lemon-icon.png';
import orangeImg from '../../../components/images/orange-icon.png';
import plumImg from '../../../components/images/plum-icon.png';
import bellImg from '../../../components/images/bell-icon.png';
import sevenImg from '../../../components/images/seven-icon.png';
import barImg from '../../../components/images/bar-icon.png';

const SlotMachine = () => {
  const { user, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [spinning, setSpinning] = useState(false);
  
  // References for the reels
  const reel1Ref = useRef(null);
  const reel2Ref = useRef(null);
  const reel3Ref = useRef(null);
  
  // Define symbols
  const symbols = [
    { id: 'cherry', image: cherryImg },
    { id: 'lemon', image: lemonImg },
    { id: 'orange', image: orangeImg },
    { id: 'plum', image: plumImg },
    { id: 'bell', image: bellImg },
    { id: 'seven', image: sevenImg },
    { id: 'bar', image: barImg }
  ];
  
  // Define the weights for each symbol (higher number = more likely to appear)
  // Total weight = 35, so seven has 1/35 = ~2.9% chance to appear
  const weights = {
    'cherry': 8,  // Increased to make cherry more common
    'lemon': 7,
    'orange': 6,
    'plum': 6,
    'bell': 4,
    'bar': 3,
    'seven': 1    // Rare - highest payout
  };
  
  // Current state of the reels
  const [reelState, setReelState] = useState([
    { spinning: false, symbol: 'cherry' },
    { spinning: false, symbol: 'cherry' },
    { spinning: false, symbol: 'cherry' }
  ]);
  
  const loadUserBalance = async () => {
    try {
      setLoading(true);
      const balanceData = await userService.getUserBalance(user.id);
      setBalance(balanceData);
    } catch (err) {
      setError('Failed to load balance. Please refresh the page.');
      console.error('Error loading balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (newBalanceOrFn) => {
    try {
      const newBalance = typeof newBalanceOrFn === 'function' 
        ? newBalanceOrFn(balance) 
        : newBalanceOrFn;
        
      await userService.updateUserBalance(user.id, newBalance);
      setBalance(newBalance);
    } catch (err) {
      setError('Failed to update balance. Please contact support.');
      console.error('Error updating balance:', err);
    }
  };

  const recordBet = async (isWin, amount) => {
    if (!user?.id) return;
    
    try {
      const betData = {
        usuarioId: user.id,
        juegoId: 10, // Assuming 10 is the Slot Machine game ID
        cantidad: bet,
        estado: isWin ? 'GANADA' : 'PERDIDA',
        tipoApuesta: 'SLOT_MACHINE',
        fechaApuesta: new Date().toISOString(),
        winloss: isWin ? amount : -bet,
        valorApostado: 'spin',
        valorGanador: isWin ? 'combination' : 'none'
      };
      
      await betService.createBet(betData);
    } catch (err) {
      console.error('Error recording bet:', err);
    }
  };
  
  // Load user balance
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserBalance();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Get a random symbol based on weights
  const getRandomSymbol = () => {
    // Sum of all weights
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    // Generate a random number between 0 and the sum of all weights
    let randomNum = Math.random() * totalWeight;
    
    // Find which symbol this random number corresponds to
    for (const symbol of symbols) {
      const weight = weights[symbol.id];
      if (randomNum < weight) {
        return symbol.id;
      }
      randomNum -= weight;
    }
    
    // Fallback (should never reach here)
    return 'cherry';
  };

  // For testing/rigging the game (comment out in production)
  const getTestSymbol = (reelIndex) => {
    // This can be used to test specific combinations
    // For example, to test a jackpot:
    // return 'seven';
    
    // To test different symbols on different reels:
    // if (reelIndex === 0) return 'cherry';
    // if (reelIndex === 1) return 'cherry';
    // if (reelIndex === 2) return 'bell';
    
    // Return random symbol by default
    return getRandomSymbol();
  };
  
  // Spin animation for a single reel
  const spinReel = (reelIndex, duration = 2000, callback) => {
    // Set reel to spinning state
    setReelState(prev => {
      const newState = [...prev];
      newState[reelIndex] = { ...newState[reelIndex], spinning: true };
      return newState;
    });
    
    // Animate spinning by quickly changing symbols
    const spinInterval = setInterval(() => {
      setReelState(prev => {
        const newState = [...prev];
        newState[reelIndex] = { 
          ...newState[reelIndex],
          symbol: getRandomSymbol()
        };
        return newState;
      });
    }, 100);
    
    // Stop spinning after duration
    setTimeout(() => {
      clearInterval(spinInterval);
      
      // Set final symbol based on weighted random selection
      // const finalSymbol = getTestSymbol(reelIndex); // For testing specific combinations
      const finalSymbol = getRandomSymbol();
      
      setReelState(prev => {
        const newState = [...prev];
        newState[reelIndex] = { 
          spinning: false, 
          symbol: finalSymbol 
        };
        return newState;
      });
      
      if (callback) callback(finalSymbol);
    }, duration);
  };
  
  // Calculate winnings based on the symbols
  const calculateWinnings = (symbols) => {
    // Check for three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      switch (symbols[0]) {
        case 'seven':
          return { win: true, amount: bet * 50 }; // Jackpot
        case 'bar':
          return { win: true, amount: bet * 20 };
        case 'bell':
          return { win: true, amount: bet * 15 };
        case 'plum':
        case 'orange':
          return { win: true, amount: bet * 10 };
        case 'lemon':
        case 'cherry':
          return { win: true, amount: bet * 5 };
        default:
          return { win: false, amount: 0 };
      }
    }
    
    // Check for two cherries
    if (
      (symbols[0] === 'cherry' && symbols[1] === 'cherry') ||
      (symbols[1] === 'cherry' && symbols[2] === 'cherry') ||
      (symbols[0] === 'cherry' && symbols[2] === 'cherry')
    ) {
      return { win: true, amount: bet * 2 };
    }
    
    // Any one cherry
    if (symbols.includes('cherry')) {
      return { win: true, amount: bet * 1 };
    }
    
    return { win: false, amount: 0 };
  };

  const handleSpin = () => {
    if (spinning) return;
    
    if (balance < bet) {
      setError('Insufficient balance to place bet');
      return;
    }
    
    try {
      // Clear previous messages
      setMessage('');
      setError('');
      
      // Deduct bet amount from balance
      updateBalance(currentBalance => currentBalance - bet);
      
      // Record the bet
      recordBet(false);
      
      // Start spinning
      setSpinning(true);
      
      // Store final symbols for result calculation
      const finalSymbols = [];
      
      // Calculate probability for logging/debugging
      const jackpotProbability = (weights['seven'] / Object.values(weights).reduce((sum, w) => sum + w, 0)) ** 3 * 100;
      console.log(`Jackpot probability: ${jackpotProbability.toFixed(4)}%`);
      
      // Spin each reel with staggered timing
      spinReel(0, 2000, (symbol) => {
        finalSymbols[0] = symbol;
        
        // When all reels have stopped
        if (finalSymbols.length === 3) {
          handleSpinComplete(finalSymbols);
        }
      });
      
      setTimeout(() => {
        spinReel(1, 2500, (symbol) => {
          finalSymbols[1] = symbol;
          
          // When all reels have stopped
          if (finalSymbols.length === 3) {
            handleSpinComplete(finalSymbols);
          }
        });
      }, 300);
      
      setTimeout(() => {
        spinReel(2, 3000, (symbol) => {
          finalSymbols[2] = symbol;
          
          // When all reels have stopped
          if (finalSymbols.length === 3) {
            handleSpinComplete(finalSymbols);
          }
        });
      }, 600);
      
    } catch (err) {
      setError('Error spinning the reels. Please try again.');
      console.error('Error spinning:', err);
      setSpinning(false);
    }
  };

  // Handle the result when all reels have stopped
  const handleSpinComplete = (symbols) => {
    console.log('Final symbols:', symbols);
    
    // Calculate winnings
    const result = calculateWinnings(symbols);
    
    if (result.win) {
      setMessage(`You won $${result.amount}!`);
      updateBalance(currentBalance => currentBalance + result.amount);
      recordBet(true, result.amount);
    } else {
      setMessage('Better luck next time!');
    }
    
    setSpinning(false);
  };

  const handleBetChange = (amount) => {
    const newBet = Math.max(1, Math.min(100, bet + amount));
    setBet(newBet);
  };

  if (!isAuthenticated) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="warning">
          Please log in to play the Slot Machine.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  // Find the image URL for a symbol by its ID
  const getSymbolImage = (symbolId) => {
    const symbol = symbols.find(s => s.id === symbolId);
    return symbol ? symbol.image : '';
  };

  return (
    <Container className="text-center mt-4 slot-machine-container">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-3">
        <Col md={6} className="text-center">
          <div className="balance-display">
            <h4>Balance: ${balance.toFixed(2)}</h4>
          </div>
        </Col>
        <Col md={6} className="text-center">
          <div className="bet-controls">
            <Button variant="outline-secondary" onClick={() => handleBetChange(-5)} disabled={bet <= 5}>-</Button>
            <span className="mx-3 bet-amount">Bet: ${bet}</span>
            <Button variant="outline-secondary" onClick={() => handleBetChange(5)} disabled={bet >= 100}>+</Button>
          </div>
        </Col>
      </Row>
      
      {message && (
        <Row className="mb-3">
          <Col>
            <Alert variant={message.includes('won') ? 'success' : 'info'}>{message}</Alert>
          </Col>
        </Row>
      )}
      
      <Row className="justify-content-center mb-4">
        <Col md={10}>
          <div className="slot-machine">
            {/* Decorative lights */}
            <div className="light-bottom-left"></div>
            <div className="light-bottom-right"></div>
            
            {/* Slot machine reels */}
            <div className="reels-container">
              {[0, 1, 2].map((reelIndex) => (
                <div 
                  key={reelIndex} 
                  className={`reel ${reelState[reelIndex].spinning ? 'spinning' : ''}`}
                  ref={reelIndex === 0 ? reel1Ref : reelIndex === 1 ? reel2Ref : reel3Ref}
                >
                  <div className="symbol-container">
                    <img 
                      src={getSymbolImage(reelState[reelIndex].symbol)} 
                      alt={reelState[reelIndex].symbol}
                      className="symbol-image" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
      
      <Row className="justify-content-center">
        <Col md={6}>
          <Button 
            variant="primary" 
            size="lg" 
            className="spin-button"
            onClick={handleSpin}
            disabled={spinning || balance < bet}
          >
            {spinning ? 'Spinning...' : 'SPIN'}
          </Button>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <div className="payout-table">
            <h4>Payout Table</h4>
            <div className="payout-grid">
              <div className="payout-row">
                <div className="combination">
                  <img src={sevenImg} alt="Seven" className="payout-symbol" />
                  <img src={sevenImg} alt="Seven" className="payout-symbol" />
                  <img src={sevenImg} alt="Seven" className="payout-symbol" />
                  <span>Three Sevens</span>
                </div>
                <div className="multiplier">50x</div>
                <div className="probability">1 in {Math.round(1/((weights['seven']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={barImg} alt="Bar" className="payout-symbol" />
                  <img src={barImg} alt="Bar" className="payout-symbol" />
                  <img src={barImg} alt="Bar" className="payout-symbol" />
                  <span>Three Bars</span>
                </div>
                <div className="multiplier">20x</div>
                <div className="probability">1 in {Math.round(1/((weights['bar']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={bellImg} alt="Bell" className="payout-symbol" />
                  <img src={bellImg} alt="Bell" className="payout-symbol" />
                  <img src={bellImg} alt="Bell" className="payout-symbol" />
                  <span>Three Bells</span>
                </div>
                <div className="multiplier">15x</div>
                <div className="probability">1 in {Math.round(1/((weights['bell']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={plumImg} alt="Plum" className="payout-symbol" />
                  <img src={plumImg} alt="Plum" className="payout-symbol" />
                  <img src={plumImg} alt="Plum" className="payout-symbol" />
                  <span>Three Fruits (Plum)</span>
                </div>
                <div className="multiplier">10x</div>
                <div className="probability">1 in {Math.round(1/((weights['plum']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={orangeImg} alt="Orange" className="payout-symbol" />
                  <img src={orangeImg} alt="Orange" className="payout-symbol" />
                  <img src={orangeImg} alt="Orange" className="payout-symbol" />
                  <span>Three Fruits (Orange)</span>
                </div>
                <div className="multiplier">10x</div>
                <div className="probability">1 in {Math.round(1/((weights['orange']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={lemonImg} alt="Lemon" className="payout-symbol" />
                  <img src={lemonImg} alt="Lemon" className="payout-symbol" />
                  <img src={lemonImg} alt="Lemon" className="payout-symbol" />
                  <span>Three Lemons</span>
                </div>
                <div className="multiplier">5x</div>
                <div className="probability">1 in {Math.round(1/((weights['lemon']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={cherryImg} alt="Cherry" className="payout-symbol" />
                  <img src={cherryImg} alt="Cherry" className="payout-symbol" />
                  <img src={cherryImg} alt="Cherry" className="payout-symbol" />
                  <span>Three Cherries</span>
                </div>
                <div className="multiplier">5x</div>
                <div className="probability">1 in {Math.round(1/((weights['cherry']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} spins</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={cherryImg} alt="Cherry" className="payout-symbol" />
                  <img src={cherryImg} alt="Cherry" className="payout-symbol" />
                  <span>Two Cherries (anywhere)</span>
                </div>
                <div className="multiplier">2x</div>
                <div className="probability">1 in 7 spins (approx)</div>
              </div>
              
              <div className="payout-row">
                <div className="combination">
                  <img src={cherryImg} alt="Cherry" className="payout-symbol" />
                  <span>One Cherry (anywhere)</span>
                </div>
                <div className="multiplier">1x</div>
                <div className="probability">1 in 2 spins (approx)</div>
              </div>
            </div>
            
            <div className="odds-explanation mt-4">
              <h5>How the Odds Work</h5>
              <p>Each symbol has a different probability of appearing:</p>
              <ul className="odds-list">
                {Object.entries(weights).map(([symbol, weight]) => {
                  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
                  const percentage = (weight / totalWeight * 100).toFixed(1);
                  const symbolImg = symbols.find(s => s.id === symbol).image;
                  return (
                    <li key={symbol}>
                      <img src={symbolImg} alt={symbol} className="odds-symbol" />
                      <span>{symbol.charAt(0).toUpperCase() + symbol.slice(1)}: {percentage}% chance ({weight}/{totalWeight})</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3">
                The jackpot (three sevens) has approximately a 1 in {Math.round(1/((weights['seven']/Object.values(weights).reduce((sum, w) => sum + w, 0))**3))} chance of hitting.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SlotMachine;