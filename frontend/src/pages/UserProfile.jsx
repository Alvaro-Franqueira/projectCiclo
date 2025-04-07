import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaCoins, FaGamepad, FaTrophy } from 'react-icons/fa';
import authService from '../services/authService';
import betService from '../services/betService';
import rankingService from '../services/rankingService';

const UserProfile = () => {
  const [userData, setUserData] = useState({});
  const [bets, setBets] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get user data from local storage
        const user = authService.getUserData();
        setUserData(user);
        
        if (user && user.id) {
          // Fetch user bets
          const userBets = await betService.getUserBets(user.id);
          setBets(userBets);
          
          // Fetch user rankings
          const userRankings = await rankingService.getUserRankings(user.id);
          setRankings(userRankings);
        }
        
        setError('');
      } catch (err) {
        setError('Failed to load user data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const calculateStats = () => {
    if (!bets || bets.length === 0) {
      return {
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        netProfit: 0,
        winRate: 0
      };
    }
    
    const totalBets = bets.length;
    const totalWagered = bets.reduce((sum, bet) => sum + bet.cantidad, 0);
    
    const wonBets = bets.filter(bet => bet.estado === 'GANADA');
    const lostBets = bets.filter(bet => bet.estado === 'PERDIDA');
    
    const totalWon = wonBets.reduce((sum, bet) => sum + bet.winloss, 0);
    const totalLost = lostBets.reduce((sum, bet) => sum + Math.abs(bet.winloss), 0);
    
    const netProfit = totalWon - totalLost;
    const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;
    
    return {
      totalBets,
      totalWagered,
      totalWon,
      totalLost,
      netProfit,
      winRate
    };
  };

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
        <Col lg={4} className="mb-4">
          <Card className="profile-card h-100">
            <Card.Body className="text-center">
              <div className="avatar-placeholder mb-3">
                <FaUser size={60} />
              </div>
              <Card.Title>{userData.username || 'User'}</Card.Title>
              <Card.Subtitle className="mb-3 text-muted">{userData.email || 'No email'}</Card.Subtitle>
              
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
                  ${userData.balance?.toFixed(2) || '0.00'}
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
        
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Betting Statistics</h5>
            </Card.Header>
            <Card.Body>
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
              </Row>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <Tabs defaultActiveKey="bets" className="card-header-tabs">
                <Tab eventKey="bets" title={<><FaGamepad className="me-1" /> Bet History</>}>
                  <div className="p-3">
                    {bets.length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Game</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Result</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bets.map((bet, index) => (
                            <tr key={index}>
                              <td>{bet.juego?.nombre || 'Unknown'}</td>
                              <td>{bet.tipo} - {bet.valor}</td>
                              <td>${bet.cantidad.toFixed(2)}</td>
                              <td>
                                <Badge bg={bet.estado === 'GANADA' ? 'success' : bet.estado === 'PERDIDA' ? 'danger' : 'warning'}>
                                  {bet.estado}
                                </Badge>
                              </td>
                              <td>{new Date(bet.fechaApuesta).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center my-3">No bet history available.</p>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="rankings" title={<><FaTrophy className="me-1" /> My Rankings</>}>
                  <div className="p-3">
                    {rankings.length > 0 ? (
                      <Table responsive hover>
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
                              <td>{ranking.tipo}</td>
                              <td>{ranking.juego?.nombre || 'Overall'}</td>
                              <td>
                                {ranking.tipo === 'OVERALL_PROFIT' || ranking.tipo === 'TOTAL_BETS_AMOUNT' ? 
                                  `$${parseFloat(ranking.valor).toFixed(2)}` : 
                                  ranking.valor}
                              </td>
                              <td>
                                <Badge bg={
                                  ranking.posicion === 1 ? 'warning' : 
                                  ranking.posicion === 2 ? 'secondary' : 
                                  ranking.posicion === 3 ? 'danger' : 
                                  'info'
                                }>
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
              </Tabs>
            </Card.Header>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;
