import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Alert, Spinner, Badge } from 'react-bootstrap';
// Use the components from the library
import { RouletteTable } from '../../../react-casino-roulette/src/components/RouletteTable'; // Adjust path if needed
import {RouletteWheel} from '../../../react-casino-roulette/src/components/RouletteWheel'; // Adjust path if needed
import '../../../react-casino-roulette/dist/index.css'; // Adjust path if needed
import './Roulette.css'; // Your custom styles
import betService from '../../services/betService';
import ruletaService from '../../services/ruletaService';
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
        return { tipoApuesta: 'color', valorApuesta: betId === 'RED' ? '1' : '2' };
    } else if (betId === 'EVEN' || betId === 'ODD') {
        return { tipoApuesta: 'paridad', valorApuesta: betId === 'EVEN' ? 'par' : 'impar' };
    } else if (betId === '1_TO_18' || betId === '19_TO_36') {
        return { tipoApuesta: 'mitad', valorApuesta: betId === '1_TO_18' ? 'bajo' : 'alto' };
    } else if (betId === '1ST_DOZEN' || betId === '2ND_DOZEN' || betId === '3RD_DOZEN') {
        return { tipoApuesta: 'docena', valorApuesta: betId === '1ST_DOZEN' ? '1' : betId === '2ND_DOZEN' ? '2' : '3' };
    } else if (betId === '1ST_COLUMN' || betId === '2ND_COLUMN' || betId === '3RD_COLUMN') {
        return { tipoApuesta: 'columna', valorApuesta: betId === '1ST_COLUMN' ? '1' : betId === '2ND_COLUMN' ? '2' : '3' };
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
  const [betHistory, setBetHistory] = useState([]); // Recent winning numbers (for "Last Numbers" display)
  const [gameHistory, setGameHistory] = useState([]); // User's past bet results for this game (for "Your Recent Bets" display)

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
    setMessage({ text: 'Spinning...', type: 'info' });
    setStartSpin(false);

    try {
        let apiResponse;
        let finalWinningNumber = "";
        let finalTotalWinLoss = 0;

        const betsToProcess = Object.entries(originalBetsState).flatMap(([betId, betData]) => {
            if (isSpecialBetType(betId)) {
                const specialBet = getSpecialBetTypeAndValue(betId);
                if (specialBet) {
                    return [{ usuarioId: user.id, cantidad: betData.number, tipoApuesta: specialBet.tipoApuesta, valorApuesta: specialBet.valorApuesta }];
                }
            }
            else if (multiNumberBetRegex.test(betId)) {
                 const numbers = betId.split('-');
                 return numbers.map(num => ({ usuarioId: user.id, cantidad: betData.number / numbers.length, tipoApuesta: 'numero', valorApuesta: String(num) })); // Example: split amount
            }
            else if (/^\d+$/.test(betId) || betId === '00') {
                return [{ usuarioId: user.id, cantidad: betData.number, tipoApuesta: 'numero', valorApuesta: betId }];
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
            apiResponse = await ruletaService.jugar(betsToProcess[0]);
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.resolvedBet?.winloss ?? apiResponse.totalWinLoss ?? 0;
        } else {
            if (betsToProcess.length < 1) {
                throw new Error("No valid bets to send to the multi-bet API.");
            }
            apiResponse = await ruletaService.jugarMultibet(betsToProcess);
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
        const winLossText = profit === 0 ? 'No change.' : `You ${profit > 0 ? 'won' : 'lost'} $${Math.abs(profit).toFixed(2)}.`;
        setMessage({
            text: `Landed on: ${winningNumber}. ${winLossText}`,
            type: profit > 0 ? 'success' : profit < 0 ? 'danger' : 'info',
        });
        setBetHistory(prev => [winningNumber, ...prev.slice(0, 14)]);
        fetchUserGameHistory();
        setSpinResults(null);
    } else {
        if (message.type !== 'danger') {
            setMessage({ text: 'Spin complete.', type: 'info' });
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

  return (
    <Container fluid className="roulette-container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center titulon-ruleta">
            <GiAbstract013 size={50} />
            <h2 className='titulo-ruleta'>Roulette</h2>
            </div>
            <Link to="/profile" className="btn btn-outline-primary">
                <FaChartBar className="me-2" /> View My Statistics
            </Link>
        </div>

        <Row className="mb-3"> {/* Balance Display */}
            <Col>
            <Card className="bg-dark text-light balance-card">
                <Card.Body className="d-flex justify-content-between align-items-center py-2">
                <h5 className="mb-0">Balance: <span className="text-success fw-bold">${userBalance.toFixed(2)}</span></h5>
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
                <div className="roulette-wheel-wrapper mb-3" style={{ position: 'relative', zIndex: 10 }}>
                    <RouletteWheel
                        start={startSpin}
                        winningBet={spinResultNumber}
                        onSpinningEnd={handleSpinEnd}
                    />
                </div>
                <div className="d-flex justify-content-center w-100 mb-3">
                    <Button variant="outline-danger" size="lg" onClick={clearAllBets} disabled={isSpinning || Object.keys(bets).length === 0} className="me-3" style={{ minWidth: '130px'}}>
                        Clear Bets
                    </Button>
                    <Button variant="success" size="lg" onClick={handleSpinClick} disabled={isSpinning || Object.keys(bets).length === 0 || totalBetDisplay > userBalance} style={{ minWidth: '130px'}}>
                        {isSpinning ? <><Spinner as="span" animation="border" size="sm" /> Spinning...</> : 'SPIN'}
                    </Button>
                </div>
                <div className="result-message-area w-100 px-3" style={{ minHeight: '60px' }}>
                    {message.text && (<Alert variant={message.type} className="text-center py-2">{message.text}</Alert>)}
                </div>
            </Col>

            {/* Section 3 (DOM order): Last Numbers History */}
            {/* Large Screen: order-md-3 (Right) */}
            {/* Small Screen: No specific order in provided CSS, will likely appear FIRST due to order:0 default. User may need to add CSS order. */}
            <Col xs={12} md={3} className="last-numbers-section order-md-3 mb-3 mb-md-0">
                 {/* Applying z-index for potential overlap. Better in CSS. */}
                <Card style={{ position: 'relative', zIndex: 1 }}>
                    <Card.Header>Last Numbers</Card.Header>
                    <Card.Body className="p-2 text-center history-numbers-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {betHistory.length > 0 ? (
                            <div className="history-numbers-container d-flex flex-wrap justify-content-center">
                                {betHistory.map((num, index) => (
                                    <span key={index} className="history-number m-1" style={{ backgroundColor: getNumberColor(num), color: 'white' }} title={`Spin #${betHistory.length - index}`}>
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
            <Card className="text-white" style={{ backgroundColor: '#333' /* Example dark background */ }}>
            <Card.Header>
                <FaHistory className="me-2" />
                Recent Bets {/* Or "Recent Dice Bets" if specific */}
            </Card.Header>
            <Card.Body>
                {gameHistory.length > 0 ? (
                    <div>
                        {gameHistory.map((bet) => (
                            <div key={bet.id || `bet-${Math.random()}`} className="mb-2 p-2 border-bottom small">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span>
                                        {/*
                                            Adjust this logic based on your actual bet.tipoApuesta values.
                                            If bet.tipoApuesta is "Par" or "Impar", you might just want to show that.
                                            If it's a bet on a specific number, show "Número X".
                                        */}
                                        {bet.tipoApuesta.toLowerCase() === 'par' || bet.tipoApuesta.toLowerCase() === 'impar' || bet.tipoApuesta.toLowerCase() === 'parimpar'
                                            ? `Choice: ${bet.valorApostado}` // e.g., "Choice: Par"
                                            : `${bet.tipoApuesta}: ${bet.valorApostado}` // e.g., "Número: 5" or "Color: Rojo"
                                        }
                                        {/* Original amount wagered, if desired:
                                        <span className="text-muted ms-1">(${bet.cantidad?.toFixed(2)})</span>
                                        */}
                                    </span>
                                    <Badge
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.35em 0.65em' // Adjust padding for better appearance
                                        }}
                                        bg={bet.estado === 'GANADA' ? 'success' : 'danger'}
                                    >
                                        {bet.estado === 'GANADA' ? 'WON' : 'LOST'}
                                        <span className="ms-1"> {/* Added margin for separation */}
                                            $
                                            {/*
                                                The good example prefers winloss if available, then amount.
                                                Your old code showed winloss separately and wagered amount in ().
                                                This version shows the P/L or the wagered amount if P/L isn't clear.
                                            */}
                                            {typeof bet.winloss === 'number'
                                                ? Math.abs(bet.winloss).toFixed(2)
                                                : (bet.cantidad ? bet.cantidad.toFixed(2) : '0.00')
                                            }
                                        </span>
                                    </Badge>
                                </div>
                                <div
                                    className="text-white-50" // Using text-white-50 for a slightly dimmer date
                                    style={{
                                        fontSize: '0.8em',
                                        marginTop: '0.5rem'
                                    }}
                                >
                                    Rolled: {bet.valorGanador} | {bet.fechaApuesta ? new Date(bet.fechaApuesta).toLocaleString() : 'Unknown date'}
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