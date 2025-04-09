import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, FormControl, Card, ListGroup, Alert, Table } from 'react-bootstrap';
import RoulettePro from 'react-roulette-pro';
import 'react-roulette-pro/dist/index.css'; // Import css
import './Roulette.css'; // Import the component's CSS

import betService from '../../services/betService';
import ruletaService from '../../services/ruletaService'; // Assuming a specific service
import { useAuth } from '../../context/AuthContext'; // Import useAuth

// European roulette numbers and their colors
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Define prizes for the roulette wheel component (order matters for indexing)
const generateRoulettePrizes = () => {
  const prizes = [];
  // Standard European roulette layout order
  const layout = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  layout.forEach(num => {
    let color = 'black';
    if (num === 0) color = 'green';
    else if (redNumbers.includes(num)) color = 'red';
    prizes.push({
        id: String(num), // id must be unique string
        text: String(num),
        style: { backgroundColor: color, textColor: 'white', fontWeight: 'bold', fontSize: '18px' }
    });
  });
  return prizes;
};

function RouletteGame() {
  const { user } = useAuth(); // Get user from context
  const [userBalance, setUserBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10); // Default bet (for traditional form)
  const [betType, setBetType] = useState('numero'); // Default bet type (for traditional form)
  const [betValue, setBetValue] = useState('0'); // Value for the bet (for traditional form)
  const [result, setResult] = useState(null); // Stores { message, type: 'success'/'danger' }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChip, setSelectedChip] = useState(10); // Default chip value
  const [placedBets, setPlacedBets] = useState([]); // Track multiple bets on table
  const [totalBetAmount, setTotalBetAmount] = useState(0); // Total of all placed bets

  // Roulette animation state
  const [roulettePrizes, setRoulettePrizes] = useState(generateRoulettePrizes());
  const [startSpin, setStartSpin] = useState(false); // Controls the start prop of RoulettePro
  const [prizeIndex, setPrizeIndex] = useState(0); // Target index for the wheel animation
  const [spinning, setSpinning] = useState(false); // Tracks if the wheel *animation* is running
  const [currentWinningNumber, setCurrentWinningNumber] = useState(null); // Stores the number generated for the current spin
  const [lastWinningNumber, setLastWinningNumber] = useState(null); // For display purposes after spin
  const [lastWinningColor, setLastWinningColor] = useState(null); // For display purposes after spin

  // Reference for the table cells to highlight winning bets
  const tableRef = useRef(null);

  // Helper to get index from number based on our prizes array
  const getNumberIndex = useCallback((number) => {
    return roulettePrizes.findIndex(prize => prize.text === String(number));
  }, [roulettePrizes]);

  useEffect(() => {
    if (user) {
      setUserBalance(user.saldo || 0); // Set balance directly from context user
    } else {
        console.error('User data not found in context!');
        setUserBalance(0); // Set balance to 0 if user context is missing
    }
    // Add logic if user is not logged in (though auth is bypassed now)
  }, [user]); // Depend on the user object from context

  // Fetch recent bets (consider moving fetch logic to betService)
  const fetchBetHistory = useCallback(async () => {
      const userId = user?.id; // Get userId from context user
      if (!userId) return;
      try {
        // Assuming betService.getUserBets fetches bets for the logged-in user
        // You might need to adjust this based on your actual service implementation
        const bets = await betService.getUserBets(userId); // Adjust if needed
        const rouletteBets = bets
          .filter(bet => bet.juego && bet.juego.nombre.toLowerCase() === 'ruleta' && bet.estado !== 'PENDIENTE')
          .sort((a, b) => b.id - a.id) // Sort by most recent
          .slice(0, 5); // Take last 5 resolved
        setHistory(rouletteBets);
      } catch (error) {
        console.error('Failed to fetch bet history:', error);
        setHistory([]); // Clear history on error
      }
  }, [user]); // Depend on user context object

  useEffect(() => {
    fetchBetHistory();
  }, [user, fetchBetHistory]); // Re-fetch when user ID changes

  const getNumberColor = (number) => {
    if (number === 0) return 'green';
    if (redNumbers.includes(number)) return 'red';
    return 'black';
  };

  // Handle chip selection
  const handleChipSelect = (value) => {
    setSelectedChip(value);
  };

  // Handle placing a bet on the table
  const handleTableBet = (betType, betValue) => {
    if (spinning || loading) return; // Prevent betting while spinning/loading

    // Check if we have enough balance
    // Note: We check total balance vs total bet amount *before* spinning
    if (totalBetAmount + selectedChip > userBalance) {
      setResult({ message: 'Insufficient balance for this additional bet.', type: 'danger' });
      return;
    }

    // Create a new bet object
    const newBet = {
      id: Date.now(), // Unique temporary ID for UI key
      type: betType,
      value: String(betValue), // Ensure value is string
      amount: selectedChip
    };

    // Add to placed bets
    setPlacedBets(prev => [...prev, newBet]);
    setTotalBetAmount(prev => prev + selectedChip);
    setResult(null); // Clear previous messages
  };

  // Remove a placed bet
  const removeBet = (betId) => {
    if (spinning || loading) return; // Prevent changes while spinning/loading

    const betToRemove = placedBets.find(bet => bet.id === betId);
    if (betToRemove) {
      setPlacedBets(prev => prev.filter(bet => bet.id !== betId));
      setTotalBetAmount(prev => prev - betToRemove.amount);
    }
  };

  // Clear all placed bets
  const clearAllBets = () => {
    if (spinning || loading) return; // Prevent changes while spinning/loading

    setPlacedBets([]);
    setTotalBetAmount(0);
  };

  // --- NEW FUNCTION TO HANDLE SPIN AND BACKEND CALLS ---
  const handleSpinAndPlaceBets = async () => {
      // Prevent action if already spinning, loading, or no bets placed
      if (spinning || loading || placedBets.length === 0) {
          console.log('Spin prevented: already spinning, loading, or no bets placed.');
          return;
      }

      // Check total balance vs total bet
      if (totalBetAmount > userBalance) {
          setResult({ message: 'Total bet amount exceeds balance.', type: 'danger' });
          return;
      }

      const userId = user?.id;
      if (!userId) {
          setResult({ message: 'User not identified. Cannot place bet.', type: 'danger' });
          return;
      }

      // 1. Generate Winning Number & Prepare Animation
      setLoading(true);
      setResult(null);
      const numeroGanador = Math.floor(Math.random() * 37); // Generate 0-36 *** WINNING NUMBER GENERATED HERE ***
      setCurrentWinningNumber(numeroGanador); // Store it for onSpinEnd/highlight
      console.log(`Frontend generated winning number: ${numeroGanador}`);
      const targetPrizeIndex = getNumberIndex(numeroGanador);

      if (targetPrizeIndex === -1) {
         console.error(`Error: Generated number ${numeroGanador} not found in roulette prizes array.`);
         setResult({ message: `Internal error: Invalid number ${numeroGanador} generated.`, type: 'danger' });
         setLoading(false);
         return;
      }

      setPrizeIndex(targetPrizeIndex); // Set target for the wheel animation
      setStartSpin(true); // Trigger the start prop change in RoulettePro

      // 2. Prepare and Send Bets to Backend
      const betPromises = placedBets.map(bet => {
          const betData = {
              usuarioId: userId,
              cantidad: bet.amount,
              tipo: bet.type, // Use 'tipo' as expected by service
              valorApostado: bet.value, // Use 'valorApostado' as expected by service
              numeroGanador: numeroGanador // *** Pass the generated number ***
          };
          // Use the updated ruletaService.jugar which sends numeroGanador
          return ruletaService.jugar(betData);
      });

      // 3. Process Backend Responses
      try {
          console.log(`Sending ${betPromises.length} bet(s) to backend with winning number ${numeroGanador}`);
          const results = await Promise.all(betPromises);
          console.log('Backend responses received:', results);

          // Process results: Aggregate win/loss, update balance
          let finalBalance = userBalance; // Start with current client balance
          let totalWinLoss = 0;
          let successfulBets = 0;

          results.forEach(res => {
              if (res && res.resolvedBet) {
                   successfulBets++;
                   totalWinLoss += res.resolvedBet.winloss || 0;
                   // IMPORTANT: Trust the final balance returned by the backend if available
                   // This handles potential discrepancies or updates during the requests.
                   if (res.resolvedBet.usuario && typeof res.resolvedBet.usuario.balance === 'number') {
                        finalBalance = res.resolvedBet.usuario.balance; // Get the authoritative balance
                   } else {
                        // Fallback: update client-side (less reliable)
                        // This might happen if backend doesn't return full user object in resolvedBet
                        // Recalculate based on initial balance minus total bet + total winloss ONLY if needed
                        console.warn("Backend response didn't include final user balance. Calculating locally.");
                        // This calculation is tricky if calls fail midway. Best effort:
                        // Assume initial balance - total placed + total winloss from successful bets
                        finalBalance = userBalance - totalBetAmount + totalWinLoss;
                   }
              } else {
                   console.warn("A bet might have failed or returned unexpected data:", res);
              }
          });

           // Only update balance if at least one bet was processed, otherwise it might be incorrect
           if (successfulBets > 0) {
                setUserBalance(finalBalance); // Update UI with the final authoritative balance
           } else if (results.length > 0) { // If requests were sent but all failed
               setResult({ message: 'Failed to process bets on the server.', type: 'danger' });
           }


          // Set aggregated result message (after animation finishes ideally, but setting it now)
           setResult({
               message: `Spin result: ${numeroGanador}. Processed ${successfulBets}/${results.length} bets. Total Win/Loss: ${totalWinLoss.toFixed(2)}`,
               type: totalWinLoss >= 0 ? 'success' : 'warning'
           });


          fetchBetHistory(); // Refresh history after processing

      } catch (error) {
          console.error('Error processing bet promises:', error);
          // Use the error message thrown by the service
          setResult({ message: error.message || 'An error occurred processing bets.', type: 'danger' });
          // Don't update balance on complete failure
          // Consider how to handle partial failures (e.g., some bets succeed, some fail)
      } finally {
          setLoading(false); // Stop loading indicator
          // setSpinning(false); // IMPORTANT: Let onSpinEnd handle this based on animation
          setPlacedBets([]); // Clear bets from table AFTER processing
          setTotalBetAmount(0);
          setStartSpin(false); // Reset start trigger for next spin (important for toggling)
      }
  };

  // Highlight winning bets on the table - called from onSpinEnd
  const highlightWinningBets = (winningNumber) => {
    if (!tableRef.current || winningNumber === null) return; // Ensure table exists and number is valid

    console.log(`Highlighting winning bets for number: ${winningNumber}`);
    setLastWinningNumber(winningNumber); // Update display for last number shown
    const winningColor = getNumberColor(winningNumber);
    setLastWinningColor(winningColor);

    // Reset all previous highlights
    const allCells = tableRef.current.querySelectorAll('.roulette-cell.winning-cell');
    allCells.forEach(cell => {
      cell.classList.remove('winning-cell');
    });

    // Allow a brief moment for removal before adding new highlights
    setTimeout(() => {
        // Add highlight to winning number cell itself
        const winningCell = tableRef.current.querySelector(`.roulette-cell[data-bet-type="numero"][data-bet-value="${winningNumber}"]`);
        if (winningCell) {
          winningCell.classList.add('winning-cell');
        }

        // Highlight other winning outside bets based on the winningNumber
        const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
        const isLow = winningNumber >= 1 && winningNumber <= 18;
        const dozen = winningNumber === 0 ? 0 : Math.ceil(winningNumber / 12);
        const column = winningNumber === 0 ? 0 : (winningNumber % 3 === 0 ? 3 : winningNumber % 3);

        // Highlight color bet cell (if not 0)
        if (winningColor !== 'green') {
          const colorCell = tableRef.current.querySelector(`.roulette-cell[data-bet-type="color"][data-bet-value="${winningColor}"]`);
          if (colorCell) colorCell.classList.add('winning-cell');
        }

        // Highlight parity bet cell (if not 0)
        if (winningNumber !== 0) {
          const parityCell = tableRef.current.querySelector(`.roulette-cell[data-bet-type="paridad"][data-bet-value="${isEven ? 'par' : 'impar'}"]`);
          if (parityCell) parityCell.classList.add('winning-cell');
        }

        // Highlight high/low bet cell (if not 0)
        if (winningNumber !== 0) {
          const halfCell = tableRef.current.querySelector(`.roulette-cell[data-bet-type="mitad"][data-bet-value="${isLow ? 'bajo' : 'alto'}"]`);
          if (halfCell) halfCell.classList.add('winning-cell');
        }

        // Highlight dozen bet cell (if not 0)
        if (dozen !== 0) {
          const dozenCell = tableRef.current.querySelector(`.roulette-cell[data-bet-type="docena"][data-bet-value="${dozen}"]`);
          if (dozenCell) dozenCell.classList.add('winning-cell');
        }

        // Highlight column bet cell (if not 0)
        if (column !== 0) {
          const columnCell = tableRef.current.querySelector(`.roulette-cell[data-bet-type="columna"][data-bet-value="${column}"]`);
          if (columnCell) columnCell.classList.add('winning-cell');
        }
    }, 50); // Small delay to ensure clean visual update
  };


  // --- Traditional Form Handling (Kept separate for now) ---
  const handleBetAmountChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) {
        value = ''; // Allow clearing the input
    } else if (value > userBalance) {
        value = userBalance; // Cap at user balance
    }
    setBetAmount(value);
  };

  const handleBetTypeChange = (e) => {
    const type = e.target.value;
    setBetType(type);
    // Reset bet value based on type
    if (type === 'numero') setBetValue('0');
    else if (type === 'color') setBetValue('rojo'); // Use backend values
    else if (type === 'paridad') setBetValue('par'); // Use backend values
    else if (type === 'docena') setBetValue('1'); // 1st dozen
    else if (type === 'columna') setBetValue('1'); // 1st column
    else if (type === 'mitad') setBetValue('bajo'); // Low half (1-18)
  };

  const handleBetValueChange = (e) => {
    setBetValue(e.target.value);
  };

  // Function specifically for the traditional form's button
  const handlePlaceBetFromForm = async () => {
      if (!betAmount || betAmount <= 0) {
          setResult({ message: 'Please enter a valid bet amount.', type: 'danger' });
          return;
      }
      if (betAmount > userBalance) {
          setResult({ message: 'Insufficient balance.', type: 'danger' });
          return;
      }
      const userId = user?.id;
      if (!userId) {
          setResult({ message: 'User not identified. Cannot place bet.', type: 'danger' });
          return;
      }
      if (spinning || loading) {
           setResult({ message: 'Please wait for the current spin to finish.', type: 'warning' });
           return;
      }

      // Add the form bet to placedBets and trigger the main spin logic
      handleTableBet(betType, betValue); // Use handleTableBet to add it

       // Optionally, trigger the spin immediately after adding the form bet
       // Or let the user click the main SPIN button separately
       // For now, let's assume the user clicks SPIN separately after staging bets.
       // If you want immediate spin:
       // handleSpinAndPlaceBets(); // Call this AFTER state updates from handleTableBet (might need useEffect or timeout)
        console.log("Traditional bet added to table. Click SPIN to play.");
        setResult({ message: 'Bet added. Click SPIN to play.', type: 'info' });

      // --- Old Form Logic (Removed - Replaced by adding to placedBets) ---
      /*
      setLoading(true);
      setResult(null);
      // ... generate number, call service, etc. ... (Duplication of handleSpinAndPlaceBets)
      */
  };


  // Render bet value input based on type (for traditional form)
  const renderBetValueInput = () => {
    // ... (implementation remains the same as provided before)
    switch (betType) {
        case 'numero': return ( <Form.Control type="number" value={betValue} onChange={handleBetValueChange} min="0" max="36" disabled={spinning || loading}/> );
        case 'color': return ( <Form.Select value={betValue} onChange={handleBetValueChange} disabled={spinning || loading}> <option value="rojo">Red</option> <option value="negro">Black</option> </Form.Select> );
        case 'paridad': return ( <Form.Select value={betValue} onChange={handleBetValueChange} disabled={spinning || loading}> <option value="par">Even</option> <option value="impar">Odd</option> </Form.Select> );
        case 'docena': return ( <Form.Select value={betValue} onChange={handleBetValueChange} disabled={spinning || loading}> <option value="1">1st 12 (1-12)</option> <option value="2">2nd 12 (13-24)</option> <option value="3">3rd 12 (25-36)</option> </Form.Select> );
        case 'columna': return ( <Form.Select value={betValue} onChange={handleBetValueChange} disabled={spinning || loading}> <option value="1">1st Column</option> <option value="2">2nd Column</option> <option value="3">3rd Column</option> </Form.Select> );
        case 'mitad': return ( <Form.Select value={betValue} onChange={handleBetValueChange} disabled={spinning || loading}> <option value="bajo">Low (1-18)</option> <option value="alto">High (19-36)</option> </Form.Select> );
        default: return null;
      }
  };

  // --- JSX Structure ---
  return (
    <Container fluid className="roulette-container">
      <h2 className="text-center mb-4">Casino Roulette</h2>

      {/* Balance Display */}
      <Row className="mb-3">
        <Col className="text-center">
            <Card className="bg-dark text-light balance-card">
               <Card.Body>
                    <Row>
                        <Col>
                             <h5 className="mb-0">Balance: <span className="text-success fw-bold">${userBalance.toFixed(2)}</span></h5>
                        </Col>
                         {totalBetAmount > 0 && (
                             <Col className="text-end">
                                  <span className="me-3">Total Bet: ${totalBetAmount.toFixed(2)}</span>
                                  <span>Remaining: ${(userBalance - totalBetAmount).toFixed(2)}</span> /*cambiar por llamada backend */
                             </Col>
                         )}
                    </Row>
               </Card.Body>
            </Card>
        </Col>
      </Row>

      <Row className="justify-content-center mb-4 align-items-center">
         {/* Chip Selection (Moved slightly left) */}
         <Col md={3} className="text-center">
             <Card>
                 <Card.Header>Chip Selection</Card.Header>
                 <Card.Body className="chip-selector">
                      {[1, 5, 10, 25, 50, 100].map(value => (
                           <div
                                key={value}
                                className={`chip ${selectedChip === value ? 'selected' : ''} chip-${value}`} // Added value specific class
                                onClick={() => handleChipSelect(value)}
                                title={`Select $${value} chip`}
                           >
                                ${value}
                           </div>
                      ))}
                 </Card.Body>
                  <Card.Footer>
                      <Button
                           variant="danger"
                           size="sm"
                           onClick={clearAllBets}
                           disabled={spinning || loading || placedBets.length === 0}
                           className="w-100"
                      >
                           Clear All Table Bets
                      </Button>
                  </Card.Footer>
             </Card>
         </Col>

         {/* Roulette Wheel & Result Display */}
        <Col md={6} className="text-center">
          <div className="wheel-container">
            <RoulettePro
              prizes={roulettePrizes}
              prizeIndex={prizeIndex}
              start={startSpin}
              spinningTime={8} // Adjust duration as needed
              onSpinStart={() => {
                  console.log('RoulettePro: onSpinStart triggered.');
                  setSpinning(true); // Mark animation as running
                  setResult(null); // Clear previous result message at start of spin
              }}
              // Use onPrizeReached if available, otherwise onSpinEnd
              onPrizeReached={() => {
                  console.log(`RoulettePro: onPrizeReached triggered. Winning Number: ${currentWinningNumber}`);
                  setSpinning(false); // Mark animation as finished
                  highlightWinningBets(currentWinningNumber); // Highlight the table based on the number
                  setCurrentWinningNumber(null); // Clear the temporary winning number state
              }}
              // Fallback if onPrizeReached isn't the correct prop name
              onSpinEnd={() => {
                    console.log(`RoulettePro: onSpinEnd triggered. Winning Number: ${currentWinningNumber}`);
                    if (!spinning) return; // Avoid double calls if library calls both
                    setSpinning(false);
                    highlightWinningBets(currentWinningNumber);
                    setCurrentWinningNumber(null);
              }}
              defaultPrizeIndex={getNumberIndex(0)} // Start pointing at 0
              classes={{
                  prizeItem: 'custom-prize-item',
                  rouletteContainer: 'custom-roulette-container'
              }}
              designOptions={{ // Example: Customize colors if needed
                    borderColor: '#D3A625', // Gold-like border
                    mainBackground: '#333',
              }}
              sound={true} // Enable default sounds
            />
          </div>

           {/* Result Message Area */}
           <div className="result-message-area mt-3" style={{ minHeight: '50px' }}>
                {result && (
                    <Alert variant={result.type} className="mt-3 mb-0 fade show" role="alert">
                         {result.message}
                    </Alert>
                )}
           </div>


          {/* Last Numbers Display */}
           <div className="last-numbers mt-2">
                Last Number:
                {lastWinningNumber !== null ? (
                     <span className="last-number ms-2" style={{ backgroundColor: lastWinningColor, color: 'white' }}>
                          {lastWinningNumber}
                     </span>
                ) : (
                    <span className="text-muted ms-2">N/A</span>
                )}
           </div>

        </Col>

        {/* History (Moved slightly right) */}
         <Col md={3} className="text-center">
            <Card>
                <Card.Header>Recent History</Card.Header>
                 <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                     {history.length > 0 ? (
                          history.map(bet => (
                               <ListGroup.Item key={bet.id} className={`d-flex justify-content-between align-items-center list-group-item-action text-start small p-2 ${bet.estado === 'GANADA' ? 'list-group-item-success' : 'list-group-item-danger'}`}>
                                    <span>
                                         {bet.tipo}: {bet.valorApostado} (${bet.cantidad.toFixed(2)})
                                    </span>
                                     <span className={`fw-bold ${bet.estado === 'GANADA' ? 'text-success' : 'text-danger'}`}>
                                         {bet.estado === 'GANADA' ? `+${bet.winloss.toFixed(2)}` : `${bet.winloss.toFixed(2)}`}
                                     </span>
                               </ListGroup.Item>
                          ))
                     ) : (
                         <ListGroup.Item className="text-muted text-center p-2">No recent bets</ListGroup.Item>
                     )}
                 </ListGroup>
            </Card>
         </Col>
      </Row>

        {/* Placed Bets & Spin Button Area */}
         <Row className="justify-content-center align-items-center placed-bets-spin-area mb-4">
             <Col xs={12} md={9}>
                 <div className="placed-bets-container">
                      {placedBets.length > 0 ? placedBets.map(bet => (
                           <div key={bet.id} className="placed-bet" title={`Bet $${bet.amount} on ${bet.type}: ${bet.value}`}>
                                {`$${bet.amount} on ${bet.value}`} {/* Simplified display */}
                                <Button
                                     variant="link"
                                     size="sm"
                                     className="remove-bet"
                                     onClick={() => removeBet(bet.id)}
                                     disabled={spinning || loading}
                                     title="Remove this bet"
                                >
                                     ×
                                </Button>
                           </div>
                      )) : <span className="text-muted">Click on the table or use form to place bets</span> }
                 </div>
             </Col>
              <Col xs={12} md={3} className="text-center spin-button-container">
                  <Button
                       variant="success"
                       size="lg"
                       className="spin-button"
                       // Use handleSpinAndPlaceBets here
                       onClick={handleSpinAndPlaceBets}
                       // Disable if spinning, loading, or no bets are placed
                       disabled={spinning || loading || placedBets.length === 0}
                       title={placedBets.length === 0 ? "Place bets before spinning" : "Spin the wheel!"}
                  >
                       {spinning ? 'Spinning...' : (loading ? 'Processing...' : 'SPIN')}
                  </Button>
              </Col>
         </Row>

        {/* Roulette Table */}
         <Row className="justify-content-center mb-4">
             <Col md={10}>
                 {/* Pass necessary props like handleTableBet */}
                 <div className="roulette-table-container" ref={tableRef}>
                      <div className="roulette-table">
                           {/* Zero */}
                           <div className="roulette-cell zero" data-number="0" data-bet-type="numero" data-bet-value="0" style={{ backgroundColor: 'green', color: 'white' }} onClick={() => handleTableBet('numero', '0')} title="Bet on 0">0</div>
                           {/* Numbers Grid */}
                           <div className="numbers-grid">
                                {[...Array(36)].map((_, i) => {
                                     const num = i + 1;
                                     const color = redNumbers.includes(num) ? 'red' : 'black';
                                     return ( <div key={num} className="roulette-cell number" data-number={num} data-bet-type="numero" data-bet-value={String(num)} style={{ backgroundColor: color, color: 'white' }} onClick={() => handleTableBet('numero', String(num))} title={`Bet on ${num}`}>{num}</div> );
                                })}
                           </div>
                           {/* Outside Bets */}
                           <div className="outside-bets">
                                {/* Columns */}
                                <div className="roulette-cell column" data-bet-type="columna" data-bet-value="1" onClick={() => handleTableBet('columna', '1')} title="Bet on 1st Column">1st Col</div>
                                <div className="roulette-cell column" data-bet-type="columna" data-bet-value="2" onClick={() => handleTableBet('columna', '2')} title="Bet on 2nd Column">2nd Col</div>
                                <div className="roulette-cell column" data-bet-type="columna" data-bet-value="3" onClick={() => handleTableBet('columna', '3')} title="Bet on 3rd Column">3rd Col</div>
                                {/* Dozens */}
                                <div className="roulette-cell dozen" data-bet-type="docena" data-bet-value="1" onClick={() => handleTableBet('docena', '1')} title="Bet on 1st Dozen (1-12)">1st 12</div>
                                <div className="roulette-cell dozen" data-bet-type="docena" data-bet-value="2" onClick={() => handleTableBet('docena', '2')} title="Bet on 2nd Dozen (13-24)">2nd 12</div>
                                <div className="roulette-cell dozen" data-bet-type="docena" data-bet-value="3" onClick={() => handleTableBet('docena', '3')} title="Bet on 3rd Dozen (25-36)">3rd 12</div>
                                {/* Simple Bets */}
                                <div className="simple-bets">
                                     <div className="roulette-cell simple-bet" data-bet-type="mitad" data-bet-value="bajo" onClick={() => handleTableBet('mitad', 'bajo')} title="Bet on Low (1-18)">1-18</div>
                                     <div className="roulette-cell simple-bet" data-bet-type="paridad" data-bet-value="par" onClick={() => handleTableBet('paridad', 'par')} title="Bet on Even">EVEN</div>
                                     <div className="roulette-cell simple-bet red-bet" data-bet-type="color" data-bet-value="rojo" style={{ backgroundColor: 'red', color: 'white' }} onClick={() => handleTableBet('color', 'rojo')} title="Bet on Red">RED</div>
                                     <div className="roulette-cell simple-bet black-bet" data-bet-type="color" data-bet-value="negro" style={{ backgroundColor: 'black', color: 'white' }} onClick={() => handleTableBet('color', 'negro')} title="Bet on Black">BLACK</div>
                                     <div className="roulette-cell simple-bet" data-bet-type="paridad" data-bet-value="impar" onClick={() => handleTableBet('paridad', 'impar')} title="Bet on Odd">ODD</div>
                                     <div className="roulette-cell simple-bet" data-bet-type="mitad" data-bet-value="alto" onClick={() => handleTableBet('mitad', 'alto')} title="Bet on High (19-36)">19-36</div>
                                </div>
                           </div>
                      </div>
                 </div>
             </Col>
         </Row>

        {/* Traditional Betting Form (Optional) */}
         <Row className="justify-content-center mb-4">
             <Col md={8} lg={6}>
                 {/* Basic implementation - Consider using Accordion or similar for better UX */}
                 <details>
                     <summary>Show Traditional Betting Form</summary>
                     <Card className="mt-2">
                          <Card.Body>
                               <Form onSubmit={(e) => { e.preventDefault(); handlePlaceBetFromForm(); }}>
                                    <Form.Group as={Row} className="mb-3" controlId="betAmountInput">
                                         <Form.Label column sm={4}>Bet Amount:</Form.Label>
                                         <Col sm={8}>
                                              <InputGroup>
                                                   <InputGroup.Text>$</InputGroup.Text>
                                                   <FormControl type="number" value={betAmount} onChange={handleBetAmountChange} min="0.01" step="0.01" max={userBalance?.toString() || "0"} isInvalid={betAmount > userBalance} disabled={spinning || loading} />
                                              </InputGroup>
                                               {betAmount > userBalance && <Form.Text className="text-danger">Insufficient balance.</Form.Text>}
                                         </Col>
                                    </Form.Group>
                                     <Form.Group as={Row} className="mb-3" controlId="betType">
                                          <Form.Label column sm={4}>Bet Type:</Form.Label>
                                          <Col sm={8}>{renderBetValueInput() /* Renders the correct input based on betType */}</Col>
                                     </Form.Group>
                                      {/* Button to add form bet to table */}
                                      <div className="d-grid">
                                           <Button variant="secondary" onClick={handlePlaceBetFromForm} disabled={loading || spinning || !betAmount || betAmount <= 0 || betAmount > userBalance}>
                                                Add Bet to Table
                                           </Button>
                                      </div>
                                      <Form.Text className="text-muted d-block mt-2">
                                           Use this form to add a bet, then click the main 'SPIN' button above the table to play all placed bets.
                                      </Form.Text>
                               </Form>
                          </Card.Body>
                     </Card>
                 </details>
             </Col>
         </Row>

    </Container>
  );
}

export default RouletteGame;