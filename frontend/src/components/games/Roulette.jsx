import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Alert, Spinner } from 'react-bootstrap';
// Use the components from the library
import { RouletteTable, RouletteWheel } from '../../../react-casino-roulette/src'; // Adjust path if needed
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
import bigWin from '../images/bigwin.png';
import { Link } from 'react-router-dom';
import { FaChartBar } from 'react-icons/fa'; // Adjust the path as needed


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

  // State for bets placed on the library's table (visual representation)
  const [bets, setBets] = useState({});

  // State for chip selection
  const [activeChipKey, setActiveChipKey] = useState(defaultChip); // e.g., 'chip10'

  // State for wheel animation and process
  const [isSpinning, setIsSpinning] = useState(false); // Tracks the entire spin process (API + animation)
  const [spinResultNumber, setSpinResultNumber] = useState(); // The actual winning number (string) after spin
  const [startSpin, setStartSpin] = useState(false); // Triggers the library wheel animation
  const [spinResults, setSpinResults] = useState(null); // Stores results between API call and spin end

  // UI/Feedback State
  const [message, setMessage] = useState({ text: '', type: 'info' }); // For displaying results/errors
  const [betHistory, setBetHistory] = useState([]); // Recent winning numbers
  const [gameHistory, setGameHistory] = useState([]); // User's past bet results for this game

  // --- Effects ---

  // Initialize balance from user context
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

   // Fetch user's bet history for Roulette (Game ID 1 assumed)
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

  // Handle chip selection
  const handleChipChange = (chipKey) => {
    setActiveChipKey(chipKey);
  };

  // Handle clicks on the RouletteTable component
  const handleTableBet = ({ bet, payload, id }) => {
    // Prevent betting while the wheel is spinning or API call is in progress
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

    // Check balance *before* updating state
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

  // Clear all bets from the table
  const clearAllBets = () => {
    if (isSpinning) return; // Prevent clearing while spinning
    setBets({});
    setMessage({ text: 'Bets cleared.', type: 'info' });
  };

// Start the spin process
const handleSpinClick = async () => {
    const originalBetsState = bets;
    const totalBetAmount = calculateTotalBet(originalBetsState);
    const numberOfVisualBets = Object.keys(originalBetsState).length;

    // Prevent spin if already spinning or no bets placed
    if (isSpinning || numberOfVisualBets === 0) {
        if (numberOfVisualBets === 0) setMessage({ text: 'Place your bets first!', type: 'warning' });
        return;
    }

    // Re-check balance right before spinning
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

    // Set isSpinning to true to disable UI and indicate process start
    setIsSpinning(true);
    setMessage({ text: 'Spinning...', type: 'info' });
    setStartSpin(false); // Ensure wheel doesn't start prematurely

    try {
        let apiResponse;
        let finalWinningNumber = "";
        let finalTotalWinLoss = 0;
        console.log("Starting spin process..., bets:", originalBetsState);

        // --- Transform Visual Bets into Backend-Ready Bet Objects ---
        const betsToProcess = Object.entries(originalBetsState).flatMap(([betId, betData]) => {
            console.log("Processing betId:", betId);
            if (isSpecialBetType(betId)) {
                const specialBet = getSpecialBetTypeAndValue(betId);
                if (specialBet) {
                    return [{ usuarioId: user.id, cantidad: betData.number, tipoApuesta: specialBet.tipoApuesta, valorApuesta: specialBet.valorApuesta }];
                }
            }
            else if (multiNumberBetRegex.test(betId)) {
                const numbers = betId.split('-');
                console.log("Parsed multi-number bet:", numbers);
                return numbers.map(num => ({ usuarioId: user.id, cantidad: betData.number, tipoApuesta: 'numero', valorApuesta: String(num) }));
            }
            else if (/^\d+$/.test(betId) || betId === '00') { // Correctly handles '00'
                return [{ usuarioId: user.id, cantidad: betData.number, tipoApuesta: 'numero', valorApuesta: betId }];
            } else {
                console.warn("Unknown bet type ID:", betId);
                return [];
            }
        });

        if (betsToProcess.length === 0) {
             const messageText = numberOfVisualBets > 0 ? "Could not process any of the placed bets." : "Place your bets first!";
             setMessage({ text: messageText, type: 'warning' });
             setIsSpinning(false); // Reset spinning state
             return;
        }

        console.log("Total individual bets to send to backend:", betsToProcess.length);
        console.log("Bets to process:", betsToProcess);

        // --- Conditional API Call ---
        const isSingleSimpleBet = numberOfVisualBets === 1 && !multiNumberBetRegex.test(Object.keys(originalBetsState)[0]);

        if (isSingleSimpleBet) {
            if (betsToProcess.length !== 1) {
                 console.error("Logic error: Expected 1 processed bet for a single simple visual bet, but got", betsToProcess.length);
                 console.log("Falling back to multi-bet API due to processing mismatch.");
                 apiResponse = await ruletaService.jugarMultibet(betsToProcess);
            } else {
                console.log("Calling single bet API (jugar) with:", betsToProcess[0]);
                apiResponse = await ruletaService.jugar(betsToProcess[0]);
            }
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.resolvedBet?.winloss ?? apiResponse.totalWinLoss ?? 0;

        } else {
            if (betsToProcess.length < 1) {
                throw new Error("No valid bets to send to the multi-bet API.");
            }
            console.log(`Calling multi-bet API (jugarMultibet) with ${betsToProcess.length} individual bets.`);
            apiResponse = await ruletaService.jugarMultibet(betsToProcess);
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.totalWinLoss ?? 0;
        }
        // --- End Conditional API Call ---

        console.log("API Response received:", apiResponse);

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
        console.log('Spin result number:', finalWinningNumber);
        setSpinResultNumber(String(finalWinningNumber));
        setStartSpin(true); // Start the animation AFTER successful API call

    } catch (error) {
        console.error("Error during spin:", error);
        const errorMsg = error.response?.data?.message || error.message || 'Spin failed. Please try again.';
        setMessage({
            text: errorMsg,
            type: 'danger'
        });
        // Reset state on error
        setIsSpinning(false); // Reset spinning state on error
        setStartSpin(false);
        try {
             const currentBalanceOnError = await userService.getUserBalance(user.id);
             setUserBalance(currentBalanceOnError);
        } catch (balanceError) {
             console.error("Failed to re-fetch balance after spin error:", balanceError);
        }
    }
    // Note: setIsSpinning(false) is now primarily handled in handleSpinEnd or the catch block
};

const handleSpinEnd = () => {
    console.log("Wheel animation finished.");

    if (spinResults) {
        const { winningNumber, profit, finalBalance } = spinResults;

        setUserBalance(finalBalance);

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
        setSpinResults(null); // Clear temporary results
    } else {
        console.warn("Spin ended but no spinResults were found.");
        if (message.type !== 'danger') {
             setMessage({ text: 'Spin complete.', type: 'info' });
        }
    }

    // Reset flags and clear bets for the next round
    setIsSpinning(false); // Spin process is now fully complete
    setStartSpin(false);
    setBets({}); // Clear visual bets
};


  // Helper function to determine the color of a number
  const getNumberColor = (number) => {
      if (number === '00' || number === '0') return 'green'; // Both 0 and 00 are green
      const num = parseInt(number, 10);
      if (isNaN(num)) return 'black';
      if (redNumbers.includes(num)) return 'red';
      return 'black';
  };


  const totalBetDisplay = calculateTotalBet(bets);

  // --- JSX Rendering ---

  return (
    <Container fluid className="roulette-container py-4">
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-center mb-0">Casino Roulette</h2>
            <Link to="/profile" className="btn btn-outline-primary">
                <FaChartBar className="me-2" /> View My Statistics
            </Link>
        </div>

        {/* Balance Display */}
        <Row className="mb-3">
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


      {/* Top Row: Chips, Wheel, History */}
      <Row className="mb-4">
         {/* Left: Chip Selection & User History */}
        <Col md={3}>
            {/* Chip Selector Card */}
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

            {/* User History Card */}
           <Card>
                <Card.Header>Your Recent Bets</Card.Header>
                <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                    {gameHistory.length > 0 ? (
                        gameHistory.map(bet => (
                             <ListGroup.Item
                                key={bet.id}
                                className={`d-flex justify-content-between align-items-center p-2 ${bet.estado === 'GANADA' ? 'list-group-item-success' : 'list-group-item-danger'}`}
                             >
                                <div>
                                    <span>{bet.tipoApuesta}: {bet.valorApostado} (${bet.cantidad?.toFixed(2)})</span>
                                    <br/>
                                    <small className="text-muted">Result: {bet.valorGanador} | {new Date(bet.fechaHora).toLocaleTimeString()}</small>
                                </div>
                                <span className={`fw-bold ${bet.estado === 'GANADA' ? 'text-success' : 'text-danger'}`}>
                                    {typeof bet.winloss === 'number' ? `${bet.winloss >= 0 ? '+' : ''}${bet.winloss.toFixed(2)}` : 'N/A'}
                                </span>
                            </ListGroup.Item>
                        ))
                    ) : (
                        <ListGroup.Item className="text-muted text-center p-3">No recent bets found.</ListGroup.Item>
                    )}
                </ListGroup>
            </Card>
        </Col>

        {/* Center: Wheel, Buttons, Message */}
        <Col md={6} className="d-flex flex-column align-items-center">
            <div className="roulette-wheel-wrapper mb-3">
                {/* Add american={true} prop if the library supports it for American layout */}
                <RouletteWheel
                    start={startSpin}
                    winningBet={spinResultNumber}
                    onSpinningEnd={handleSpinEnd}
                />
            </div>

             {/* Spin/Clear Buttons */}
           <div className="d-flex justify-content-center w-100 mb-3">
              <Button
                  variant="outline-danger"
                  size="lg"
                  onClick={clearAllBets}
                  disabled={isSpinning || Object.keys(bets).length === 0} // Disabled only if spinning or no bets
                  className="me-3"
                  style={{ minWidth: '130px'}}
              >
                  Clear Bets
              </Button>
              <Button
                  variant="success"
                  size="lg"
                  onClick={handleSpinClick}
                  disabled={isSpinning || Object.keys(bets).length === 0 || totalBetDisplay > userBalance} // Disabled if spinning, no bets, or insufficient balance
                  style={{ minWidth: '130px'}}
              >
                  {isSpinning ? <><Spinner as="span" animation="border" size="sm" /> Spinning...</> : 'SPIN'} {/* Show spinner only based on isSpinning */}
              </Button>
           </div>


            {/* Result Message Area */}
            <div className="result-message-area w-100 px-3" style={{ minHeight: '60px' }}>
                 {message.text && (
                     <Alert variant={message.type} className="text-center py-2">
                         {message.text}
                     </Alert>
                 )}
                 {message.type === 'success' && !isSpinning && ( // Show image only after successful spin completes
                    <div className="text-center mt-n2">
                        <img
                            src={flyingChips}
                            alt="Winning Chips"
                            className="winning-image"
                            style={{ maxWidth: '80px', height: 'auto' }}
                        />
                    </div>
                 )}
            </div>
        </Col>

        {/* Right: Winning Number History */}
        <Col md={3}>
          <Card>
            <Card.Header>Last Numbers</Card.Header>
            <Card.Body className="p-2 text-center history-numbers-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {betHistory.length > 0 ? (
                     <div className="d-flex flex-wrap justify-content-center">
                        {betHistory.map((num, index) => (
                            <span
                                key={index}
                                className="history-number m-1"
                                style={{ backgroundColor: getNumberColor(num), color: 'white' }}
                                title={`Spin #${betHistory.length - index}`}
                            >
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
      </Row>

      {/* Bottom Row: Betting Table */}
      <Row className="mt-2">
        <Col md={10} lg={9} className="mx-auto">
            <Card>
                <Card.Header className="text-center">Place Your Bets</Card.Header>
                 <Card.Body className="p-1 d-flex justify-content-center align-items-center roulette-table-card-body">
                    <div className="roulette-table-container" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                         {/* Add american={true} prop if the library supports it for American layout */}
                         <RouletteTable
                            onBet={handleTableBet}
                            bets={bets}
                            american={true} // Set to true for American Roulette (0 and 00)
                        />
                    </div>
                 </Card.Body>
            </Card>
        </Col>
      </Row>

        {/* Big Win Modal or Image - Example */}
        {/* {showBigWin && (
            <div className="big-win-overlay">
                <img src={bigWin} alt="Big Win!" />
            </div>
        )} */}
    </Container>
  );
}
export default RouletteGame;