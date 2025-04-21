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



// Function to calculate total bet amount from the bets object
const calculateTotalBet = (bets) => {
  return Object.values(bets).reduce((acc, bet) => acc + bet.number, 0);
};




// --- Component ---

function RouletteGame() {
  const { user, updateUserBalance } = useAuth();
  const [userBalance, setUserBalance] = useState(0);

  // State for bets placed on the library's table
  const [bets, setBets] = useState({});

  // State for chip selection
  const [activeChipKey, setActiveChipKey] = useState(defaultChip); // e.g., 'chip10'

  // State for wheel animation
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResultNumber, setSpinResultNumber] = useState(null); // The actual winning number (string) after spin
  const [startSpin, setStartSpin] = useState(false); // Triggers the library wheel animation
  const [spinResults, setSpinResults] = useState(null);
  // UI/Feedback State
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [message, setMessage] = useState({ text: '', type: 'info' }); // For displaying results/errors
  const [betHistory, setBetHistory] = useState([]); // Recent winning numbers
  const [gameHistory, setGameHistory] = useState([]); // User's past bet results for this game

  // --- Effects ---

  // Initialize balance from user context
  useEffect(() => {
    if (user) {
      setUserBalance(userService.getUserBalance(user.id));
    }
  }, [user]);


  // Fetch user's bet history for Roulette (Game ID 1 assumed)
  const fetchUserGameHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const historyData = await betService.getUserGameBets(user.id, 1);
      if (Array.isArray(historyData)) {
        setGameHistory(historyData.slice(0, 10)); // Show last 10
      } else {
        console.error("Fetched history is not an array:", historyData);
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

    if (potentialTotal > userBalance) {
      setMessage({ text: "Insufficient balance for this bet.", type: 'warning' });
      return;
    }

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
    setMessage({ text: '', type: 'info' });
  };

  // Clear all bets from the table
  const clearAllBets = () => {
    if (isSpinning || loading) return;
    setBets({});
    setMessage({ text: 'Bets cleared.', type: 'info' });
  };

  // Start the spin process
// Start the spin process
// Modified handleSpinClick function to store results but not display them yet
const handleSpinClick = async () => {
  const totalBetAmount = calculateTotalBet(bets);
  const numberOfBets = Object.keys(bets).length; // Get number of distinct bets

  if (isSpinning || loading || numberOfBets === 0) {
      if (numberOfBets === 0) setMessage({ text: 'Place your bets first!', type: 'warning' });
      return;
  }
  if (totalBetAmount > userBalance) {
      setMessage({ text: 'Total bet exceeds balance!', type: 'danger' });
      return;
  }

  setLoading(true);
  setIsSpinning(true);
  setMessage({ text: 'Spinning...', type: 'info' });
  setStartSpin(false); // Ensure wheel doesn't start prematurely if API fails fast

  try {
      let apiResponse;
      let finalWinningNumber = null;
      let finalTotalWinLoss = 0;

      // Prepare the bet data
      const betsToProcess = Object.entries(bets).map(([betId, betData]) => {
          let tipoApuesta, valorApuesta;

          // --- Bet Type Mapping Logic (same as before) ---
          if (betId === 'RED' || betId === 'BLACK') {
              tipoApuesta = 'color';
              valorApuesta = betId === 'RED' ? '1' : '2'; // Or 'rojo'/'negro' if backend expects that
          } else if (betId === 'EVEN' || betId === 'ODD') {
              tipoApuesta = 'paridad';
              valorApuesta = betId === 'EVEN' ? 'par' : 'impar';
          } else if (betId === '1_TO_18' || betId === '19_TO_36') {
              tipoApuesta = 'mitad';
              valorApuesta = betId === '1_TO_18' ? '1' : '2'; // Or 'baja'/'alta'
          } else if (betId === '1ST_DOZEN' || betId === '2ND_DOZEN' || betId === '3RD_DOZEN') {
              tipoApuesta = 'docena';
              valorApuesta = betId === '1ST_DOZEN' ? '1' : betId === '2ND_DOZEN' ? '2' : '3';
          } else if (betId === '1ST_COLUMN' || betId === '2ND_COLUMN' || betId === '3RD_COLUMN') {
              tipoApuesta = 'columna';
              valorApuesta = betId === '1ST_COLUMN' ? '1' : betId === '2ND_COLUMN' ? '2' : '3';
          } else if (/\d+-\d+/.test(betId)) { // Regex to check for split/street/corner like '1-2', '1-4', '1-2-4-5' etc.
              // Assuming backend handles hyphenated numbers directly for splits/streets/corners etc.
              tipoApuesta = 'numero'; // Or a more specific type if backend requires?
              valorApuesta = betId; // Pass the hyphenated string e.g., "1-2"
          } else { // Single number bet
              tipoApuesta = 'numero';
              valorApuesta = betId; // e.g., "0", "17", "36"
          }
          // --- End Bet Type Mapping ---

          // Construct payload for this single bet
          return {
              usuarioId: user.id,
              cantidad: betData.number, // The amount placed on this specific spot
              tipoApuesta: tipoApuesta,
              valorApuesta: valorApuesta
          };
      });

      // --- Conditional API Call ---
      if (numberOfBets === 1) {
           console.log("Calling single bet API");
           apiResponse = await ruletaService.jugar(betsToProcess[0]); // Send the single bet object
           // apiResponse structure: { winningNumber, resolvedBet, totalWinLoss }
           finalWinningNumber = apiResponse.winningNumber;
           finalTotalWinLoss = apiResponse.totalWinLoss;
      } else { // numberOfBets > 1
           console.log("Calling multi-bet API");
           apiResponse = await ruletaService.jugarMultibet(betsToProcess); // Send the array of bet objects
           // apiResponse structure: { winningNumber, resolvedBets: [], totalWinLoss }
           finalWinningNumber = apiResponse.winningNumber;
           finalTotalWinLoss = apiResponse.totalWinLoss;
      }
       // --- End Conditional API Call ---


      console.log("API Response processed:", apiResponse);

      if (finalWinningNumber === null) {
          throw new Error("Could not determine winning number from backend response.");
      }

      // Fetch the definitive balance from the backend AFTER the bets are processed
      const updatedUser = await userService.getUserById(user.id);
      setUserBalance(updatedUser.balance); // Update balance state with the authoritative value

      // Store results for display after animation
      setSpinResults({
          winningNumber: String(finalWinningNumber),
          profit: finalTotalWinLoss, // Use the total calculated win/loss
          finalBalance: updatedUser.balance
      });

      // Trigger the wheel animation
      setSpinResultNumber(String(finalWinningNumber)); // Set the number for the wheel component
      setStartSpin(true); // Start the animation


  } catch (error) {
      console.error("Error during spin:", error);
      setMessage({
          text: error.message || 'Spin failed. Please try again.',
          type: 'danger'
      });
      // Reset state on error
      setIsSpinning(false);
      setLoading(false);
      setStartSpin(false); // Ensure animation doesn't start on error
      // Optionally clear bets on error? Or leave them for user to retry/clear?
      // setBets({});
  }
  // Note: setLoading(false), setIsSpinning(false) are now primarily handled in handleSpinEnd
};


const handleSpinEnd = () => {
  console.log("Wheel animation finished.");

  if (spinResults) {
      const { winningNumber, profit, finalBalance } = spinResults;

       // Confetti for win
      if (profit > 0) {
        confetti({
          particleCount: 350,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      // Update UI message
      setMessage({
          text: `Spin result: ${winningNumber}. ${profit === 0 ? 'No change.' : `You ${profit > 0 ? 'won' : 'lost'} $${Math.abs(profit).toFixed(2)}.`}`,
          type: profit > 0 ? 'success' : profit < 0 ? 'danger' : 'info',
      });

      // Update local history display
      setBetHistory(prev => [winningNumber, ...prev.slice(0, 9)]);

      // Fetch updated game history from backend
      fetchUserGameHistory();

       // Make sure balance shown matches the finalBalance from spinResults (which came from backend)
       // setUserBalance(finalBalance); // Already set using userService.getUserById in handleSpinClick

      // Clear the temporary results
      setSpinResults(null);
  } else {
       // Handle cases where spin ended without results (e.g., error before setting spinResults)
       console.warn("Spin ended but no spinResults were found.");
       // Ensure UI reflects non-spinning state if message wasn't set to an error
       if (message.type !== 'danger') {
          setMessage({ text: 'Spin complete.', type: 'info' });
       }
  }

  // Reset flags and clear bets for the next round
  setIsSpinning(false);
  setStartSpin(false);
  setLoading(false);
  setBets({}); // Clear bets from the table after spin completes
};


  // Helper function to determine the color of a number in the roulette wheel
  const getNumberColor = (number) => {
      const num = parseInt(number, 10);
      if (isNaN(num)) {
        return 'black'; // Default color for non-numeric values
      }
      if (num === 0) return 'green';
      if (redNumbers.includes(num)) return 'red';
      return 'black';
  };


  // Callback when the library's wheel animation finishes


  const totalBetDisplay = calculateTotalBet(bets);

  // --- JSX Rendering ---

  return (
    <Container fluid className="roulette-container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="text-center mb-4">Casino Roulette</h2>
      <Link to="/profile" className="btn btn-outline-primary">
          <FaChartBar className="me-2" /> View My Statistics
        </Link>
      </div>
      {/* Balance Display */}
      <Row className="mb-3">
        <Col>
          <Card className="bg-dark text-light balance-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Balance: <span className="text-success fw-bold">${userBalance}</span></h5>
              {totalBetDisplay > 0 && (
                  <div className="text-end">
                      <span className="me-3">Bet: ${totalBetDisplay.toFixed(2)}</span>
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
                      <img width={50} height={50} src={icon} alt={`$${value} chip`} className="chip-image"/>
                      <span className="chip-value d-block text-center text-white small mt-1">${value}</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

           <Card>
                <Card.Header>Your Recent Bets</Card.Header>
                <ListGroup variant="flush" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {gameHistory.length > 0 ? (
                        gameHistory.map(bet => (
                             <ListGroup.Item
                                key={bet.id}
                                className={`d-flex justify-content-between align-items-center small p-2 ${bet.estado === 'GANADA' ? 'list-group-item-success' : 'list-group-item-danger'}`}
                             >
                                <div>
                                    {bet.tipo}: {bet.valorApostado} (${bet.cantidad.toFixed(2)})
                                    <br/>
                                    <small className="text-muted">Result: {bet.valorGanador}</small>
                                </div>
                                <span className={`fw-bold ${bet.estado === 'GANADA' ? 'text-success' : 'text-danger'}`}>
                                    {bet.winloss >= 0 ? '+' : ''}{bet.winloss.toFixed(2)}
                                </span>
                            </ListGroup.Item>
                        ))
                    ) : (
                        <ListGroup.Item className="text-muted text-center p-2">No betting history found.</ListGroup.Item>
                    )}
                </ListGroup>
            </Card>
        </Col>

        {/* Center: Wheel, Buttons, Message */}
        <Col md={6} className="d-flex flex-column align-items-center">
            <div className="roulette-wheel-wrapper mb-3">
            <RouletteWheel
              start={startSpin}
              winningBet={spinResultNumber} // Use spinResultNumber state here
              onSpinningEnd={handleSpinEnd}
              // Add any other required props for your RouletteWheel component
        />
            </div>

             {/* Spin/Clear Buttons */}
           <div className="d-flex justify-content-center w-100 mb-3">
              <Button
                  variant="danger"
                  size="lg"
                  onClick={clearAllBets}
                  disabled={isSpinning || loading || Object.keys(bets).length === 0}
                  className="me-3"
                  style={{ minWidth: '120px'}}
              >
                  Clear Bets
              </Button>
              <Button
                  variant="success"
                  size="lg"
                  onClick={handleSpinClick}
                  disabled={isSpinning || loading || Object.keys(bets).length === 0 || totalBetDisplay > userBalance}
                  style={{ minWidth: '120px'}}
              >
                  {isSpinning || loading ? <Spinner as="span" animation="border" size="sm" /> : 'SPIN'}
              </Button>
           </div>


            {/* Result Message Area */}
            <div className="result-message-area w-100" style={{ minHeight: '50px' }}>
                
                {message.text && (
                  <div className="result-message-container mt-3 text-center">
                    <Alert variant={message.type}>
                      {message.text}
                    </Alert>
                    {message.type === 'success' && (
                      <img
                        src={flyingChips}
                        alt="Winning Chips"
                        className="winning-image"
                      />
                                    
                                   
                                    )}
                                </div>
                              )} 
            </div>
        </Col>

        {/* Right: Winning Number History */}
        <Col md={3}>
          <Card>
            <Card.Header>Last Numbers</Card.Header>
            <Card.Body className="p-2 text-center history-numbers-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {betHistory.length > 0 ? (
                    betHistory.map((num, index) => (
                    <span
                        key={index}
                        className="history-number"
                        style={{ backgroundColor: getNumberColor(num), color: 'white' }}
                    >
                        {num}
                    </span>
                    ))
                ) : (
                    <span className="text-muted">No history yet.</span>
                )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row: Betting Table */}
      <Row className="mt-4">
        <Col md={10} lg={8} className="mx-auto"> {/* Centered column for the table */}
            <Card>
                <Card.Header className="text-center">Betting Table</Card.Header>
                <div className="decenas12">
                <Card.Body className="p-2 d-flex justify-content-center align-items-center roulette-table-card-body">
                    <div className="roulette-table-container">
                         <RouletteTable
                            onBet={handleTableBet}
                            bets={bets}
                        />
                    </div>
                
                </Card.Body>
                </div>
            </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RouletteGame;

