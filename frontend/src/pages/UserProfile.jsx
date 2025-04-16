import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Tabs, Tab, Button } from 'react-bootstrap';
// Importa FaCrown junto con los otros iconos
import { FaUser, FaCalendarAlt, FaCoins, FaGamepad, FaTrophy, FaPercentage, FaChartLine, FaSync, FaDice, FaCrown } from 'react-icons/fa';
import authService from '../services/authService';
import betService from '../services/betService';
import rankingService from '../services/rankingService';
import { useAuth } from '../context/AuthContext';

import { GiRollingDices } from "react-icons/gi";
import rouletteImg from '../components/images/rouletteimg.png';
// Quita FaGem si no se usa en otro lugar (parece que getGameIcon no se está usando realmente en el return)
// import { FaGem } from "react-icons/fa"; 

const UserProfile = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({});
  const [bets, setBets] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameStats, setGameStats] = useState({
    dice: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
    roulette: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 }
  });

  useEffect(() => {
    if (user) {
      setUserData(user);
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userBets = await betService.getUserBets(user.id);
      console.log('User bets with game info:', userBets);
      setBets(Array.isArray(userBets) ? userBets : []);

      // Fetch user rankings
      const userRankings = await rankingService.getUserRankings(user.id);
      console.log('Fetched user rankings:', userRankings); // Añade un log para verificar
      setRankings(Array.isArray(userRankings) ? userRankings : []);

      await fetchGameSpecificStats();
      setError('');
    } catch (err) {
      setError('Failed to load user data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameSpecificStats = async () => {
    // ... (sin cambios en esta función)
    if (!user?.id) return;

    try {
      // Fetch dice game stats (game ID 2)
      const diceBets = await betService.getUserGameBets(user.id, 2);
      if (Array.isArray(diceBets)) {
        const totalDiceBets = diceBets.length;
        const winningDiceBets = diceBets.filter(bet => bet.estado === 'GANADA').length;
        const diceProfitLoss = diceBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
        const diceWinRate = totalDiceBets > 0 ? (winningDiceBets / totalDiceBets) * 100 : 0;

        // Fetch roulette game stats (game ID 1)
        const rouletteBets = await betService.getUserGameBets(user.id, 1);
        const totalRouletteBets = Array.isArray(rouletteBets) ? rouletteBets.length : 0;
        const winningRouletteBets = Array.isArray(rouletteBets)
          ? rouletteBets.filter(bet => bet.estado === 'GANADA').length
          : 0;
        const rouletteProfitLoss = Array.isArray(rouletteBets)
          ? rouletteBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0)
          : 0;
        const rouletteWinRate = totalRouletteBets > 0
          ? (winningRouletteBets / totalRouletteBets) * 100
          : 0;

        setGameStats({
          dice: {
            totalBets: totalDiceBets,
            winRate: diceWinRate,
            totalWins: winningDiceBets,
            totalProfit: diceProfitLoss
          },
          roulette: {
            totalBets: totalRouletteBets,
            winRate: rouletteWinRate,
            totalWins: winningRouletteBets,
            totalProfit: rouletteProfitLoss
          }
        });
      }
    } catch (error) {
      console.error('Error fetching game-specific stats:', error);
    }
  };

  const calculateStats = () => {
    // ... (sin cambios en esta función)
    if (!Array.isArray(bets) || bets.length === 0) {
      return {
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        netProfit: 0,
        winRate: 0,
        maxBet: 0,
        maxLoss: 0,
        maxWin: 0
      };
    }

    const totalBets = bets.length;
    const totalWagered = bets.reduce((sum, bet) => sum + (bet.cantidad || 0), 0);

    const wonBets = bets.filter(bet => bet.estado === 'GANADA');
    const lostBets = bets.filter(bet => bet.estado === 'PERDIDA');

    const totalWon = wonBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
    const totalLost = lostBets.reduce((sum, bet) => sum + Math.abs(bet.winloss || 0), 0);

    const netProfit = totalWon - totalLost;
    const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;

    const maxBet = bets.reduce((max, bet) => Math.max(max, bet.cantidad || 0), 0);
    const maxLoss = lostBets.reduce((min, bet) => Math.min(min, bet.winloss || 0), 0); // winloss en perdidas es negativo
    const maxWin = wonBets.reduce((max, bet) => Math.max(max, bet.winloss || 0), 0);


    return {
      totalBets,
      totalWagered,
      totalWon,
      totalLost,
      netProfit,
      winRate,
      maxBet,
      maxLoss: Math.abs(maxLoss), // Muestra la máxima pérdida como positivo
      maxWin
    };
  };

  // ** NUEVA LÓGICA **: Determinar si el usuario es #1 y en qué
  const numberOneRankings = Array.isArray(rankings) ? rankings.filter(r => r.posicion === 1) : [];
  const isNumberOne = numberOneRankings.length > 0;
  const numberOneRankingDetails = numberOneRankings.map(r => ({
    type: r.tipo,
    game: r.juego?.nombre || 'Overall' // Usa 'Overall' si no hay juego específico
  }));
  // ****************

  const stats = calculateStats();

  if (loading) {
    return (
      <Container className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading profile...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-center mb-4">My Profile</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {/* --- Tarjeta de Perfil Modificada --- */}
        <Col lg={4} className="mb-4 ">
          <Card className="profile-card h-100 text-white">
            <Card.Body className="text-center">
              {/* ** MODIFICACIÓN AQUÍ **: Mostrar Corona o Usuario */}
              <div className="avatar-placeholder mb-3">
                {isNumberOne ? (
                  <>
                    <FaCrown size={60} color="#FFD700" /> {/* Color dorado para la corona */}
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', lineHeight: '1.3' }}>
                      {numberOneRankingDetails.map((detail, index) => (
                        <div key={index}>
                           #1 en {detail.type.replace(/_/g, ' ')} {/* Reemplaza guiones bajos */}
                          ({detail.game})
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <FaUser size={60} />
                )}
              </div>
              {/* *************************************** */}

              <Card.Title style={{ paddingBottom: '10px' }}>{userData.username || 'User'}</Card.Title>
              <Card.Subtitle className="mb-3 text-white" >{userData.email || 'No email'}</Card.Subtitle>

              <div className="d-flex justify-content-between mb-3">
                <div>
                  <FaCalendarAlt className="me-2" />
                  <small>Joined</small>
                </div>
                <small>{userData.fechaRegistro ? new Date(userData.fechaRegistro).toLocaleDateString() : 'N/A'}</small>
              </div>

              <div className="balance-display p-3 mb-3 rounded" style={{ backgroundColor: '#334155' }}>
                <h5 className="mb-1">Current Balance</h5>
                <h3 className="mb-0 text-warning">
                  <FaCoins className="me-2" />
                  {/* Usar user?.balance primero para datos más actualizados si están disponibles */}
                  {user?.balance?.toFixed(2) || userData.balance?.toFixed(2) || '0.00'}
                </h3>
              </div>

              <div className="role-badge">
                <Badge bg={userData.rol === 'ADMIN' ? 'danger' : 'info'} className="p-2">
                  {userData.rol || 'USER'}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* --- Fin Tarjeta de Perfil --- */}

        <Col lg={8}>
           {/* El resto del componente (Tabs de Estadísticas, Historial, Rankings) permanece igual */}
           <Card>
             <Card.Header>
               <Tabs defaultActiveKey="stats" className="card-header-tabs">
                 {/* Statistics Tab */}
                 <Tab eventKey="stats" title={<><FaCoins className="me-1" /> Statistics</>}>
                    {/* ... contenido de la pestaña Statistics sin cambios ... */}
                    <div className="p-3">
                      <Row>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Total Bets</h6>
                            <h4>{stats.totalBets}</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Total Wagered</h6>
                            <h4>${stats.totalWagered.toFixed(2)}</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Win Rate</h6>
                            <h4>{stats.winRate.toFixed(1)}%</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Total Won</h6>
                            <h4 className="text-success">${stats.totalWon.toFixed(2)}</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Total Lost</h6>
                            <h4 className="text-danger">${stats.totalLost.toFixed(2)}</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Net Profit</h6>
                            <h4 className={stats.netProfit >= 0 ? 'text-success' : 'text-danger'}>
                              ${stats.netProfit.toFixed(2)}
                            </h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Max bet</h6>
                            <h4>${stats.maxBet.toFixed(2)}</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Max Loss</h6>
                            <h4 className="text-danger">${stats.maxLoss.toFixed(2)}</h4>
                          </div>
                        </Col>
                        <Col sm={6} md={4} className="mb-3">
                          <div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}>
                            <h6>Max Win</h6>
                            <h4 className="text-success">${stats.maxWin.toFixed(2)}</h4>
                          </div>
                        </Col>
                      </Row>
                    
                      {/* Game-specific statistics */}
                      <h5 className="mt-4 mb-3 d-flex justify-content-between align-items-center">
                        <span>Game Statistics</span>
                        <Button variant="outline-primary" size="sm" onClick={fetchGameSpecificStats}>
                          <FaSync className="me-1" /> Refresh Stats
                        </Button>
                      </h5>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                            <Card.Header className="d-flex justify-content-between align-items-center border-top-2" style={{ backgroundColor: '#011b45' }}>
                              <span>Dice Game</span>
                              <GiRollingDices size={20} color="#3498db" />
                            </Card.Header>
                            <Card.Body>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Total Bets:</span>
                                <span>{gameStats.dice.totalBets}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Win Rate:</span>
                                <span className="text-info">
                                  <FaPercentage className="me-1" />{gameStats.dice.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Total Wins:</span>
                                <span className="text-warning">
                                  <FaTrophy className="me-1" />{gameStats.dice.totalWins}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Net Profit:</span>
                                <span className={gameStats.dice.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                                  <FaCoins className="me-1" />${gameStats.dice.totalProfit.toFixed(2)}
                                </span>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                            <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#011b45' }}>
                              <span>Roulette</span>
                              <img src={rouletteImg} alt="Roulette Icon" width={40} height={30} />
                            </Card.Header>
                            <Card.Body>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Total Bets:</span>
                                <span>{gameStats.roulette.totalBets}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Win Rate:</span>
                                <span className="text-info">
                                  <FaPercentage className="me-1" />{gameStats.roulette.winRate.toFixed(1)}%
                                </span>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Total Wins:</span>
                                <span className="text-warning">
                                  <FaTrophy className="me-1" />{gameStats.roulette.totalWins}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Net Profit:</span>
                                <span className={gameStats.roulette.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                                  <FaCoins className="me-1" />${gameStats.roulette.totalProfit.toFixed(2)}
                                </span>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                 </Tab>

                 {/* Bet History Tab */}
                 <Tab eventKey="bets" title={<><FaGamepad className="me-1" /> Bet History</>}>
                   {/* ... contenido de la pestaña Bet History sin cambios ... */}
                   <div className="p-3">
                      {bets.length > 0 ? (
                        <Table responsive hover variant="dark">
                          <thead>
                            <tr>
                              <th>Game</th>
                              <th>Bet Type</th>
                              <th>Amount</th>
                              <th>Result</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bets.map((bet, index) => (
                              <tr key={index}>
                                <td className="align-middle">
                                  {(bet.juego?.nombre === 'Dados' || bet.juegoId === 2) ? (
                                    <div className="d-flex align-items-center">
                                      <GiRollingDices size={20} color="#3498db" className="me-2" />
                                      <span>Dice Game</span>
                                    </div>
                                  ) : (bet.juego?.nombre === 'Ruleta' || bet.juegoId === 1) ? (
                                    <div className="d-flex align-items-center">
                                      <img src={rouletteImg} alt="Roulette" width={25} height={20} className="me-2" />
                                      <span>Roulette Game</span>
                                    </div>
                                  ) : (
                                    <span>{bet.juego?.nombre || 'Unknown Game'}</span> // Fallback
                                  )}
                                </td>
                                <td>
                                  {/* Lógica mejorada para mostrar el tipo de apuesta */}
                                  { (bet.juegoId === 2) ? ( // Juego de Dados
                                      bet.tipo === 'parimpar' ? `Even/Odd: ${bet.valorApostado}` :
                                      bet.tipo === 'numero' ? `Sum: ${bet.valorApostado}` :
                                      `${bet.tipo}: ${bet.valorApostado}` // Fallback para Dados
                                    ) : (bet.juegoId === 1) ? ( // Juego de Ruleta
                                      bet.tipo === 'NUMERO' ? `Number: ${bet.valorApostado}` :
                                      bet.tipo === 'COLOR' ? `Color: ${bet.valorApostado}` :
                                      bet.tipo === 'PARIDAD' ? `Parity: ${bet.valorApostado}` :
                                      `${bet.tipo}: ${bet.valorApostado}` // Fallback para Ruleta
                                    ) : ( // Otros juegos o si falta juegoId
                                      `${bet.tipo || 'N/A'}: ${bet.valorApostado || 'N/A'}`
                                    )
                                  }
                                </td>
                                <td>${(bet.cantidad ?? 0).toFixed(2)}</td>
                                <td>
                                  <Badge 
                                     bg={bet.estado === 'GANADA' ? 'success' : bet.estado === 'PERDIDA' ? 'danger' : 'secondary'} 
                                     className="d-flex align-items-center justify-content-center px-2 py-1" // Ajusta padding
                                    style={{ minWidth: '100px' }} // Asegura un ancho mínimo para la legibilidad
                                   >
                                    {bet.estado === 'GANADA' ? (
                                      <>
                                        <FaTrophy className="me-1" size={12} />
                                        WON ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : '0.00'}
                                      </>
                                    ) : bet.estado === 'PERDIDA' ? (
                                      <>
                                        LOST ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : (bet.cantidad ?? 0).toFixed(2)} 
                                        {/* Muestra winloss si existe (debería ser negativo), si no la cantidad apostada */}
                                      </>
                                    ) : (
                                       bet.estado // Estado pendiente o desconocido
                                    )}
                                  </Badge>
                                </td>
                                <td>{bet.fechaApuesta ? new Date(bet.fechaApuesta).toLocaleString() : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-center my-3">No bet history available.</p>
                      )}
                    </div>
                 </Tab>

                 {/* My Rankings Tab */}
                 <Tab eventKey="myRankings" title={<><FaTrophy className="me-1" /> My Rankings</>}>
                    {/* ... contenido de la pestaña My Rankings sin cambios ... */}
                    <div className="p-3">
                      {rankings.length > 0 ? (
                        <Table responsive hover variant='dark'>
                          <thead>
                            <tr>
                              <th>Ranking Type</th>
                              <th>Game</th>
                              <th>Value</th>
                              <th>Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rankings.map((ranking, index) => (
                              <tr key={index}>
                                <td>{ranking.tipo.replace(/_/g, ' ')}</td>
                                <td>{ranking.juego?.nombre || 'Overall'}</td>
                                <td>
                                  {ranking.tipo.includes('PROFIT') || ranking.tipo.includes('AMOUNT') ?
                                    `$${parseFloat(ranking.valor || 0).toFixed(2)}` :
                                    ranking.valor}
                                </td>
                                <td>
                                  <Badge bg={ranking.posicion === 1 ? 'warning' : ranking.posicion === 2 ? 'secondary' : ranking.posicion === 3 ? 'danger' : 'info'}>
                                    #{ranking.posicion}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className="text-center my-3">No ranking data available.</p>
                      )}
                    </div>
                 </Tab>

                 {/* Global Rankings Tab */}
                 <Tab eventKey="globalRankings" title={<><FaChartLine className="me-1" /> Global Rankings</>}>
                    {/* ... contenido de la pestaña Global Rankings sin cambios (asumiendo que usas datos de ejemplo o los obtendrás de una API) ... */}
                     <div className="p-3">
                      {/* Aquí necesitarías cargar los rankings globales desde tu servicio */}
                      <p className="text-center fst-italic">Global ranking data currently unavailable. Fetching mechanism required.</p>
                      {/* Ejemplo estático (eliminar o reemplazar con datos reales) */}
                      <Row>
                        <Col md={6} className="mb-4">
                          <Card style={{ backgroundColor: '#2a3441' }}>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <span>Top Winners (Example)</span>
                              <Badge bg="warning">By Profit</Badge>
                            </Card.Header>
                            <Card.Body>
                              <Table responsive hover size="sm" variant='dark'>
                                <thead>
                                  <tr><th>#</th><th>Player</th><th>Total Profit</th></tr>
                                </thead>
                                <tbody>
                                  <tr><td><Badge bg="warning">1</Badge></td><td>player1</td><td className="text-success">$10,245.50</td></tr>
                                  <tr><td><Badge bg="secondary">2</Badge></td><td>player2</td><td className="text-success">$8,125.75</td></tr>
                                  <tr><td><Badge bg="danger">3</Badge></td><td>player3</td><td className="text-success">$6,890.25</td></tr>
                                  {/* ... más filas ... */}
                                </tbody>
                              </Table>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6} className="mb-4">
                          <Card style={{ backgroundColor: '#2a3441' }}>
                             <Card.Header className="d-flex justify-content-between align-items-center">
                              <span>Most Active Players (Example)</span>
                              <Badge bg="info">By Bets</Badge>
                            </Card.Header>
                             <Card.Body>
                              <Table responsive hover size="sm" variant='dark'>
                                <thead>
                                  <tr><th>#</th><th>Player</th><th>Total Bets</th></tr>
                                </thead>
                                <tbody>
                                  <tr><td><Badge bg="warning">1</Badge></td><td>player7</td><td>1,245</td></tr>
                                   <tr><td><Badge bg="secondary">2</Badge></td><td>player2</td><td>987</td></tr>
                                   <tr><td><Badge bg="danger">3</Badge></td><td>player9</td><td>856</td></tr>
                                  {/* ... más filas ... */}
                                </tbody>
                              </Table>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                     </div>
                 </Tab>

               </Tabs>
             </Card.Header>
           </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;