import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Tabs, Tab, Button, Spinner, Pagination } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaCoins, FaGamepad, FaTrophy, FaPercentage, FaChartLine, FaSync, FaDice, FaCrown } from 'react-icons/fa';
import userService from '../services/userService';
import betService from '../services/betService';
import rankingService from '../services/rankingService';
import { useAuth } from '../context/AuthContext';
import { GiRollingDices } from "react-icons/gi";
import rouletteImg from '../components/images/rouletteimg.png';

const UserProfile = () => {
    const { user } = useAuth();

    const [profileData, setProfileData] = useState({});
    const [bets, setBets] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [gameStats, setGameStats] = useState({
        dice: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
        roulette: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 }
    });

    // Estados para la paginación del historial de apuestas
    const [currentPage, setCurrentPage] = useState(1);
    const [betsPerPage] = useState(10); // Puedes ajustar este número

    const fetchProfileData = useCallback(async (userId) => {
        if (!userId) return;
        const indicateLoading = (isLoading) => {
            if (isRefreshing) return;
            setLoading(isLoading);
        }
        indicateLoading(true);
        setError('');
        try {
            const [fetchedUserDetails, userBets, userRankings] = await Promise.all([
                userService.getUserById(userId),
                betService.getUserBets(userId), // Asumimos que esto devuelve TODAS las apuestas
                rankingService.getUserRankings(userId),
            ]);
            console.log('Fetched fresh user details for profile:', fetchedUserDetails);
            console.log('User bets with game info:', userBets);
            console.log('Fetched user rankings:', userRankings);

            if (fetchedUserDetails) {
                const balance = fetchedUserDetails.saldo !== undefined
                    ? Number(fetchedUserDetails.saldo)
                    : (fetchedUserDetails.balance !== undefined ? Number(fetchedUserDetails.balance) : 0);
                if (isNaN(balance)) {
                    console.warn("Fetched balance is NaN:", fetchedUserDetails.saldo ?? fetchedUserDetails.balance);
                }
                setProfileData({ ...fetchedUserDetails, balance: isNaN(balance) ? 0 : balance });
            } else {
                setProfileData({});
            }
            console.log('USER BETS:', userBets);
            setBets(Array.isArray(userBets) ? userBets.sort((a, b) => new Date(b.fechaApuesta) - new Date(a.fechaApuesta)) : []); // Ordenar apuestas por fecha descendente
            setRankings(Array.isArray(userRankings) ? userRankings : []);
            await fetchGameSpecificStats(userId);
        } catch (err) {
            setError('Failed to load user profile data. Please try again later.');
            console.error("Error fetching profile data:", err);
        } finally {
            indicateLoading(false);
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    const fetchGameSpecificStats = async (userId) => {
        if (!userId) return;
        try {
            const diceBets = await betService.getUserGameBets(userId, 2);
            let diceStats = { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
            if (Array.isArray(diceBets)) {
                const totalDiceBets = diceBets.length;
                const winningDiceBets = diceBets.filter(bet => bet.estado === 'GANADA').length;
                const diceProfitLoss = diceBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const diceWinRate = totalDiceBets > 0 ? (winningDiceBets / totalDiceBets) * 100 : 0;
                diceStats = { totalBets: totalDiceBets, winRate: diceWinRate, totalWins: winningDiceBets, totalProfit: diceProfitLoss };
            }

            const rouletteBets = await betService.getUserGameBets(userId, 1);
            let rouletteStats = { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
            if (Array.isArray(rouletteBets)) {
                const totalRouletteBets = rouletteBets.length;
                const winningRouletteBets = rouletteBets.filter(bet => bet.estado === 'GANADA').length;
                const rouletteProfitLoss = rouletteBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const rouletteWinRate = totalRouletteBets > 0 ? (winningRouletteBets / totalRouletteBets) * 100 : 0;
                rouletteStats = { totalBets: totalRouletteBets, winRate: rouletteWinRate, totalWins: winningRouletteBets, totalProfit: rouletteProfitLoss };
            }
            setGameStats({ dice: diceStats, roulette: rouletteStats });
        } catch (error) {
            console.error('Error fetching game-specific stats:', error);
            setError(prev => prev ? prev + '\nFailed to load game stats.' : 'Failed to load game stats.');
        }
    };

    useEffect(() => {
        const currentUserId = user?.id;
        if (currentUserId) {
            fetchProfileData(currentUserId);
        } else {
            setLoading(false);
            setIsRefreshing(false);
            setBets([]);
            setRankings([]);
            setGameStats({
                dice: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
                roulette: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 }
            });
            setProfileData({});
            setError('');
        }
    }, [user?.id, fetchProfileData]);

    const handleRefresh = () => {
        if (user?.id && !isRefreshing) {
            setIsRefreshing(true);
            setCurrentPage(1); // Resetear a la primera página al refrescar
            fetchProfileData(user.id);
        }
    };

    const calculateStats = () => {
        if (!Array.isArray(bets) || bets.length === 0) {
            return { totalBets: 0, totalWagered: 0, totalWon: 0, totalLost: 0, netProfit: 0, winRate: 0, maxBet: 0, maxLoss: 0, maxWin: 0 };
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
        const maxLoss = lostBets.reduce((min, bet) => Math.min(min, bet.winloss || 0), 0); // Esto dará un número negativo o cero
        const maxWin = wonBets.reduce((max, bet) => Math.max(max, bet.winloss || 0), 0);
        return { totalBets, totalWagered, totalWon, totalLost, netProfit, winRate, maxBet, maxLoss: Math.abs(maxLoss), maxWin };
    };

    const stats = calculateStats();

    // Lógica de paginación para el historial de apuestas
    const indexOfLastBet = currentPage * betsPerPage;
    const indexOfFirstBet = indexOfLastBet - betsPerPage;
    const currentBets = bets.slice(indexOfFirstBet, indexOfLastBet);
    const totalPages = Math.ceil(bets.length / betsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const numberOneRankings = Array.isArray(rankings) ? rankings.filter(r => r.posicion === 1) : [];
    const isNumberOne = numberOneRankings.length > 0;
    const numberOneRankingDetails = numberOneRankings.map(r => ({
        type: r.tipo,
        game: r.juego?.nombre || 'Overall'
    }));

    if (loading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" variant="primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading profile...</p>
            </Container>
        );
    }

    return (
        <Container>
            <h2 className="text-center mb-4">My Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row>
                {/* Profile Card */}
                <Col lg={4} className="mb-4 ">
                    <Card className="profile-card h-100 text-white">
                        <Card.Body className="text-center">
                            <div className="avatar-placeholder mb-3">
                                {isNumberOne ? (<FaCrown size={60} color="#FFD700"/>) : (<FaUser size={60} />)}
                                {isNumberOne && (
                                    <div style={{ marginTop: '8px', fontSize: '0.8rem', lineHeight: '1.3' }}>
                                        {numberOneRankingDetails.map((detail, index) => (<div key={index}>#{1} en {detail.type.replace(/_/g, ' ')} ({detail.game})</div>))}
                                    </div>
                                )}
                            </div>
                            <Card.Title style={{ paddingBottom: '10px' }}>{profileData.username || 'User'}</Card.Title>
                            <Card.Subtitle className="mb-3 text-white">{profileData.email || 'No email'}</Card.Subtitle>
                            <div className="d-flex justify-content-between mb-3">
                                <div><FaCalendarAlt className="me-2" /><small>Joined</small></div>
                                <small>{profileData.fechaRegistro ? new Date(profileData.fechaRegistro).toLocaleDateString() : 'N/A'}</small>
                            </div>
                            <div className="balance-display p-3 mb-3 rounded" style={{ backgroundColor: '#334155' }}>
                                <h5 className="mb-1">Current Balance</h5>
                                <h3 className="mb-0 text-warning">
                                    <FaCoins className="me-2" />
                                    {(profileData?.balance ?? 0).toFixed(2)}
                                </h3>
                            </div>
                            <div className="role-badge">
                                <Badge bg={profileData.rol === 'ADMIN' ? 'danger' : 'info'} className="p-2">
                                    {profileData.rol || 'USER'}
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Stats/History/Rankings Tabs */}
                <Col lg={8}>
                    <Card>
                        <Card.Header>
                            <Tabs defaultActiveKey="stats" id="profile-tabs" className="card-header-tabs justify-content-around">
                                {/* Statistics Tab */}
                                <Tab eventKey="stats" title={<><FaCoins className="me-1" /> Statistics</>}>
                                    <div className="p-3">
                                        <Row>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Total Bets</h6><h4>{stats.totalBets}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Total Wagered</h6><h4>${stats.totalWagered.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Win Rate</h6><h4>{(stats.winRate?? 0).toFixed(1)}%</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Total Won</h6><h4 className="text-success">${stats.totalWon.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Total Lost</h6><h4 className="text-danger">${stats.totalLost.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Net Profit</h6><h4 className={stats.netProfit >= 0 ? 'text-success' : 'text-danger'}>${stats.netProfit.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Max bet</h6><h4>${stats.maxBet.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Max Loss</h6><h4 className="text-danger">${stats.maxLoss.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item text-center p-2 rounded" style={{ backgroundColor: '#334155' }}><h6>Max Win</h6><h4 className="text-success">${stats.maxWin.toFixed(2)}</h4></div></Col>
                                        </Row>
                                        <h5 className="mt-4 mb-3 d-flex justify-content-between align-items-center">
                                            <span>Game Statistics</span>
                                            <Button variant="outline-primary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                                            {isRefreshing ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Refreshing...</>) : (<><FaSync className="me-1" /> Refresh Profile</>)}
                                            </Button>
                                        </h5>
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                                                    <Card.Header className="d-flex justify-content-between align-items-center border-top-2" style={{ backgroundColor: '#011b45' }}>
                                                        <span>Dice Game</span> <GiRollingDices size={20} color="#3498db" />
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Bets:</span> <span>{gameStats.dice.totalBets}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Win Rate:</span>
                                                            <span className="text-info"><FaPercentage className="me-1" />{(gameStats.dice.winRate ?? 0).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Wins:</span>
                                                            <span className="text-warning"><FaTrophy className="me-1" />{gameStats.dice.totalWins}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Net Profit:</span>
                                                            <span className={gameStats.dice.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                                                                <FaCoins className="me-1" />${(gameStats.dice.totalProfit ?? 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                                                    <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#011b45' }}>
                                                        <span>Roulette</span> <img src={rouletteImg} alt="Roulette Icon" width={40} height={30} />
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Bets:</span> <span>{gameStats.roulette.totalBets}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Win Rate:</span>
                                                            <span className="text-info"><FaPercentage className="me-1" />{(gameStats.roulette.winRate ?? 0).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Wins:</span>
                                                            <span className="text-warning"><FaTrophy className="me-1" />{gameStats.roulette.totalWins}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Net Profit:</span>
                                                            <span className={gameStats.roulette.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                                                                <FaCoins className="me-1" />${(gameStats.roulette.totalProfit ?? 0).toFixed(2)}
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
                                    <div className="p-3">
                                        {bets.length > 0 ? (
                                            <>
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
                                                        {currentBets.map((bet, index) => (
                                                            <tr key={bet.id || index}>
                                                                <td className="align-middle">
                                                                    {(bet.juego?.nombre === 'Dados' || bet.juegoId === 2) ? (
                                                                        <div className="d-flex align-items-center"><GiRollingDices size={20} color="#3498db" className="me-2" /><span>Dice Game</span></div>
                                                                    ) : (bet.juego?.nombre === 'Ruleta' || bet.juegoId === 1) ? (
                                                                        <div className="d-flex align-items-center"><img src={rouletteImg} alt="Roulette" width={25} height={20} className="me-2" /><span>Roulette Game</span></div>
                                                                    ) : (
                                                                        <span>{bet.juego?.nombre || 'Unknown Game'}</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {(bet.juegoId === 2) ? (
                                                                        bet.tipo === 'parimpar' ? `Even/Odd: ${bet.valorApostado}` :
                                                                        bet.tipo === 'numero' ? `Sum: ${bet.valorApostado}` :
                                                                        `${bet.tipo}: ${bet.valorApostado}`
                                                                    ) : (bet.juegoId === 1) ? (
                                                                        bet.tipo === 'NUMERO' ? `Number: ${bet.valorApostado}` :
                                                                        bet.tipo === 'COLOR' ? `Color: ${bet.valorApostado}` :
                                                                        bet.tipo === 'PARIDAD' ? `Parity: ${bet.valorApostado}` :
                                                                        `${bet.tipo}: ${bet.valorApostado}`
                                                                    ) : (
                                                                        `${bet.tipo || 'N/A'}: ${bet.valorApostado || 'N/A'}`
                                                                    )}
                                                                </td>
                                                                <td>${(bet.cantidad ?? 0).toFixed(2)}</td>
                                                                <td>
                                                                    <Badge
                                                                        bg={bet.estado === 'GANADA' ? 'success' : bet.estado === 'PERDIDA' ? 'danger' : 'secondary'}
                                                                        className="d-flex align-items-center justify-content-center px-2 py-1"
                                                                        style={{ minWidth: '100px' }}
                                                                    >
                                                                        {bet.estado === 'GANADA' ? (
                                                                            <><FaTrophy className="me-1" size={12} />WON ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : '0.00'}</>
                                                                        ) : bet.estado === 'PERDIDA' ? (
                                                                            <>LOST ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : (bet.cantidad ?? 0).toFixed(2)}</>
                                                                        ) : (
                                                                            bet.estado
                                                                        )}
                                                                    </Badge>
                                                                </td>
                                                                <td>{bet.fechaApuesta ? new Date(bet.fechaApuesta).toLocaleString() : 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                                {totalPages > 1 && (
                                                    <Pagination className="justify-content-center mt-3">
                                                        <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                                                        <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                                        {[...Array(totalPages).keys()].map(number => {
                                                            // Mostrar un número limitado de páginas para evitar saturación
                                                            const pageNumber = number + 1;
                                                            if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)) {
                                                                return (
                                                                    <Pagination.Item key={pageNumber} active={pageNumber === currentPage} onClick={() => paginate(pageNumber)}>
                                                                        {pageNumber}
                                                                    </Pagination.Item>
                                                                );
                                                            } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                                                                return <Pagination.Ellipsis key={pageNumber} />;
                                                            }
                                                            return null;
                                                        })}
                                                        <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                                                        <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                                                    </Pagination>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-center my-3">No bet history available.</p>
                                        )}
                                    </div>
                                </Tab>

                                {/* My Rankings Tab */}
                                <Tab eventKey="myRankings" title={<><FaTrophy className="me-1" /> My Rankings</>}>
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
                                                        <tr key={ranking.id || index}>
                                                            <td>{ranking.tipo.replace(/_/g, ' ')}</td>
                                                            <td>{ranking.juego?.nombre || 'Overall'}</td>
                                                            <td>
                                                                {ranking.tipo.includes('PROFIT') || ranking.tipo.includes('AMOUNT')
                                                                    ? `$${parseFloat(ranking.valor || 0).toFixed(2)}`
                                                                    : ranking.tipo.includes('WIN_RATE')
                                                                    ? `${parseFloat(ranking.valor || 0).toFixed(1)}%`
                                                                    : ranking.valor}
                                                            </td>
                                                            <td>
                                                                <Badge
                                                                    bg={
                                                                        ranking.posicion === 1 ? 'warning' :
                                                                        ranking.posicion === 2 ? 'secondary' :
                                                                        ranking.posicion === 3 ? 'danger' :
                                                                        'info'
                                                                    }
                                                                >
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