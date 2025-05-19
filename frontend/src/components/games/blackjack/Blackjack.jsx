import React, { useState, useEffect } from 'react';
import { Container, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import Status from './Status';
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

const Blackjack = () => {
  const { user, isAuthenticated } = useAuth();
  
  const GameState = {
    bet: 0,
    init: 1,
    userTurn: 2,
    dealerTurn: 3
  };

  const Deal = {
    user: 0,
    dealer: 1,
    hidden: 2
  };

  const Message = {
    bet: 'Place a Bet!',
    hitStand: 'Hit or Stand?',
    bust: 'Bust!',
    userWin: 'You Win!',
    dealerWin: 'Dealer Wins!',
    tie: 'Tie!'
  };

  const data = JSON.parse(JSON.stringify(jsonData.cards));
  const [deck, setDeck] = useState(data);

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

  // Load user balance from the server
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserBalance();
    }
  }, [isAuthenticated, user]);

  // Effect to show popup when message changes
  useEffect(() => {
    // Only show popup for important game messages
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

  useEffect(() => {
    calculate(userCards, setUserScore);
    setUserCount(userCount + 1);
  }, [userCards]);

  useEffect(() => {
    calculate(dealerCards, setDealerScore);
    setDealerCount(dealerCount + 1);
  }, [dealerCards]);

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

  const resetGame = () => {
    console.clear();
    setDeck(data);

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
  }

  const placeBet = async (amount) => {
    try {
      // Deduct from balance on the server
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
  }

  const drawCard = (dealType) => {
    if (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck[randomIndex];
      deck.splice(randomIndex, 1);
      setDeck([...deck]);
      console.log('Remaining Cards:', deck.length);
      switch (card.suit) {
        case 'spades':
          dealCard(dealType, card.value, '♠');
          break;
        case 'diamonds':
          dealCard(dealType, card.value, '♦');
          break;
        case 'clubs':
          dealCard(dealType, card.value, '♣');
          break;
        case 'hearts':
          dealCard(dealType, card.value, '♥');
          break;
        default:
          break;
      }
    }
    else {
      alert('All cards have been drawn');
    }
  }

  const dealCard = (dealType, value, suit) => {
    switch (dealType) {
      case Deal.user:
        userCards.push({ 'value': value, 'suit': suit, 'hidden': false });
        setUserCards([...userCards]);
        break;
      case Deal.dealer:
        dealerCards.push({ 'value': value, 'suit': suit, 'hidden': false });
        setDealerCards([...dealerCards]);
        break;
      case Deal.hidden:
        dealerCards.push({ 'value': value, 'suit': suit, 'hidden': true });
        setDealerCards([...dealerCards]);
        break;
      default:
        break;
    }
  }

  const revealCard = () => {
    dealerCards.filter((card) => {
      if (card.hidden === true) {
        card.hidden = false;
      }
      return card;
    });
    setDealerCards([...dealerCards])
  }

  const calculate = (cards, setScore) => {
    let total = 0;
    cards.forEach((card) => {
      if (card.hidden === false && card.value !== 'A') {
        switch (card.value) {
          case 'K':
            total += 10;
            break;
          case 'Q':
            total += 10;
            break;
          case 'J':
            total += 10;
            break;
          default:
            total += Number(card.value);
            break;
        }
      }
    });
    const aces = cards.filter((card) => {
      return card.value === 'A';
    });
    aces.forEach((card) => {
      if (card.hidden === false) {
        if ((total + 11) > 21) {
          total += 1;
        }
        else if ((total + 11) === 21) {
          if (aces.length > 1) {
            total += 1;
          }
          else {
            total += 11;
          }
        }
        else {
          total += 11;
        }
      }
    });
    setScore(total);
  }

  const hit = () => {
    drawCard(Deal.user);
  }

  const stand = () => {
    buttonState.hitDisabled = true;
    buttonState.standDisabled = true;
    buttonState.resetDisabled = false;
    setButtonState({ ...buttonState });
    setGameState(GameState.dealerTurn);
    revealCard();
  }

  const bust = () => {
    buttonState.hitDisabled = true;
    buttonState.standDisabled = true;
    buttonState.resetDisabled = false;
    setButtonState({ ...buttonState });
    setMessage(Message.bust);
    
    // Record the loss bet
    recordBet(false);
  }

  const recordBet = async (isWin, tieGame = false) => {
    if (!user?.id) return;

    try {
      // Create bet record
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
      
      console.log('Attempting to record bet with data:', betData);
      const response = await betService.createBet(betData);
      console.log('Bet recorded successfully, server response:', response);
    } catch (err) {
      console.error('Error recording bet:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to record bet: ${err.response?.data?.message || err.message}`);
    }
  };

  const checkWin = async () => {
    try {
      let newBalance = balance;
      let isWin = false;
      let isTie = false;
      
    if (userScore > dealerScore || dealerScore > 21) {
        // Player wins
        newBalance = balance + (bet * 2);
      setMessage(Message.userWin);
        isWin = true;
    }
      else if (userScore < dealerScore) {
        // Dealer wins
      setMessage(Message.dealerWin);
    }
    else {
        // Tie
        newBalance = balance + bet;
      setMessage(Message.tie);
        isTie = true;
      }
      
      // Update balance
      setBalance(newBalance);
      
      // Record bet result
      recordBet(isWin, isTie);
      
      // Update balance on server
      await userService.updateUserBalance(user.id, newBalance);
      
      buttonState.resetDisabled = false;
      setButtonState({ ...buttonState });
    } catch (err) {
      setError('Failed to update balance. Please contact support.');
      console.error('Error updating balance:', err);
    }
  }

  const toggleScores = () => {
    setShowScores(!showScores);
  };

  // Function to get score badge styling
  const getScoreBadgeStyle = (score) => {
    let bgColor = 'rgba(0,0,0,0.7)';
    let textColor = 'white';
    
    if (score > 21) {
      bgColor = 'rgba(220,53,69,0.9)'; // red for bust
      textColor = 'white';
    } else if (score === 21) {
      bgColor = 'rgba(255,215,0,0.9)'; // gold for 21
      textColor = 'black';
    } else if (score >= 17) {
      bgColor = 'rgba(40,167,69,0.9)'; // green for strong hand
      textColor = 'white';
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

  // Handle popup close
  const handlePopupClose = () => {
    setShowPopup(false);
  };

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
    <Container className="mt-4">
      {error && <div className="game-alert game-alert-danger">{error}</div>}
      
      <div className="game-container">
        {/* Background pattern */}
        <div className="pattern-overlay"></div>

        {/* Balance Display */}
        <div className="text-center mb-4">
          <div className="balance-display">
            <h1 className="mb-0 d-flex align-items-center">
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
    </Container>
  );
}

export default Blackjack;
