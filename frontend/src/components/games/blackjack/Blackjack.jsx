/**
 * Blackjack Game Component
 * Implements a full-featured Blackjack game with betting functionality,
 * card animations, and real-time balance updates.
 * 
 * Features:
 * - Multiple betting options with quick bet buttons
 * - Animated card dealing and flipping
 * - Real-time balance updates
 * - Bet history tracking
 * - Visual feedback for wins and losses
 * - Message popups for game events
 * - Score display with color coding
 * - Deck tracking
 */
import React, { useState, useEffect } from 'react';
import { Container, Alert } from 'react-bootstrap';
import Controls from './Controls';
import Hand from './Hand';
import MessagePopup from './MessagePopup';
import jsonData from '../../../utils/deck.json';
import { useAuth } from '../../../context/AuthContext';
import userService from '../../../services/userService';
import betService from '../../../services/betService';
import { FaChevronDown, FaCoins } from 'react-icons/fa';
import { GiPokerHand } from 'react-icons/gi';
import '../../../assets/styles/Blackjack.css';

// ===== Game Constants =====

/**
 * Game state enumeration
 * Controls the flow of the game and available actions
 */
const GameState = {
  bet: 0,      // Initial state, waiting for bet
  init: 1,     // Game initialization, dealing cards
  userTurn: 2, // Player's turn to hit or stand
  dealerTurn: 3 // Dealer's turn to play
};

/**
 * Card dealing types
 * Determines how cards are dealt and displayed
 */
const Deal = {
  user: 0,    // Deal to player's hand
  dealer: 1,  // Deal to dealer's visible hand
  hidden: 2   // Deal to dealer's hidden hand
};

/**
 * Game message constants
 * Used for displaying game status and results
 */
const Message = {
  bet: 'Place a Bet!',
  hitStand: 'Hit or Stand?',
  bust: 'Bust!',
  userWin: 'You Win!',
  dealerWin: 'Dealer Wins!',
  tie: 'Tie!'
};

// ===== Component =====

function Blackjack() {
  // ===== Hooks =====
  const { user, isAuthenticated } = useAuth();
  
  // ===== State =====
  const [deck, setDeck] = useState(JSON.parse(JSON.stringify(jsonData.cards)));
  const [userCards, setUserCards] = useState([]);
  const [userScore, setUserScore] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [dealerCards, setDealerCards] = useState([]);
  const [dealerScore, setDealerScore] = useState(0);
  const [dealerCount, setDealerCount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScores, setShowScores] = useState(true);
  const [gameState, setGameState] = useState(GameState.bet);
  const [message, setMessage] = useState(Message.bet);
  const [showPopup, setShowPopup] = useState(false);
  const [buttonState, setButtonState] = useState({
    hitDisabled: false,
    standDisabled: false,
    resetDisabled: true
  });

  // ===== Effects =====

  /**
   * Load user balance on component mount
   */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserBalance();
    }
  }, [isAuthenticated, user]);

  /**
   * Show popup for important game messages
   */
  useEffect(() => {
    if (
      message === Message.bust || 
      message === Message.userWin || 
      message === Message.dealerWin || 
      message === Message.tie ||
      message === Message.bet
    ) {
      setShowPopup(true);
    }
  }, [message]);

  /**
   * Initialize game and deal initial cards
   */
  useEffect(() => {
    if (gameState === GameState.init) {
      drawCard(Deal.user);
      drawCard(Deal.hidden);
      drawCard(Deal.user);
      drawCard(Deal.dealer);
      setGameState(GameState.userTurn);
      setMessage(Message.hitStand);
    }
  }, [gameState]);

  /**
   * Calculate and update user's score
   */
  useEffect(() => {
    calculate(userCards, setUserScore);
    setUserCount(userCount + 1);
  }, [userCards]);

  /**
   * Calculate and update dealer's score
   */
  useEffect(() => {
    calculate(dealerCards, setDealerScore);
    setDealerCount(dealerCount + 1);
  }, [dealerCards]);

  /**
   * Handle user's turn logic
   */
  useEffect(() => {
    if (gameState === GameState.userTurn) {
      if (userScore === 21) {
        buttonState.hitDisabled = true;
        setButtonState({ ...buttonState });
      }
      else if (userScore > 21) {
        bust();
      }
    }
  }, [userCount]);

  /**
   * Handle dealer's turn logic
   */
  useEffect(() => {
    if (gameState === GameState.dealerTurn) {
      if (dealerScore >= 17) {
        checkWin();
      }
      else {
        drawCard(Deal.dealer);
      }
    }
  }, [dealerCount]);

  // ===== Game Functions =====

  /**
   * Load user's current balance from the server
   */
  const loadUserBalance = async () => {
    try {
      setLoading(true);
      const balanceData = await userService.getUserBalance(user.id);
      setBalance(balanceData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load balance. Please refresh the page.');
      setLoading(false);
      console.error('Error loading balance:', err);
    }
  };

  /**
   * Reset the game state and clear all cards
   */
  const resetGame = () => {
    console.clear();
    setDeck(JSON.parse(JSON.stringify(jsonData.cards)));
    setUserCards([]);
    setUserScore(0);
    setUserCount(0);
    setDealerCards([]);
    setDealerScore(0);
    setDealerCount(0);
    setBet(0);
    setGameState(GameState.bet);
    setMessage(Message.bet);
    setButtonState({
      hitDisabled: false,
      standDisabled: false,
      resetDisabled: true
    });
  };

  /**
   * Place a bet and start the game
   * @param {number} amount - The bet amount
   */
  const placeBet = async (amount) => {
    try {
      const newBalance = balance - amount;
      await userService.updateUserBalance(user.id, newBalance);
      setBet(amount);
      setBalance(newBalance);
      setGameState(GameState.init);
      setError('');
    } catch (err) {
      setError('Failed to place bet. Please try again.');
      console.error('Error placing bet:', err);
    }
  };

  /**
   * Draw a card from the deck
   * @param {number} dealType - The type of deal (user, dealer, or hidden)
   */
  const drawCard = (dealType) => {
    if (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck[randomIndex];
      deck.splice(randomIndex, 1);
      setDeck([...deck]);
      console.log('Remaining Cards:', deck.length);
      
      const suitSymbol = {
        'spades': '♠',
        'diamonds': '♦',
        'clubs': '♣',
        'hearts': '♥'
      }[card.suit];
      
      dealCard(dealType, card.value, suitSymbol);
    }
    else {
      alert('All cards have been drawn');
    }
  };

  /**
   * Deal a card to the specified hand
   * @param {number} dealType - The type of deal
   * @param {string} value - The card value
   * @param {string} suit - The card suit symbol
   */
  const dealCard = (dealType, value, suit) => {
    const newCard = { value, suit, hidden: dealType === Deal.hidden };
    
    switch (dealType) {
      case Deal.user:
        setUserCards(prev => [...prev, newCard]);
        break;
      case Deal.dealer:
      case Deal.hidden:
        setDealerCards(prev => [...prev, newCard]);
        break;
    }
  };

  /**
   * Reveal the dealer's hidden card
   */
  const revealCard = () => {
    setDealerCards(prev => prev.map(card => ({
      ...card,
      hidden: false
    })));
  };

  /**
   * Calculate the score for a hand
   * @param {Array} cards - The cards in the hand
   * @param {Function} setScore - Function to update the score
   */
  const calculate = (cards, setScore) => {
    let total = 0;
    const aces = [];
    
    // Calculate non-ace cards first
    cards.forEach(card => {
      if (!card.hidden && card.value !== 'A') {
        total += ['K', 'Q', 'J'].includes(card.value) ? 10 : Number(card.value);
      }
      if (card.value === 'A') {
        aces.push(card);
      }
    });
    
    // Handle aces
    aces.forEach(card => {
      if (!card.hidden) {
        if (total + 11 > 21) {
          total += 1;
        } else if (total + 11 === 21 && aces.length > 1) {
          total += 1;
        } else {
          total += 11;
        }
      }
    });
    
    setScore(total);
  };

  /**
   * Player hits and draws a new card
   */
  const hit = () => {
    drawCard(Deal.user);
  };

  /**
   * Player stands and dealer's turn begins
   */
  const stand = () => {
    setButtonState({
      ...buttonState,
      hitDisabled: true,
      standDisabled: true,
      resetDisabled: false
    });
    setGameState(GameState.dealerTurn);
    revealCard();
  };

  /**
   * Handle player bust
   */
  const bust = () => {
    setButtonState({
      ...buttonState,
      hitDisabled: true,
      standDisabled: true,
      resetDisabled: false
    });
    setMessage(Message.bust);
    recordBet(false);
  };

  /**
   * Record the bet result
   * @param {boolean} isWin - Whether the player won
   * @param {boolean} tieGame - Whether the game was a tie
   */
  const recordBet = async (isWin, tieGame = false) => {
    if (!user?.id) return;

    try {
      const betData = {
        userId: user.id,
        gameId: 9,
        amount: bet,
        status: isWin ? 'WON' : tieGame ? 'TIE' : 'LOST',
        type: 'BLACKJACK',
        betDate: new Date().toISOString(),
        winloss: isWin ? bet : -bet,
        betValue: userScore.toString(),
        winningValue: isWin ? userScore.toString() : dealerScore.toString()
      };
      
      console.log('Recording bet:', betData);
      const response = await betService.createBet(betData);
      console.log('Bet recorded:', response);
    } catch (err) {
      console.error('Error recording bet:', err);
      setError(`Failed to record bet: ${err.response?.data?.message || err.message}`);
    }
  };

  /**
   * Check the game result and update balance
   */
  const checkWin = async () => {
    try {
      let newBalance = balance;
      let isWin = false;
      let isTie = false;
      
      if (userScore > dealerScore || dealerScore > 21) {
        newBalance = balance + (bet * 2);
        setMessage(Message.userWin);
        isWin = true;
      }
      else if (userScore < dealerScore) {
        setMessage(Message.dealerWin);
      }
      else {
        newBalance = balance + bet;
        setMessage(Message.tie);
        isTie = true;
      }
      
      setBalance(newBalance);
      recordBet(isWin, isTie);
      await userService.updateUserBalance(user.id, newBalance);
      
      setButtonState({
        ...buttonState,
        resetDisabled: false
      });
    } catch (err) {
      setError('Failed to update balance. Please contact support.');
      console.error('Error updating balance:', err);
    }
  };

  /**
   * Toggle score display
   */
  const toggleScores = () => {
    setShowScores(!showScores);
  };

  /**
   * Get styling for score badge based on score value
   * @param {number} score - The score to style
   * @returns {Object} Style object for the badge
   */
  const getScoreBadgeStyle = (score) => {
    let bgColor = 'rgba(0,0,0,0.7)';
    let textColor = 'white';
    
    if (score > 21) {
      bgColor = 'rgba(220,53,69,0.9)'; // red for bust
    } else if (score === 21) {
      bgColor = 'rgba(255,215,0,0.9)'; // gold for 21
      textColor = 'black';
    } else if (score >= 17) {
      bgColor = 'rgba(40,167,69,0.9)'; // green for strong hand
    }
    
    return {
      backgroundColor: bgColor,
      color: textColor,
      padding: '4px 10px',
      borderRadius: '10px',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      display: 'inline-block',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      border: score === 21 ? '1px solid white' : 'none'
    };
  };

  /**
   * Handle popup close
   */
  const handlePopupClose = () => {
    setShowPopup(false);
  };

  // ===== Render Functions =====

  if (!isAuthenticated) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="warning">
          Please log in to play Blackjack.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="game-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <div>
    <div className="game-container">
      {error && <div className="game-alert game-alert-danger">{error}</div>}
      {/* Background pattern */}
        <div className="pattern-overlay"></div>

        {/* Balance Display */}
        <div>
          <div className="balance-display-bj">
            <h1>
              <FaCoins className="text-accent me-2" style={{ fontSize: '0.8em' }} />
              ${balance.toFixed(2)}
            </h1>
          </div>
        </div>

        {/* Game info */}
        <div className="game-info">
          <div className="bet-display">
            <FaCoins className="text-accent me-2" />
            <span>Current Bet: ${bet}</span>
          </div>
          <div className="cards-display">
            <GiPokerHand className="me-2" />
            <span>Cards: {deck.length}</span>
          </div>
        </div>

        {/* Main game content */}
        <div className="game-content">
          <div className="hand-container">
            <div className="hand-title-wrapper">
              <h2 className="hand-title">Dealer's Hand</h2>
              
              {/* Dealer score badge */}
              {dealerCards.length > 0 && dealerCards.some(card => !card.hidden) && (
                <div className="score-badge-container">
                  <div className="score-badge" style={getScoreBadgeStyle(dealerScore)}>
                    {dealerScore}
                  </div>
                </div>
              )}
            </div>
            <Hand title="" cards={dealerCards} />
          </div>

          <div className="table-divider"></div>

          <div className="hand-container">
            <div className="hand-title-wrapper">
              <h2 className="hand-title">Your Hand</h2>
              
              {/* Player score badge */}
              {userCards.length > 0 && (
                <div className="score-badge-container">
                  <div className="score-badge" style={getScoreBadgeStyle(userScore)}>
                    {userScore}
                  </div>
                </div>
              )}
            </div>
            <Hand title="" cards={userCards} />
          </div>

          <Controls
            balance={balance}
            gameState={gameState}
            buttonState={buttonState}
            betEvent={placeBet}
            hitEvent={hit}
            standEvent={stand}
            resetEvent={resetGame} />
        </div>
      </div>

      {/* Message Popup */}
      <MessagePopup 
        message={message} 
        isVisible={showPopup} 
        onClose={handlePopupClose}
      />  
    </div>
  );
}

export default Blackjack;
