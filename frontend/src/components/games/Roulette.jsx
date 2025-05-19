import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Alert, Spinner, Badge } from 'react-bootstrap';
// Use the components from the library
import { RouletteTable } from '../../../react-casino-roulette/src/components/RouletteTable'; // Adjust path if needed
import {RouletteWheel} from '../../../react-casino-roulette/src/components/RouletteWheel'; // Adjust path if needed
import '../../../react-casino-roulette/dist/index.css'; // Adjust path if needed
import '../../assets/styles/Roulette.css'; // Import our new Roulette styles
import betService from '../../services/betService';
import rouletteService from '../../services/rouletteService';
import { useAuth } from '../../context/AuthContext';
import gameService from '../../services/gameService';
import userService from '../../services/userService';
// Import chips images (ensure paths are correct relative to Roulette.jsx)
import whiteChip from '../images/white-chip.png';
import blueChip from '../images/blue-chip.png';
import blackChip from '../images/black-chip.png';
import cyanChip from '../images/cyan-chip.png';
import flyingChips from '../images/flying-chips.png'; // Adjust the path as needed
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { FaChartBar } from 'react-icons/fa'; // Adjust the path as needed
import { GiAbstract013 } from 'react-icons/gi'; // Adjust the path as needed
import { FaHistory } from 'react-icons/fa';
// --- Constants and Helpers ---
// Chip values and icons
const chipsMap = {
  chip1: { icon: whiteChip, value: 1 },
  chip10: { icon: blueChip, value: 10 },
  chip100: { icon: blackChip, value: 100 },
  chip500: { icon: cyanChip, value: 500 },
};
const defaultChip = 'chip10'; // Default chip to start with

// American Roulette has 0 and 00. Numbers 1-36 have the same colors.
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Regex to identify betIds representing multi-number inside bets (split, street, corner, line, etc.)
const multiNumberBetRegex = /^\d+(-\d+)+$/;

// Helper function to determine if a bet is a special type that needs custom handling
const isSpecialBetType = (betId) => {
    return ['RED', 'BLACK', 'EVEN', 'ODD', '1_TO_18', '19_TO_36',
            '1ST_DOZEN', '2ND_DOZEN', '3RD_DOZEN',
            '1ST_COLUMN', '2ND_COLUMN', '3RD_COLUMN'].includes(betId);
};

// Function to get bet type and value for special bets
const getSpecialBetTypeAndValue = (betId) => {
    if (betId === 'RED' || betId === 'BLACK') {
        return { betType: 'color', betValue: betId === 'RED' ? '1' : '2' };
    } else if (betId === 'EVEN' || betId === 'ODD') {
        return { betType: 'parity', betValue: betId === 'EVEN' ? 'even' : 'odd' };
    } else if (betId === '1_TO_18' || betId === '19_TO_36') {
        return { betType: 'half', betValue: betId === '1_TO_18' ? 'low' : 'high' };
    } else if (betId === '1ST_DOZEN' || betId === '2ND_DOZEN' || betId === '3RD_DOZEN') {
        return { betType: 'dozen', betValue: betId === '1ST_DOZEN' ? '1' : betId === '2ND_DOZEN' ? '2' : '3' };
    } else if (betId === '1ST_COLUMN' || betId === '2ND_COLUMN' || betId === '3RD_COLUMN') {
        return { betType: 'column', betValue: betId === '1ST_COLUMN' ? '1' : betId === '2ND_COLUMN' ? '2' : '3' };
    }
    return null;
};

// Function to calculate total bet amount from the bets object
const calculateTotalBet = (bets) => {
  return Object.values(bets).reduce((acc, bet) => acc + bet.number, 0);
};


// --- Component ---

function RouletteGame() {
  const { user, updateUserBalance } = useAuth();
  const [userBalance, setUserBalance] = useState(0);
  const [bets, setBets] = useState({});
  const [activeChipKey, setActiveChipKey] = useState(defaultChip);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResultNumber, setSpinResultNumber] = useState();
  const [startSpin, setStartSpin] = useState(false);
  const [spinResults, setSpinResults] = useState(null);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [messageVisible, setMessageVisible] = useState(false);
  const [betHistory, setBetHistory] = useState([]); // Recent winning numbers (for "Last Numbers" display)
  const [gameHistory, setGameHistory] = useState([]); // User's past bet results for this game (for "Your Recent Bets" display)
  const [gameInfo, setGameInfo] = useState(null);
  // --- Effects ---
    useEffect(() => {
        const fetchBalance = async () => {
            if (user?.id) {
                try {
                    const balance = await userService.getUserBalance(user.id);
                    setUserBalance(balance);
                } catch (error) {
                    console.error("Failed to fetch initial balance:", error);
                    setUserBalance(0);
                    setMessage({ text: 'Could not fetch balance.', type: 'danger' });
                }
            }
        };
        fetchBalance();
    }, [user?.id]);

    
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

    const fetchUserGameHistory = useCallback(async () => {
        if (!user?.id) return;
        try {
            const historyResponse = await betService.getUserGameBets(user.id, 1);
            const historyData = historyResponse.bets || historyResponse;
            if (Array.isArray(historyData)) {
                setGameHistory(historyData.slice(0, 10));
            } else {
                console.error("Fetched history data is not an array:", historyData);
                setGameHistory([]);
            }
        } catch (error) {
            console.error("Failed to fetch user game history:", error);
            setGameHistory([]);
        }
    }, [user?.id]);


  useEffect(() => {
    fetchUserGameHistory();
  }, [fetchUserGameHistory]);

  // Message visibility management
  useEffect(() => {
    if (message.text) {
      // When a new message is set, make it visible
      setMessageVisible(true);
      
      // If it's not a spinning message, set a timer to hide it
      if (!isSpinning || message.type !== 'info') {
        const visibilityTimer = setTimeout(() => {
          setMessageVisible(false);
        }, 5000);
        
        return () => clearTimeout(visibilityTimer);
      }
    }
  }, [message, isSpinning]);

  // --- Core Functions ---
  const handleChipChange = (chipKey) => {
    setActiveChipKey(chipKey);
  };

  const handleTableBet = ({ bet, payload, id }) => {
    if (isSpinning) return;
    const selectedChip = chipsMap[activeChipKey];
    if (!selectedChip) {
      console.error("Invalid active chip:", activeChipKey);
      return;
    }
    const chipValue = selectedChip.value;
    const chipIcon = selectedChip.icon;
    const currentTotalBet = calculateTotalBet(bets);
    const potentialTotal = currentTotalBet + chipValue;

    userService.getUserBalance(user.id).then(currentBalance => {
        if (potentialTotal > currentBalance) {
            setMessage({ text: "Insufficient balance for this bet.", type: 'warning' });
            setUserBalance(currentBalance);
        } else {
            setBets(prevBets => {
                const newBets = { ...prevBets };
                if (newBets[id]) {
                    newBets[id] = {
                        ...newBets[id],
                        number: newBets[id].number + chipValue,
                        icon: chipIcon
                    };
                } else {
                    newBets[id] = { number: chipValue, icon: chipIcon };
                }
                return newBets;
            });
            setUserBalance(currentBalance);
            setMessage({ text: '', type: 'info' });
        }
    }).catch(err => {
        console.error("Error fetching balance during bet placement:", err);
        setMessage({ text: 'Error checking balance.', type: 'danger' });
    });
};

  const clearAllBets = () => {
    if (isSpinning) return;
    setBets({});
    setMessage({ text: 'Bets cleared.', type: 'info' });
  };

const handleSpinClick = async () => {
    const originalBetsState = bets;
    const totalBetAmount = calculateTotalBet(originalBetsState);
    const numberOfVisualBets = Object.keys(originalBetsState).length;

    if (isSpinning || numberOfVisualBets === 0) {
        if (numberOfVisualBets === 0) setMessage({ text: 'Place your bets first!', type: 'warning' });
        return;
    }

    let currentBalance;
    try {
        currentBalance = await userService.getUserBalance(user.id);
        setUserBalance(currentBalance);
    } catch {
        setMessage({ text: 'Could not verify balance before spin.', type: 'danger' });
        return;
    }

    if (totalBetAmount > currentBalance) {
        setMessage({ text: `Total bet ($${totalBetAmount.toFixed(2)}) exceeds balance ($${currentBalance.toFixed(2)})!`, type: 'danger' });
        return;
    }

    setIsSpinning(true);
    
    // Display spinning message - this will stay visible during the spin
    setMessage({ text: 'Wheel is spinning! Good luck!', type: 'spinning' });
    setStartSpin(false);

    try {
        let apiResponse;
        let finalWinningNumber = "";
        let finalTotalWinLoss = 0;

        const betsToProcess = Object.entries(originalBetsState).flatMap(([betId, betData]) => {
            if (isSpecialBetType(betId)) {
                const specialBet = getSpecialBetTypeAndValue(betId);
                if (specialBet) {
                    return [{ userId: user.id, amount: betData.number, betType: specialBet.betType, betValue: specialBet.betValue }];
                }
            }
            else if (multiNumberBetRegex.test(betId)) {
                 const numbers = betId.split('-');
                 return numbers.map(num => ({ userId: user.id, amount: betData.number / numbers.length, betType: 'number', betValue: String(num) })); // Example: split amount
            }
            else if (/^\d+$/.test(betId) || betId === '00') {
                return [{ userId: user.id, amount: betData.number, betType: 'number', betValue: betId }];
            } else {
                console.warn("Unknown bet type ID:", betId);
                return [];
            }
        });

        if (betsToProcess.length === 0) {
             const messageText = numberOfVisualBets > 0 ? "Could not process any of the placed bets." : "Place your bets first!";
             setMessage({ text: messageText, type: 'warning' });
             setIsSpinning(false);
             return;
        }

        const isSingleSimpleBet = numberOfVisualBets === 1 &&
                                 !multiNumberBetRegex.test(Object.keys(originalBetsState)[0]) &&
                                 betsToProcess.length === 1;

        if (isSingleSimpleBet) {
            apiResponse = await rouletteService.play(betsToProcess[0]);
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.resolvedBet?.winloss ?? apiResponse.totalWinLoss ?? 0;
        } else {
            if (betsToProcess.length < 1) {
                throw new Error("No valid bets to send to the multi-bet API.");
            }
            apiResponse = await rouletteService.playMultibet(betsToProcess);
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.totalWinLoss ?? 0;
        }

        if (finalWinningNumber === null || finalWinningNumber === undefined) {
            throw new Error(apiResponse?.message || "Backend did not return a valid winning number.");
        }

        const updatedUser = await userService.getUserById(user.id);
        const finalBackendBalance = updatedUser.balance;
        setUserBalance(finalBackendBalance);

        setSpinResults({
            winningNumber: String(finalWinningNumber),
            profit: Number(finalTotalWinLoss),
            finalBalance: finalBackendBalance
        });
        setSpinResultNumber(String(finalWinningNumber));
        setStartSpin(true);

    } catch (error) {
        console.error("Error during spin:", error);
        const errorMsg = error.response?.data?.message || error.message || 'Spin failed. Please try again.';
        setMessage({ text: errorMsg, type: 'danger' });
        setIsSpinning(false);
        setStartSpin(false);
        try {
            const currentBalanceOnError = await userService.getUserBalance(user.id);
            setUserBalance(currentBalanceOnError);
        } catch (balanceError) {
            console.error("Failed to re-fetch balance after spin error:", balanceError);
        }
    }
};

const handleSpinEnd = () => {
    if (spinResults) {
        const { winningNumber, profit } = spinResults;
        if (profit > 0) {
            confetti({ particleCount: 250, spread: 70, origin: { y: 0.6 } });
        }
        
        // Maintain the same message position by keeping messageVisible true
        // Don't reset messageVisible during this transition
        const winLossText = profit === 0 ? 'No change.' : `You ${profit > 0 ? 'won' : 'lost'} $${Math.abs(profit).toFixed(2)}.`;
        setMessage({
            text: `Landed on: ${winningNumber}. ${winLossText}`,
            type: profit > 0 ? 'success' : profit < 0 ? 'danger' : 'info',
        });
        // Make sure message is visible - don't let it disappear between transitions
        setMessageVisible(true);
        
        setBetHistory(prev => [winningNumber, ...prev.slice(0, 14)]);
        fetchUserGameHistory();
        setSpinResults(null);
    } else {
        if (message.type !== 'danger') {
            // Keep the message visible when updating to "Spin complete"
            setMessage({ text: 'Spin complete.', type: 'info' });
            setMessageVisible(true);
        }
    }
    setIsSpinning(false);
    setStartSpin(false);
    setBets({});
};

  const getNumberColor = (number) => {
      if (number === '00' || number === '0') return 'green';
      const num = parseInt(number, 10);
      if (isNaN(num)) return 'black';
      if (redNumbers.includes(num)) return 'red';
      return 'black';
  };

  const totalBetDisplay = calculateTotalBet(bets);

  const maxHeightForFiveItems = '340px';
  return (
    <Container fluid className="roulette-container py-4">

        {/* Floating message */}
        {message.text && (
          <div 
            className={`floating-message alert alert-${message.type} ${!messageVisible ? 'hidden' : ''} ${isSpinning && message.type === 'spinning' ? 'spinning-message' : ''}`}
            style={{
              opacity: messageVisible ? 0.95 : 0,
              borderColor: message.type === 'success' ? 'var(--success-color)' : 
                           message.type === 'danger' ? 'var(--danger-color)' : 
                           message.type === 'warning' ? '#f59e0b' : 
                           message.type === 'spinning' ? 'gold' : '#0d6efd'
            }}
          >
            {message.text}
            {isSpinning && message.type === 'spinning' && (
              <div className="spinner-dots mt-2 d-flex justify-content-center">
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="mx-1" />
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="mx-1" />
                <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" className="mx-1" />
              </div>
            )}
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


        

        <Row className="mb-3"> {/* Balance Display */}
            <Col>
            <Card className="bg-dark text-light balance-card ">
                <Card.Body className="d-flex justify-content-between align-items-center py-2">
                <h5 className="mb-0 ">Balance: <span className="fw-bold text-accent">${userBalance.toFixed(2)}</span></h5>
                {totalBetDisplay > 0 && (
                    <div className="text-end">
                        <span className="me-3">Current Bet: ${totalBetDisplay.toFixed(2)}</span>
                    </div>
                )}
                </Card.Body>
            </Card>
            </Col>
        </Row>

        {/* Main Layout Row */}
        <Row className="roulette-main-layout-row">

            {/* Section 1 (DOM order): Chip Selector */}
            {/* Large Screen: order-md-1 (Left) */}
            {/* Small Screen: REQUIRES CSS order: 1 (User must update CSS) */}
            <Col xs={12} md={3} className="chip-section order-md-1 mb-3 mb-md-0">
                <Card className="mb-3">
                    <Card.Header>Select Chip</Card.Header>
                    <Card.Body className="chip-selector-body">
                        <div className="d-flex justify-content-around align-items-center flex-wrap p-2">
                            {Object.entries(chipsMap).map(([key, { icon, value }]) => (
                            <div
                                key={key}
                                data-name={key}
                                className={`chip-container ${activeChipKey === key ? 'active' : ''}`}
                                onClick={() => handleChipChange(key)}
                                title={`Select $${value} chip`}
                            >
                                <img width={45} height={45} src={icon} alt={`$${value} chip`} className="chip-image"/>
                            </div>
                            ))}
                        </div>
                        <div className="text-center mt-2 text-white-50">
                            Selected: ${chipsMap[activeChipKey]?.value || 'N/A'}
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Section 2 (DOM order): Wheel */}
            {/* Large Screen: order-md-2 (Center) */}
            {/* Small Screen: REQUIRES CSS order: 2 (User must update CSS) */}
            <Col xs={12} md={6} className="wheel-section order-md-2 mb-3 mb-md-0">
                {/* Applying z-index for potential overlap with Last Numbers. Better in CSS. */}
                <div className="roulette-wheel-wrapper" style={{ position: 'relative', zIndex: 10 }}>
                    <RouletteWheel
                        start={startSpin}
                        winningBet={spinResultNumber}
                        onSpinningEnd={handleSpinEnd}
                    />
                    <div className="roulette-wheel-shadow"></div>
                </div>
                <div className="d-flex justify-content-center w-100 mb-3">
                    <Button variant="outline-danger" size="lg" onClick={clearAllBets} disabled={isSpinning || Object.keys(bets).length === 0} className="me-3" style={{ minWidth: '130px'}}>
                        Clear Bets
                    </Button>
                    <Button variant="success" size="lg" onClick={handleSpinClick} disabled={isSpinning || Object.keys(bets).length === 0 || totalBetDisplay > userBalance} 
                      className={Object.keys(bets).length > 0 && !isSpinning ? 'spin-button-pulse' : ''}
                      style={{ minWidth: '130px'}}>
                        {isSpinning ? <><Spinner as="span" animation="border" size="sm" /> Spinning...</> : 'SPIN'}
                    </Button>
                </div>
            </Col>

            {/* Section 3 (DOM order): Last Numbers History */}
            {/* Large Screen: order-md-3 (Right) */}
            {/* Small Screen: No specific order in provided CSS, will likely appear FIRST due to order:0 default. User may need to add CSS order. */}
            <Col xs={12} md={3} sm={12} className="last-numbers-section order-md-3 ">
                 {/* Applying z-index for potential overlap. Better in CSS. */}
                <Card style={{ position: 'relative', zIndex: 1 }}>
                    <Card.Header>Last Numbers</Card.Header>
                    <Card.Body className="p-2 text-center history-numbers-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {betHistory.length > 0 ? (
                            <div className="history-numbers-container d-flex flex-wrap justify-content-center">
                                {betHistory.map((num, index) => (
                                    <span key={index} className={`history-number m-1 ${index === 0 ? 'win-flash' : ''}`} style={{ backgroundColor: getNumberColor(num), color: 'white' }} title={`Spin #${betHistory.length - index}`}>
                                        {num}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted p-3 d-block">No history yet.</span>
                        )}
                    </Card.Body>
                </Card>
            </Col>

            {/* Section 4 (DOM order): Betting Table */}
            {/* Large Screen: order-md-4 (Below first row, centered) */}
            {/* Small Screen: order: 3 (from existing CSS) */}
            <Col xs={12} md={12} lg={9} className="table-section order-md-4 mx-auto mb-3"> {/* Added mb-3 for spacing */}
                <Card>
                    <Card.Header className="text-center">Place Your Bets</Card.Header>
                    <Card.Body className="p-1 d-flex justify-content-center align-items-center roulette-table-card-body">
                        <div className="roulette-table-container" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                            <RouletteTable onBet={handleTableBet} bets={bets} american={true} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Section 5 (DOM order): User Bet History */}
            {/* Large Screen: order-md-5 (Below table, centered) */}
            {/* Small Screen: order: 4 (from existing CSS) */}
            {/* This section is now always after the table. */}
            <Col xs={12} md={12} lg={9} className="bet-history-section order-md-5 mx-auto mb-3">
            <Card className="text-white">
            <Card.Header>
                <FaHistory className="me-2" />
                Recent Bets
            </Card.Header>
            <Card.Body>
                {gameHistory.length > 0 ? (
                    <div style={{ maxHeight: maxHeightForFiveItems, overflowY: 'auto' }}> {/* SCROLL APPLIED HERE */}
                        {gameHistory.map((bet) => (
                            <div key={bet.id || `bet-${Math.random()}`} className={`recent-bet-item ${bet.status === 'won' ? 'win-highlight' : 'loss-highlight'}`}>
                                <div className="d-flex justify-content-around align-items-center">
                                <span className="text-white">
                                        {bet.amount ? `Bet: $${bet.amount}` : '0.00'}
                                    </span>
                                    <span>
                                        {bet.betType.toLowerCase() === 'color'
                                            ? bet.betValue=== '1' ? 
                                              <span className="roulette-bet-display roulette-bet-color-red">color: red</span> : 
                                              <span className="roulette-bet-display roulette-bet-color-black">color: black</span>
                                            : <span className={`roulette-bet-display roulette-bet-${bet.betType === 'number' ? 'number' : 'even-odd'}`}>
                                                {bet.betType}: {bet.betValue}
                                              </span>
                                        }
                                    </span>

                                    <Badge
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.35em 0.65em'
                                        }}
                                        bg={bet.status === 'won' ? 'success' : 'danger'}
                                    >
                                        {bet.status === 'won' ? 'WON' : 'LOST'}
                                        <span className="ms-1">
                                            $
                                            {typeof bet.winloss === 'number'
                                                ? Math.abs(bet.winloss).toFixed(2)
                                                : (bet.amount ? bet.amount.toFixed(2) : '0.00')
                                            }
                                        </span>
                                    </Badge>
                                </div>
                                <div
                                    className="text-white-50"
                                    style={{
                                        fontSize: '0.8em',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    Rolled: {bet.winningValue} | {bet.betDate ? new Date(bet.betDate).toLocaleString() : 'Unknown date'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted">No recent bets found.</p>
                )}
            </Card.Body>
        </Card>
            </Col>
        </Row>
    </Container>
  );
}
export default RouletteGame;