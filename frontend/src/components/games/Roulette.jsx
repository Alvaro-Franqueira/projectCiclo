import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Alert, Spinner } from 'react-bootstrap';
// Use the components from the library
import { RouletteTable, RouletteWheel } from 'react-casino-roulette';
import 'react-casino-roulette/dist/index.css';
import './Roulette.css'; // Your custom styles
import betService from '../../services/betService'; 
import ruletaService from '../../services/ruletaService'; 
import { useAuth } from '../../context/AuthContext';

// Import chips images (ensure paths are correct relative to Roulette.jsx)
import whiteChip from '../images/white-chip.png';
import blueChip from '../images/blue-chip.png';
import blackChip from '../images/black-chip.png';
import cyanChip from '../images/cyan-chip.png';

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

const getNumberColor = (number) => {
  if (number === null || number === undefined) return 'grey'; // Default/placeholder color
  const num = parseInt(number, 10);
  if (num === 0) return 'green';
  return redNumbers.includes(num) ? 'red' : 'black';
};

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

  // UI/Feedback State
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [message, setMessage] = useState({ text: '', type: 'info' }); // For displaying results/errors
  const [betHistory, setBetHistory] = useState([]); // Recent winning numbers
  const [gameHistory, setGameHistory] = useState([]); // User's past bet results for this game

  // --- Effects ---

  // Initialize balance from user context
  useEffect(() => {
    if (user) {
      setUserBalance(user.saldo || 0);
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
  const handleSpinClick = async () => {
    const totalBetAmount = calculateTotalBet(bets);
    if (isSpinning || loading || totalBetAmount === 0) {
        if (totalBetAmount === 0) setMessage({ text: 'Place your bets first!', type: 'warning' });
        return;
    }
    if (totalBetAmount > userBalance) {
        setMessage({ text: 'Total bet exceeds balance!', type: 'danger' });
        return;
    }

    setLoading(true);
    setIsSpinning(true);
    setMessage({ text: 'Spinning...', type: 'info' });
    setSpinResultNumber(null);

    try {
        // Generate a winning number between 0 and 36
      const winningNumber = Math.floor(Math.random() * 37);
      const winningNumberStr = String(winningNumber);


      const betPromises = Object.entries(bets).map(([betId, betData]) => {
        const [type, value] = betId.split('-');
        const betPayload = {
          usuarioId: user.id,
          cantidad: betData.number,
          tipo: type, 
          valorApostado: value, 
          //numeroGanador: winningNumber removed
          numeroGanador: winningNumber
        };
        console.log("Sending bet:", betPayload);
        return ruletaService.jugar(betPayload);
      });

      const results = await Promise.allSettled(betPromises);
      console.log("Backend responses:", results);

      let totalWinLoss = 0;
      let successfulBets = 0;
      let finalBalance = userBalance - totalBetAmount;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.resolvedBet && result.value.winningNumber) {
          const resolvedBet = result.value.resolvedBet;
          console.log(`Bet ${index+1} result with winning number ${result.value.winningNumber}:`, resolvedBet);
          totalWinLoss += resolvedBet.winloss || 0;
          successfulBets++;
          //Only update if was not already updated
          if (spinResultNumber === null) {
                setSpinResultNumber(String(result.value.winningNumber));
            }
          finalBalance += resolvedBet.winloss || 0;
        } else {
          const betEntry = Object.entries(bets)[index];
          const betId = betEntry ? betEntry[0] : 'unknown';
          console.error(`Bet ${betId} failed:`, result.reason || result.value);
        }
      });

      if (updateUserBalance) {
           updateUserBalance(finalBalance);
           setUserBalance(finalBalance);
      } else {
           setUserBalance(finalBalance);
      }

      const profit = totalWinLoss; // Backend winloss already accounts for stake

        //Check if there were successful bets
      if (spinResultNumber !== null) { // Check if spinResultNumber was updated
          

           setMessage({
            text: `Spin result: ${spinResultNumber}. ${profit === 0 ? 'No change.' : `You ${profit > 0 ? 'won' : 'lost'} $${Math.abs(profit).toFixed(2)}.`}`,
            type: profit > 0 ? 'success' : (profit < 0 ? 'danger' : 'info')
          });
          setBetHistory(prev => [spinResultNumber, ...prev.slice(0, 9)]);
      } else {
          setMessage({ text: 'Spin failed to determine winning number', type: 'danger' });
      }
      

      setSpinResultNumber(winningNumberStr);
      setStartSpin(true);

      fetchUserGameHistory();

    } catch (error) {
      console.error("Error during spin:", error);
      setMessage({ text: error.response?.data?.message || 'Spin failed. Please try again.', type: 'danger' });
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  // Callback when the library's wheel animation finishes
  const handleSpinEnd = () => {
    console.log("Wheel animation finished.");
    setIsSpinning(false);
    setStartSpin(false);
    setBets({}); // Clear bets after animation
  };

  const totalBetDisplay = calculateTotalBet(bets);

  // --- JSX Rendering ---

  return (
    <Container fluid className="roulette-container py-4">
      <h2 className="text-center mb-4">Casino Roulette</h2>

      {/* Balance Display */}
      <Row className="mb-3">
        <Col>
          <Card className="bg-dark text-light balance-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Balance: <span className="text-success fw-bold">${userBalance.toFixed(2)}</span></h5>
              {totalBetDisplay > 0 && (
                  <div className="text-end">
                      <span className="me-3">Bet: ${totalBetDisplay.toFixed(2)}</span>
                      <span className="text-warning">Remaining: ${(userBalance - totalBetDisplay).toFixed(2)}</span>
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
                winningBet={spinResultNumber}
                onSpinningEnd={handleSpinEnd}
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


            <div className="result-message-area w-100" style={{ minHeight: '50px' }}>
                {message.text && (
                <Alert variant={message.type || 'info'} className="text-center">
                    {message.text}
                </Alert>
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


      <style>{`
        .roulette-container {
            /* Add styles if needed */
        }
        .chip-selector-body .chip-container {
            cursor: pointer;
            padding: 5px;
            border-radius: 8px;
            border: 2px solid transparent;
            transition: border-color 0.2s ease-in-out, transform 0.2s ease-in-out;
             margin-bottom: 5px; /* Add space between chips if they wrap */
        }
         .chip-selector-body .chip-container:hover {
             transform: scale(1.05);
         }
        .chip-selector-body .chip-container.active {
            border-color: #D3A625; /* Gold border for active */
            transform: scale(1.1);
        }
        .chip-image {
            display: block;
            margin: 0 auto;
        }
         .history-numbers-body {
             line-height: 1.9; /* Adjust spacing */
         }
        .history-number {
            display: inline-block;
            width: 30px; /* Slightly larger */
            height: 30px;
            line-height: 30px;
            border-radius: 50%;
            text-align: center;
            font-weight: bold;
            margin: 3px;
            font-size: 0.9rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .roulette-table-container {
            width: 100%; /* Make table container take width */
            max-width: 100%; /* Prevent overflow if library table is large */
             overflow-x: auto; /* Add scroll if table is wider than container */
        }
         .roulette-table-card-body {
             /* Ensure table has space, prevent stretching */
             min-height: 200px; /* Adjust as needed */
         }
        /* Ensure library table scales reasonably */
        .roulette-table-container .casino-roulette-table {
            margin: 0 auto; /* Center the table if library allows */
            transform: scale(0.9); /* Example: scale down slightly */
             transform-origin: top center;
        }
      `}</style>
    </Container>
  );
}

export default RouletteGame;