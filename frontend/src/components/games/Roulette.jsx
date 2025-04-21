import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Alert, Spinner } from 'react-bootstrap';
// Use the components from the library
import { RouletteTable, RouletteWheel } from '../../../react-casino-roulette/src';
import '../../../react-casino-roulette/dist/index.css';
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

//change it to american roulette(the one with 0 and 00)
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Regex to identify betIds representing multi-number inside bets (split, street, corner, line, etc.)
// Assumes the library uses hyphenated digits for these (e.g., "1-2", "1-2-3", "1-4-2-5")
const multiNumberBetRegex = /^\d+(-\d+)+$/;

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

  // State for wheel animation
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResultNumber, setSpinResultNumber] = useState(null); // The actual winning number (string) after spin
  const [startSpin, setStartSpin] = useState(false); // Triggers the library wheel animation
  const [spinResults, setSpinResults] = useState(null); // Stores results between API call and spin end
  // UI/Feedback State
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [message, setMessage] = useState({ text: '', type: 'info' }); // For displaying results/errors
  const [betHistory, setBetHistory] = useState([]); // Recent winning numbers
  const [gameHistory, setGameHistory] = useState([]); // User's past bet results for this game

  // --- Effects ---

  // Initialize balance from user context (assuming synchronous fetch or initial value)
   useEffect(() => {
       const fetchBalance = async () => {
           if (user?.id) {
               try {
                   // Use await if userService.getUserBalance is async
                   const balance = await userService.getUserBalance(user.id);
                   setUserBalance(balance);
               } catch (error) {
                   console.error("Failed to fetch initial balance:", error);
                   setUserBalance(0); // Set default or handle error
                   setMessage({ text: 'Could not fetch balance.', type: 'danger' });
               }
           }
       };
       fetchBalance();
   }, [user?.id]); // Depend on user.id

   // Fetch user's bet history for Roulette (Game ID 1 assumed)
   const fetchUserGameHistory = useCallback(async () => {
       if (!user?.id) return;
       try {
           // Assuming getUserGameBets returns the correct structure { bets: [...] } or similar
           const historyResponse = await betService.getUserGameBets(user.id, 1); // Game ID 1 for Roulette

           // Adjust based on the actual structure of historyResponse
           const historyData = historyResponse.bets || historyResponse; // Example adjustment

           if (Array.isArray(historyData)) {
               // Sort by date descending if timestamp available, otherwise take last 10 as received
               // historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
               setGameHistory(historyData.slice(0, 10)); // Show last 10
           } else {
               console.error("Fetched history data is not an array:", historyData);
               setGameHistory([]);
           }
       } catch (error) {
           console.error("Failed to fetch user game history:", error);
           setGameHistory([]); // Set empty on error
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

  // Handle clicks on the RouletteTable component (provided by the library)
  const handleTableBet = ({ bet, payload, id }) => {
    if (isSpinning || loading) return;

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
            setUserBalance(currentBalance); // Update balance display just in case
        } else {
            setBets(prevBets => {
                const newBets = { ...prevBets };
                if (newBets[id]) {
                    newBets[id] = {
                        ...newBets[id],
                        number: newBets[id].number + chipValue,
                        icon: chipIcon // Update icon if chip changes? Maybe not needed.
                    };
                } else {
                    newBets[id] = { number: chipValue, icon: chipIcon };
                }
                return newBets;
            });
            // Update displayed balance optimistically, or re-fetch if strict consistency is needed
            setUserBalance(currentBalance); // Reflect the balance check result
            setMessage({ text: '', type: 'info' }); // Clear any previous message
        }
    }).catch(err => {
        console.error("Error fetching balance during bet placement:", err);
        setMessage({ text: 'Error checking balance.', type: 'danger' });
    });
};

  // Clear all bets from the table
  const clearAllBets = () => {
    if (isSpinning || loading) return;
    setBets({});
    setMessage({ text: 'Bets cleared.', type: 'info' });
  };

// Start the spin process
const handleSpinClick = async () => {
    const originalBetsState = bets; // Use the state representing visual bets
    const totalBetAmount = calculateTotalBet(originalBetsState);
    const numberOfVisualBets = Object.keys(originalBetsState).length;

    if (isSpinning || loading || numberOfVisualBets === 0) {
        if (numberOfVisualBets === 0) setMessage({ text: 'Place your bets first!', type: 'warning' });
        return;
    }

    // Re-check balance right before spinning
    let currentBalance;
    try {
        currentBalance = await userService.getUserBalance(user.id);
        setUserBalance(currentBalance); // Ensure UI is up-to-date
    } catch {
        setMessage({ text: 'Could not verify balance before spin.', type: 'danger' });
        return;
    }

    if (totalBetAmount > currentBalance) {
        setMessage({ text: `Total bet ($${totalBetAmount.toFixed(2)}) exceeds balance ($${currentBalance.toFixed(2)})!`, type: 'danger' });
        return;
    }


    setLoading(true);
    setIsSpinning(true);
    setMessage({ text: 'Spinning...', type: 'info' });
    setStartSpin(false); // Ensure wheel doesn't start prematurely

    try {
        let apiResponse;
        let finalWinningNumber = null;
        let finalTotalWinLoss = 0;

        // --- Transform Visual Bets into Backend-Ready Bet Objects ---
        const betsToProcess = Object.entries(originalBetsState).flatMap(([betId, betData]) => {
            let tipoApuesta;
            let valorApuesta; // Used for non-hyphenated bets

            // Check if it's a multi-number bet (e.g., "1-2", "1-4-2-5")
            if (multiNumberBetRegex.test(betId)) {
                const numbers = betId.split('-').map(numStr => parseInt(numStr.trim(), 10));
                const validNumbers = numbers.filter(num => !isNaN(num));

                if (validNumbers.length === 0) {
                    console.warn(`Could not parse numbers from betId: ${betId}`);
                    return []; // Return empty array to be ignored by flatMap
                }

                // Generate an array of individual 'numero' bet objects
                return validNumbers.map(num => ({
                    usuarioId: user.id,
                    cantidad: betData.number, // The full amount bet on the visual spot applies to each covered number
                    tipoApuesta: 'numero',     // Backend expects 'numero' for these parts
                    valorApuesta: String(num), // The specific single number
                    // Optional: Include originalBetId if backend needs to link these back?
                    // originalBetId: betId
                }));
            }
            // --- Handle Non-Hyphenated Bets ---
            else if (betId === 'RED' || betId === 'BLACK') {
                tipoApuesta = 'color';
                valorApuesta = betId === 'RED' ? '1' : '2';
            } else if (betId === 'EVEN' || betId === 'ODD') {
                tipoApuesta = 'paridad';
                valorApuesta = betId === 'EVEN' ? 'par' : 'impar';
            } else if (betId === '1_TO_18' || betId === '19_TO_36') {
                tipoApuesta = 'mitad';
                valorApuesta = betId === '1_TO_18' ? '1' : '2';
            } else if (betId === '1ST_DOZEN' || betId === '2ND_DOZEN' || betId === '3RD_DOZEN') {
                tipoApuesta = 'docena';
                valorApuesta = betId === '1ST_DOZEN' ? '1' : betId === '2ND_DOZEN' ? '2' : '3';
            } else if (betId === '1ST_COLUMN' || betId === '2ND_COLUMN' || betId === '3RD_COLUMN') {
                tipoApuesta = 'columna';
                valorApuesta = betId === '1ST_COLUMN' ? '1' : betId === '2ND_COLUMN' ? '2' : '3';
            }
             // Handle single number bets (e.g., "0", "17", "36") and "00"
            else if (/^\d+$/.test(betId) || betId === '00') {
                 tipoApuesta = 'numero';
                 valorApuesta = betId;
             } else {
                console.warn("Unknown bet type ID:", betId);
                return []; // Ignore unknown types
            }

            // For non-hyphenated bets, return a single object in an array for flatMap
            return [{
                usuarioId: user.id,
                cantidad: betData.number,
                tipoApuesta: tipoApuesta,
                valorApuesta: valorApuesta
            }];
        }); // End flatMap

        // Check if there are any valid bets to send after processing
        if (betsToProcess.length === 0) {
             const messageText = numberOfVisualBets > 0 ? "Could not process any of the placed bets." : "Place your bets first!";
             setMessage({ text: messageText, type: 'warning' });
             setIsSpinning(false);
             setLoading(false);
             return;
        }

        console.log("Total individual bets to send to backend:", betsToProcess.length);
        console.log("Bets to process:", betsToProcess);

        // --- Conditional API Call ---
        // Determine if we need the single bet or multi-bet endpoint.
        // Use 'jugar' ONLY if there was exactly ONE visual bet placed AND it was NOT a multi-number type.
        const isSingleSimpleBet = numberOfVisualBets === 1 && !multiNumberBetRegex.test(Object.keys(originalBetsState)[0]);

        if (isSingleSimpleBet) {
            // We should have exactly one bet object in betsToProcess
            if (betsToProcess.length !== 1) {
                 console.error("Logic error: Expected 1 processed bet for a single simple visual bet, but got", betsToProcess.length);
                 // Fallback to multibet or throw error? Let's try falling back.
                 console.log("Falling back to multi-bet API due to processing mismatch.");
                 apiResponse = await ruletaService.jugarMultibet(betsToProcess);
            } else {
                console.log("Calling single bet API (jugar) with:", betsToProcess[0]);
                apiResponse = await ruletaService.jugar(betsToProcess[0]);
            }
            // Extract results (handle potential differences in response structure)
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.resolvedBet?.winloss ?? apiResponse.totalWinLoss ?? 0; // Adapt as needed

        } else { // Use multibet if multiple visual bets OR a single multi-number visual bet
            if (betsToProcess.length < 1) { // Should be caught earlier, but safe check
                throw new Error("No valid bets to send to the multi-bet API.");
            }
            console.log(`Calling multi-bet API (jugarMultibet) with ${betsToProcess.length} individual bets.`);
            apiResponse = await ruletaService.jugarMultibet(betsToProcess);
             // Extract results (expecting totalWinLoss from multibet)
            finalWinningNumber = apiResponse.winningNumber;
            finalTotalWinLoss = apiResponse.totalWinLoss ?? 0; // Provide default
        }
        // --- End Conditional API Call ---


        console.log("API Response received:", apiResponse);

        if (finalWinningNumber === null || finalWinningNumber === undefined) {
            throw new Error(apiResponse?.message || "Backend did not return a valid winning number.");
        }

        // Fetch the definitive balance from the backend AFTER the bets are processed
        const updatedUser = await userService.getUserById(user.id);
        const finalBackendBalance = updatedUser.balance;
        setUserBalance(finalBackendBalance); // Update balance state with the authoritative value

        // Store results for display after animation
        setSpinResults({
            winningNumber: String(finalWinningNumber),
            profit: Number(finalTotalWinLoss), // Ensure it's a number
            finalBalance: finalBackendBalance // Store the confirmed final balance
        });

        // Trigger the wheel animation
        setSpinResultNumber(String(finalWinningNumber)); // Set the number for the wheel component
        setStartSpin(true); // Start the animation

    } catch (error) {
        console.error("Error during spin:", error);
        const errorMsg = error.response?.data?.message || error.message || 'Spin failed. Please try again.';
        setMessage({
            text: errorMsg,
            type: 'danger'
        });
        // Reset state on error
        setIsSpinning(false);
        setLoading(false);
        setStartSpin(false);
        // Re-fetch balance on error to ensure consistency
        try {
             const currentBalanceOnError = await userService.getUserBalance(user.id);
             setUserBalance(currentBalanceOnError);
        } catch (balanceError) {
             console.error("Failed to re-fetch balance after spin error:", balanceError);
        }
    }
    // Note: setLoading(false), setIsSpinning(false) are now primarily handled in handleSpinEnd
};

const handleSpinEnd = () => {
    console.log("Wheel animation finished.");

    if (spinResults) {
        const { winningNumber, profit, finalBalance } = spinResults;

        // Ensure balance displayed matches the final balance from backend
        setUserBalance(finalBalance);

        // Confetti for win
        if (profit > 0) {
            confetti({
                particleCount: 250, // Reduced slightly
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Update UI message
        const winLossText = profit === 0 ? 'No change.' : `You ${profit > 0 ? 'won' : 'lost'} $${Math.abs(profit).toFixed(2)}.`;
        setMessage({
            text: `Landed on: ${winningNumber}. ${winLossText}`,
            type: profit > 0 ? 'success' : profit < 0 ? 'danger' : 'info',
        });

        // Update local history display
        setBetHistory(prev => [winningNumber, ...prev.slice(0, 14)]); // Show more history?

        // Fetch updated game history from backend *after* spin is fully resolved
        fetchUserGameHistory();

        // Clear the temporary results
        setSpinResults(null);
    } else {
        // Handle cases where spin ended without results (e.g., error before setting spinResults)
        console.warn("Spin ended but no spinResults were found. This might happen after an error during the spin process.");
        // Optionally set a generic message if no error was displayed before
        if (message.type !== 'danger') {
             setMessage({ text: 'Spin complete.', type: 'info' });
        }
    }

    // Reset flags and clear bets for the next round
    setIsSpinning(false);
    setStartSpin(false);
    setLoading(false);
    setBets({}); // Clear visual bets from the table after spin completes
};


  // Helper function to determine the color of a number in the roulette wheel
  const getNumberColor = (number) => {
      // Handle '00' specifically if using American Roulette
      if (number === '00') return 'green';
      const num = parseInt(number, 10);
      if (isNaN(num)) {
          return 'black'; // Default or handle non-numeric results if they occur
      }
      if (num === 0) return 'green';
      if (redNumbers.includes(num)) return 'red';
      return 'black';
  };


  const totalBetDisplay = calculateTotalBet(bets);

  // --- JSX Rendering ---

  return (
    <Container fluid className="roulette-container py-4">
        {/* ... (Top Title and Stats Link - unchanged) ... */}
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-center mb-0">Casino Roulette</h2> {/* Removed mb-4 */}
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
                      <img width={45} height={45} src={icon} alt={`$${value} chip`} className="chip-image"/> {/* Slightly smaller */}
                      {/* Removed text value display - less clutter */}
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
                 {/* Added scroll styling directly */}
                <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                    {gameHistory.length > 0 ? (
                        gameHistory.map(bet => (
                             <ListGroup.Item
                                key={bet.id} // Make sure bet.id is unique from the API
                                className={`d-flex justify-content-between align-items-center p-2 ${bet.estado === 'GANADA' ? 'list-group-item-success' : 'list-group-item-danger'}`}
                             >
                                <div>
                                    {/* Displaying type/value might need adjustment based on API fields */}
                                    <span>{bet.tipoApuesta}: {bet.valorApostado} (${bet.cantidad?.toFixed(2)})</span>
                                    <br/>
                                    <small className="text-muted">Result: {bet.valorGanador} | {new Date(bet.fechaHora).toLocaleTimeString()}</small>
                                </div>
                                <span className={`fw-bold ${bet.estado === 'GANADA' ? 'text-success' : 'text-danger'}`}>
                                     {/* Ensure winloss exists and is a number */}
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
                {/* Ensure the wheel component can handle '00' if you use American layout */}
                <RouletteWheel
                    start={startSpin}
                    winningBet={spinResultNumber} // Pass the determined winning number string
                    onSpinningEnd={handleSpinEnd}
                    // Check if your wheel component needs specific American Roulette settings
                    // american={true} // Example prop if it exists
                />
            </div>

             {/* Spin/Clear Buttons */}
           <div className="d-flex justify-content-center w-100 mb-3">
              <Button
                  variant="outline-danger" // Changed to outline
                  size="lg"
                  onClick={clearAllBets}
                  disabled={isSpinning || loading || Object.keys(bets).length === 0}
                  className="me-3"
                  style={{ minWidth: '130px'}} // Slightly wider
              >
                  Clear Bets
              </Button>
              <Button
                  variant="success"
                  size="lg"
                  onClick={handleSpinClick}
                  disabled={isSpinning || loading || Object.keys(bets).length === 0 || totalBetDisplay > userBalance}
                  style={{ minWidth: '130px'}} // Slightly wider
              >
                  {isSpinning || loading ? <><Spinner as="span" animation="border" size="sm" /> Spinning...</> : 'SPIN'}
              </Button>
           </div>


            {/* Result Message Area */}
            <div className="result-message-area w-100 px-3" style={{ minHeight: '60px' }}> {/* Added padding */}
                 {/* Message Alert */}
                 {message.text && (
                     <Alert variant={message.type} className="text-center py-2"> {/* Centered text */}
                         {message.text}
                     </Alert>
                 )}
                 {/* Conditionally render winning image based on state AFTER spin completes and if won */}
                 {message.type === 'success' && !isSpinning && (
                    <div className="text-center mt-n2"> {/* Negative margin to overlap slightly */}
                        <img
                            src={flyingChips}
                            alt="Winning Chips"
                            className="winning-image" // Ensure CSS handles animation/display
                            style={{ maxWidth: '80px', height: 'auto' }} // Control size
                        />
                    </div>
                 )}
            </div>
        </Col>

        {/* Right: Winning Number History */}
        <Col md={3}>
          <Card>
            <Card.Header>Last Numbers</Card.Header>
            {/* Apply scrollbar styling directly */}
            <Card.Body className="p-2 text-center history-numbers-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {betHistory.length > 0 ? (
                    // Display numbers in a flex container for wrapping
                     <div className="d-flex flex-wrap justify-content-center">
                        {betHistory.map((num, index) => (
                            <span
                                key={index}
                                className="history-number m-1" // Added margin
                                style={{ backgroundColor: getNumberColor(num), color: 'white' }}
                                title={`Spin #${betHistory.length - index}`} // Show sequence
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
      <Row className="mt-2"> {/* Reduced margin top */}
        <Col md={10} lg={9} className="mx-auto"> {/* Adjusted width */}
            <Card>
                <Card.Header className="text-center">Place Your Bets</Card.Header>
                {/* Ensure container allows centering and potential scaling */}
                 <Card.Body className="p-1 d-flex justify-content-center align-items-center roulette-table-card-body">
                    <div className="roulette-table-container" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                         <RouletteTable
                            onBet={handleTableBet}
                            bets={bets} // Pass the visual bets state
                            // Check if library needs American layout flag
                            // american={true} // Example
                        />
                    </div>
                 </Card.Body>
            </Card>
        </Col>
      </Row>

        {/* Big Win Modal or Image - Example (could be state-controlled) */}
        {/* {showBigWin && (
            <div className="big-win-overlay">
                <img src={bigWin} alt="Big Win!" />
            </div>
        )} */}
    </Container>
  );
}

export default RouletteGame;