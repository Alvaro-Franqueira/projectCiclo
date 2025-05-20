import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import betService from '../../services/betService';
import '../../assets/styles/SlotMachine.css';

// Import slot machine symbols
import cherryImg from '../../components/images/cherry-icon.png';
import lemonImg from '../../components/images/lemon-icon.png';
import orangeImg from '../../components/images/orange-icon.png';
import plumImg from '../../components/images/plum-icon.png';
import bellImg from '../../components/images/bell-icon.png';
import sevenImg from '../../components/images/seven-icon.png';
import barImg from '../../components/images/bar-icon.png';

/**
 * Slot Machine Game Component
 * Implements a classic slot machine game with three reels, multiple symbols,
 * and various winning combinations. Features include:
 * - Weighted random symbol generation
 * - Animated spinning reels
 * - Multiple winning combinations with different payouts
 * - Real-time balance updates
 * - Bet history tracking
 * - Visual feedback for wins and losses
 */
const SlotMachine = () => {
  // ===== Hooks =====
  const { user, isAuthenticated } = useAuth();
  
  // ===== State =====
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
  
  // ===== Constants =====
  const duration = 2000;
  /**
   * Available symbols in the slot machine with their corresponding images
   */
  const symbols = [
    { id: 'cherry', image: cherryImg },
    { id: 'lemon', image: lemonImg },
    { id: 'orange', image: orangeImg },
    { id: 'plum', image: plumImg },
    { id: 'bell', image: bellImg },
    { id: 'seven', image: sevenImg },
    { id: 'bar', image: barImg }
  ];
  
  /**
   * Weight distribution for each symbol (higher number = more likely to appear)
   * Total weight = 35, so seven has 1/35 = ~2.9% chance to appear
   */
  const weights = {
    'cherry': 8,  // Most common - lowest payout
    'lemon': 7,
    'orange': 6,
    'plum': 6,
    'bell': 4,
    'bar': 3,
    'seven': 1    // Rarest - highest payout (jackpot)
  };
  
  /**
   * Current state of the reels
   * Each reel tracks its spinning state and current symbol
   */
  const [reelState, setReelState] = useState([
    { spinning: false, symbol: 'cherry' },
    { spinning: false, symbol: 'cherry' },
    { spinning: false, symbol: 'cherry' }
  ]);
  
  // ===== Effects =====
  
  /**
   * Load user balance on component mount
   */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserBalance();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // ===== Service Functions =====
  
  /**
   * Loads the current user's balance from the server
   */
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

  /**
   * Updates the user's balance on the server
   * @param {number|Function} newBalanceOrFn - New balance value or function to calculate it
   */
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

  /**
   * Records a bet in the user's history
   * @param {boolean} isWin - Whether the bet was a win
   * @param {number} amount - Amount won (if win) or lost (if loss)
   */
  const recordBet = async (isWin, amount) => {
    if (!user?.id) return;
    
    try {
      const betData = {
        userId: user.id,
        gameId: 7, // Slot Machine game ID
        amount: bet,
        status: isWin ? 'WON' : 'LOST',
        type: 'SLOT_MACHINE',
        betDate: new Date().toISOString(),
        winloss: isWin ? (amount-bet) : -bet,
        betValue: 'spin',
        winningValue: isWin ? reelState.map(reel => reel.symbol).join('-') : 'none'
      };
      
      if (isWin) {
        setBalance(balance => balance + betData.amount + betData.winloss);
      }
      
      await betService.createBet(betData);
    } catch (err) {
      console.error('Error recording bet:', err);
    }
  };
  
  // ===== Game Logic Functions =====
  
  /**
   * Generates a random symbol based on the defined weights
   * @returns {string} ID of the selected symbol
   */
  const getRandomSymbol = () => {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let randomNum = Math.random() * totalWeight;
    
    for (const symbol of symbols) {
      const weight = weights[symbol.id];
      if (randomNum < weight) {
        return symbol.id;
      }
      randomNum -= weight;
    }
    
    return 'cherry'; // Fallback
  };
  
  /**
   * Animates a single reel's spin
   * @param {number} reelIndex - Index of the reel to spin
   * @param {number} duration - Duration of the spin in milliseconds
   * @param {Function} callback - Function to call when spin completes
   */
  const spinReel = (reelIndex, duration, callback) => {
    setReelState(prev => {
      const newState = [...prev];
      newState[reelIndex] = { ...newState[reelIndex], spinning: true };
      return newState;
    });
    
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
  
  /**
   * Calculates winnings based on the final symbol combination
   * @param {string[]} symbols - Array of three symbol IDs
   * @returns {Object} Object containing win status and amount
   */
  const calculateWinnings = (symbols) => {
    // Three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      switch (symbols[0]) {
        case 'seven': return { win: true, amount: bet * 50 }; 
        case 'bar': return { win: true, amount: bet * 20 };
        case 'bell': return { win: true, amount: bet * 15 };
        case 'plum':
        case 'orange': return { win: true, amount: bet * 10 };
        case 'lemon':
        case 'cherry': return { win: true, amount: bet * 5 };
        default: return { win: false, amount: 0 };
      }
    }
    
    // Two cherries
    if (
      (symbols[0] === 'cherry' && symbols[1] === 'cherry') ||
      (symbols[1] === 'cherry' && symbols[2] === 'cherry') ||
      (symbols[0] === 'cherry' && symbols[2] === 'cherry')
    ) {
      return { win: true, amount: bet * 2 };
    }
    
    // One cherry
    if (symbols.includes('cherry')) {
      return { win: true, amount: bet * 1 };
    }
    
    return { win: false, amount: 0 };
  };

  // ===== Event Handlers =====
  
  /**
   * Handles the spin button click
   * Initiates the spinning animation and processes the result
   */
  const handleSpin = () => {
    if (spinning) return;
    
    if (balance < bet) {
      setError('Insufficient balance to place bet');
      return;
    }
    
    try {
      setMessage('');
      setError('');
      updateBalance(currentBalance => currentBalance - bet);
      setSpinning(true);
      
      const finalSymbols = [];
     
      // Spin reels with staggered timing
      spinReel(0, duration, (symbol) => {
        finalSymbols[0] = symbol;
        if (finalSymbols.length === 3) handleSpinComplete(finalSymbols);
      });
      
      setTimeout(() => {
        spinReel(1, 2500, (symbol) => {
          finalSymbols[1] = symbol;
          if (finalSymbols.length === 3) handleSpinComplete(finalSymbols);
        });
      }, 300);
      
      setTimeout(() => {
        spinReel(2, 3000, (symbol) => {
          finalSymbols[2] = symbol;
          if (finalSymbols.length === 3) handleSpinComplete(finalSymbols);
        });
      }, 600);
      
    } catch (err) {
      setError('Error spinning the reels. Please try again.');
      console.error('Error spinning:', err);
      setSpinning(false);
    }
  };

  /**
   * Handles the completion of a spin
   * Calculates and processes winnings
   * @param {string[]} symbols - Final symbol combination
   */
  const handleSpinComplete = (symbols) => {
    console.log('Final symbols:', symbols);
    const result = calculateWinnings(symbols);
    
    if (result.win) {
      setMessage(`You won $${result.amount}!`);
      recordBet(true, result.amount);
    } else {
      setMessage('Better luck next time!');
      recordBet(false);
    }
    
    setSpinning(false);
  };

  /**
   * Handles bet amount changes
   * @param {number} amount - Amount to adjust bet by
   */
  const handleBetChange = (amount) => {
    const newBet = Math.max(1, Math.min(100, bet + amount));
    setBet(newBet);
  };

  // ===== Helper Functions =====
  
  /**
   * Gets the image URL for a symbol by its ID
   * @param {string} symbolId - ID of the symbol
   * @returns {string} URL of the symbol's image
   */
  const getSymbolImage = (symbolId) => {
    const symbol = symbols.find(s => s.id === symbolId);
    return symbol ? symbol.image : '';
  };

  // ===== Render Functions =====
  
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

  return (
    <Container className="text-center mt-4 slot-machine-container">
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Balance and Bet Controls */}
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
      
      {/* Result Message */}
      {message && (
        <Row className="mb-3">
          <Col>
            <Alert variant={message.includes('won') ? 'success' : 'info'}>{message}</Alert>
          </Col>
        </Row>
      )}
      
      {/* Slot Machine Reels */}
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
      
      {/* Spin Button */}
      <Row className="justify-content-center">
        <Col md={6}>
          <Button 
            variant="success" 
            size="lg" 
            className="spin-button"
            onClick={handleSpin}
            disabled={spinning || balance < bet}
          >
            {spinning ? 'Spinning...' : 'SPIN'}
          </Button>
        </Col>
      </Row>
      
      {/* Payout Table */}
      <Row className="mt-4">
        <Col>
          <div className="payout-table">
            <h4>Payout Table</h4>
            <div className="payout-grid">
              {/* Three of a Kind Payouts */}
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
              
              {/* Fruit Combinations */}
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
              
              {/* Partial Cherry Combinations */}
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
            
            {/* Odds Explanation */}
            <div className="odds-explanation">
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