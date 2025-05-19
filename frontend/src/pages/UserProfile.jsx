import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {  Container, Row, Col, Card, Table, Badge, Alert, Tabs, Tab, Button, Spinner, Pagination, Image } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaCoins, FaGamepad, FaTrophy, FaPercentage, FaChartLine, FaSync, FaDice, FaCrown, FaMedal, FaMoneyBillWave, FaStar, FaAward } from 'react-icons/fa';
import userService from '../services/userService';
import { mdiEmoticonPoop } from '@mdi/js';
import { Icon } from '@mdi/react';
import betService from '../services/betService';
import rankingService from '../services/rankingService';
import { useAuth } from '../context/AuthContext';
import { GiRollingDices, GiCoins } from "react-icons/gi";
import rouletteImg from '../components/images/rouletteimg.png';
import kingLogo from '../components/images/king-logo.png';
import shitLogo from '../components/images/shitty-logo.png';
import blackjackImg from '../components/images/blackjack-white.png';
import slotMachineImg from '../components/images/seven-icon.png';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';



// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

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
    
    // Balance evolution chart data
    const [balanceHistory, setBalanceHistory] = useState([]);
    const [chartTimeframe, setChartTimeframe] = useState('all'); // 'all', 'month', 'week'

    // States for bet history pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [betsPerPage] = useState(10); // You can adjust this number
    
    // Calculate balance history from bets
    const calculateBalanceHistory = useCallback(() => {
        if (!Array.isArray(bets) || bets.length === 0 || !profileData.balance) {
            return [];
        }
        
        // Sort bets by date (oldest first)
        const sortedBets = [...bets].sort((a, b) => new Date(a.betDate) - new Date(b.betDate));
        
        // Calculate current balance
        const currentBalance = profileData.balance;
        
        // Calculate total profit/loss from all bets
        const totalProfitLoss = sortedBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
        
        // Estimate initial balance (current balance minus total profit/loss)
        const estimatedInitialBalance = Math.max(currentBalance - totalProfitLoss, 0);
        
        // Generate balance history
        let runningBalance = estimatedInitialBalance;
        const history = [{
            date: new Date(sortedBets[0].betDate).toISOString().split('T')[0],
            balance: runningBalance
        }];
        
        // Add each bet's impact on balance
        sortedBets.forEach(bet => {
            runningBalance += (bet.winloss || 0);
            // Only add a data point if the balance changed
            if (bet.winloss !== 0) {
                history.push({
                    date: new Date(bet.betDate).toISOString().split('T')[0],
                    balance: Math.max(runningBalance, 0) // Ensure balance doesn't go negative
                });
            }
        });
        
        // Filter history based on selected timeframe
        const now = new Date();
        let filteredHistory = history;
        
        if (chartTimeframe === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filteredHistory = history.filter(item => new Date(item.date) >= monthAgo);
        } else if (chartTimeframe === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredHistory = history.filter(item => new Date(item.date) >= weekAgo);
        }
        
        // If filtered history is empty, return the original history
        return filteredHistory.length > 0 ? filteredHistory : history;
    }, [bets, profileData.balance, chartTimeframe]);

    const fetchProfileData = useCallback(async (userId) => {
        if (!userId) return;
        const indicateLoading = (isLoading) => {
            if (isRefreshing) return;
            setLoading(isLoading);
        }
        indicateLoading(true);
        setError('');
        
        let hasProfileError = false;
        
        try {
            // Fetch user details and bets first - these are essential
            const [fetchedUserDetails, userBets] = await Promise.all([
                userService.getUserById(userId),
                betService.getUserBets(userId)
            ]);
            
            // Handle user details
            if (fetchedUserDetails) {
                const balance = fetchedUserDetails.balance !== undefined
                    ? Number(fetchedUserDetails.balance)
                    : 0;
                if (isNaN(balance)) {
                    console.warn("Fetched balance is NaN:", fetchedUserDetails.balance);
                }
                setProfileData({ ...fetchedUserDetails, balance: isNaN(balance) ? 0 : balance });
            } else {
                setProfileData({});
            }
            
            // Handle bets
            setBets(Array.isArray(userBets) ? userBets.sort((a, b) => new Date(b.betDate) - new Date(a.betDate)) : []);
            
        } catch (err) {
            console.error("Error fetching essential profile data:", err);
            setError('Failed to load essential profile data. Please try again later.');
            hasProfileError = true;
        }
        
        // Non-essential data - fetch separately so failures don't break the whole profile
        if (!hasProfileError) {
            try {
                // Fetch rankings with dedicated error handling
                const userRankings = await rankingService.getUserRankings(userId);
                console.log('DEBUG - Rankings response:', userRankings);
                console.log('DEBUG - Rankings length:', Array.isArray(userRankings) ? userRankings.length : 'not an array');
                
                if (Array.isArray(userRankings) && userRankings.length > 0) {
                    console.log('DEBUG - First ranking:', userRankings[0]);
                    console.log('DEBUG - Score:', userRankings[0].score);
                    console.log('DEBUG - Position:', userRankings[0].position);
                    console.log('DEBUG - Type:', userRankings[0].type);
                    console.log('DEBUG - Game-specific rankings:', userRankings.filter(r => r.game));
                    console.log('DEBUG - Global rankings:', userRankings.filter(r => !r.game));
                }
                
                setRankings(Array.isArray(userRankings) ? userRankings : []);
            } catch (rankingErr) {
                console.error("Error fetching rankings:", rankingErr);
                setRankings([]); // Empty array for clean UI
            }
            
            try {
                // Fetch game stats with dedicated error handling
                await fetchGameSpecificStats(userId);
            } catch (statsErr) {
                console.error("Error fetching game stats:", statsErr);
                // Use default empty game stats, which are set in the state initialization
            }
        }
        
        indicateLoading(false);
        setIsRefreshing(false);
    }, [isRefreshing]);

    const fetchGameSpecificStats = async (userId) => {
        if (!userId) return;
        try {
            const diceBets = await betService.getUserGameBets(userId, 2);
            let diceStats = { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
            if (Array.isArray(diceBets)) {
                const totalDiceBets = diceBets.length;
                const winningDiceBets = diceBets.filter(bet => bet.status === 'WON').length;
                const diceProfitLoss = diceBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const diceWinRate = totalDiceBets > 0 ? (winningDiceBets / totalDiceBets) * 100 : 0;
                diceStats = { totalBets: totalDiceBets, winRate: diceWinRate, totalWins: winningDiceBets, totalProfit: diceProfitLoss };
            }

            const rouletteBets = await betService.getUserGameBets(userId, 1);
            let rouletteStats = { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
            if (Array.isArray(rouletteBets)) {
                const totalRouletteBets = rouletteBets.length;
                const winningRouletteBets = rouletteBets.filter(bet => bet.status === 'WON').length;
                const rouletteProfitLoss = rouletteBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const rouletteWinRate = totalRouletteBets > 0 ? (winningRouletteBets / totalRouletteBets) * 100 : 0;
                rouletteStats = { totalBets: totalRouletteBets, winRate: rouletteWinRate, totalWins: winningRouletteBets, totalProfit: rouletteProfitLoss };
            }
            
            const blackjackBets = await betService.getUserGameBets(userId, 9);
            let blackjackStats = { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
            if (Array.isArray(blackjackBets)) {
                const totalBlackjackBets = blackjackBets.length;
                const winningBlackjackBets = blackjackBets.filter(bet => bet.status === 'WON').length;
                const blackjackProfitLoss = blackjackBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const blackjackWinRate = totalBlackjackBets > 0 ? (winningBlackjackBets / totalBlackjackBets) * 100 : 0;
                blackjackStats = { totalBets: totalBlackjackBets, winRate: blackjackWinRate, totalWins: winningBlackjackBets, totalProfit: blackjackProfitLoss };
            }
            
            // Add slot machine bets - check both IDs (7 and 10)
            const slotBets7 = await betService.getUserGameBets(userId, 7);
            const slotBets10 = await betService.getUserGameBets(userId, 10);
            
            // Combine bets from both possible IDs
            const slotBets = [
                ...(Array.isArray(slotBets7) ? slotBets7 : []),
                ...(Array.isArray(slotBets10) ? slotBets10 : [])
            ];
            
            let slotMachineStats = { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
            if (slotBets.length > 0) {
                const totalSlotBets = slotBets.length;
                const winningSlotBets = slotBets.filter(bet => bet.status === 'WON').length;
                const slotProfitLoss = slotBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const slotWinRate = totalSlotBets > 0 ? (winningSlotBets / totalSlotBets) * 100 : 0;
                slotMachineStats = { totalBets: totalSlotBets, winRate: slotWinRate, totalWins: winningSlotBets, totalProfit: slotProfitLoss };
            }
            
            setGameStats({ 
                dice: diceStats, 
                roulette: rouletteStats, 
                blackjack: blackjackStats,
                slotMachine: slotMachineStats
            });
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
            setBalanceHistory([]);
            setError('');
        }
    }, [user?.id, fetchProfileData]);
    
    // Calculate balance history when bets or timeframe changes
    useEffect(() => {
        if (bets.length > 0 && profileData.balance) {
            const history = calculateBalanceHistory();
            setBalanceHistory(history);
        }
    }, [bets, profileData.balance, chartTimeframe, calculateBalanceHistory]);

    const handleRefresh = () => {
        if (user?.id && !isRefreshing) {
            setIsRefreshing(true);
            setCurrentPage(1); // Resetear a la primera página al refrescar
            fetchProfileData(user.id);
        }
    };
    
    // Clear ranking cache and refresh data
    const clearRankingCache = () => {
        try {
            // Clear all ranking cache
            rankingService.clearCache();
            console.log('Ranking cache cleared successfully');
            
            // Refresh data to get fresh rankings
            if (user?.id) {
                setIsRefreshing(true);
                fetchProfileData(user.id);
            }
        } catch (error) {
            console.error('Error clearing ranking cache:', error);
            setError('Failed to clear ranking cache. Please try again.');
        }
    };
    
    // Calculate balance history from bets
   
    const calculateStats = () => {
        if (!Array.isArray(bets) || bets.length === 0) {
            return { totalBets: 0, totalWagered: 0, totalWon: 0, totalLost: 0, netProfit: 0, winRate: 0, maxBet: 0, maxLoss: 0, maxWin: 0 };
        }
        const totalBets = bets.length;
        const totalWagered = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
        const wonBets = bets.filter(bet => bet.status === 'WON');
        const lostBets = bets.filter(bet => bet.status === 'LOST');
        const totalWon = wonBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
        const totalLost = lostBets.reduce((sum, bet) => sum + Math.abs(bet.winloss || 0), 0);
        const netProfit = totalWon - totalLost;
        const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;
        const maxBet = bets.reduce((max, bet) => Math.max(max, bet.amount || 0), 0);
        const maxLoss = lostBets.reduce((min, bet) => Math.min(min, bet.winloss || 0), 0); // Esto dará un Number negativo o cero
        const maxWin = wonBets.reduce((max, bet) => Math.max(max, bet.winloss || 0), 0);
        return { totalBets, totalWagered, totalWon, totalLost, netProfit, winRate, maxBet, maxLoss: Math.abs(maxLoss), maxWin };
    };

    const stats = calculateStats();

    // Pagination logic for bet history
    const indexOfLastBet = currentPage * betsPerPage;
    const indexOfFirstBet = indexOfLastBet - betsPerPage;
    const currentBets = bets.slice(indexOfFirstBet, indexOfLastBet);
    const totalPages = Math.ceil(bets.length / betsPerPage);
    
    // Chart configuration
    const chartData = useMemo(() => {
        if (balanceHistory.length === 0) {
            return {
                labels: [],
                datasets: [{
                    label: 'Balance',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            };
        }
        
        return {
            labels: balanceHistory.map(item => item.date),
            datasets: [{
                label: 'Balance',
                data: balanceHistory.map(item => item.balance),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }, [balanceHistory]);
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#e2e8f0'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#e2e8f0',
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#e2e8f0'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Balance: $${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Check if user has #1 rankings
    const numberOneRankings = Array.isArray(rankings) ? rankings.filter(r => r.position === 1) : [];
    const isNumberOne = numberOneRankings.length > 0;
    
    // Check if user is #1 in any loser rankings
    const loserRankingTypes = ['TOP_LOSERS', 'BY_GAME_LOSSES'];
    const isTopLoser = numberOneRankings.some(r => loserRankingTypes.includes(r.type));
    
    const numberOneRankingDetails = numberOneRankings.map(r => ({
        type: r.type,
        game: r.game?.name || 'Overall',
        isLoserRanking: loserRankingTypes.includes(r.type)
    }));

    // Debugging ranking data
    if (Array.isArray(rankings) && rankings.length > 0) {
        console.log('Displaying rankings:', rankings);
        console.log('Number one rankings:', numberOneRankings);
        console.log('Number one ranking details:', numberOneRankingDetails);
    }

    // Helper function to get badge information based on ranking type
    const getBadgeForRanking = (type, game) => {
        // For debugging
        console.log('Getting badge for ranking type:', type);
        
        switch (type) {
            case 'OVERALL_PROFIT':
                return {
                    title: 'Top Profit',
                    icon: <FaMoneyBillWave size={50} color="#40c057" />,
                    bgColorStart: '#103221',
                    bgColorEnd: '#143325',
                    borderColor: '#40c057',
                    textColor: '#c0eb75'
                };
            case 'TOTAL_BETS_AMOUNT':
                return {
                    title: 'Top Better',
                    icon: <GiCoins size={60} color="#fcc419" />,
                    bgColorStart: '#312200',
                    bgColorEnd: '#462f00',
                    borderColor: '#fcc419',
                    textColor: '#ffe066'
                };
            case 'WIN_RATE':
                return {
                    title: 'Best Win %',
                    icon: <FaPercentage size={40} color="#4dabf7" />,
                    bgColorStart: '#0b2d4e',
                    bgColorEnd: '#0e345d',
                    borderColor: '#4dabf7',
                    textColor: '#a5d8ff'
                };
            case 'BY_GAME_AMOUNT':
                return {
                    title: 'Top Better',
                    icon: <FaTrophy size={55} color="#f06595" />,
                    bgColorStart: '#3d0d24',
                    bgColorEnd: '#4c102d',
                    borderColor: '#f06595',
                    textColor: '#ffdeeb'
                };
            case 'BY_GAME_WIN_RATE':
                return {
                    title: 'Best Win %',
                    icon: <FaPercentage size={40} color="#4dabf7"  />,
                    bgColorStart: '#0b2d4e',
                    bgColorEnd: '#0e345d',
                    borderColor: '#4dabf7',
                    textColor: '#a5d8ff'
                };
            case 'BY_GAME_PROFIT':
                return {
                    title: 'Top Profit',
                    icon: <FaMoneyBillWave size={50} color="#40c057" />,
                    bgColorStart: '#103221',
                    bgColorEnd: '#143325',
                    borderColor: '#40c057',
                    textColor: '#c0eb75'
                };
            case 'TOP_LOSERS':
            case 'BY_GAME_LOSSES':
                return {
                    title: 'Biggest Loser',
                    icon: <Icon path={mdiEmoticonPoop} size={1.8} color="#9c27b0" />,
                    bgColorStart: '#3b0a40',
                    bgColorEnd: '#4a0d50',
                    borderColor: '#9c27b0',
                    textColor: '#e9baff'
                };
            default:
                return {
                    title: 'Top Player',
                    icon: <FaMedal size={24} color="#FFD700" />,
                    bgColorStart: '#312500',
                    bgColorEnd: '#3d2f00',
                    borderColor: '#FFD700',
                    textColor: '#ffe066'
                };
        }
    };

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
                <Col lg={4} className="mb-4 card-profile">
                    <Card className="text-white" style={{ boxShadow: 'none' }}>
                        <Card.Body className="text-center">
                            <div className="avatar-placeholder mb-3">
                                {isNumberOne ? (
                                    isTopLoser ? (
                                        <Image 
                                            src={shitLogo} 
                                            alt="Loser Logo" 
                                            width={130} 
                                            height={130} 
                                            style={{ filter: 'drop-shadow(0 0 3px rgba(156, 39, 176, 0.5))', borderRadius: '24px' }} 
                                        />
                                    ) : (
                                        <Image 
                                            src={kingLogo} 
                                            alt="Casino Logo King" 
                                            width={130} 
                                            height={130} 
                                            style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))', borderRadius: '24px' }} 
                                        />
                                    )
                                ) : (
                                    <FaUser size={60} />
                                )}
                            </div>
                            <Card.Title style={{ paddingBottom: '10px' }}>{profileData.username || 'User'}</Card.Title>
                            <Card.Subtitle className="mb-3 text-white">{profileData.email || 'No email'}</Card.Subtitle>
                            
                            {/* Achievements Section */}
                            {isNumberOne && (
                                <div className="achievements-section mb-4">
                                    <h6 className="text-center mb-3">
                                        <FaTrophy className="me-2" color="#FFD700" />
                                        Top Rankings
                                    </h6>
                                    <div className="ranking-badges">
                                        {numberOneRankingDetails.map((detail, index) => {
                                            // Log badge details for debugging
                                            console.log(`Badge ${index}:`, detail);
                                            
                                            // Customize badge based on ranking type
                                            const badgeInfo = getBadgeForRanking(detail.type, detail.game);
                                            
                                            // Add special animation for loser rankings
                                            const isLoserRanking = detail.isLoserRanking;
                                            const badgeAnimation = isLoserRanking ? 
                                                'shake 2s infinite' : '';
                                            
                                            return (
                                                <div 
                                                    key={index} 
                                                    className="ranking-badge-container text-center p-2 mb-2"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${badgeInfo.bgColorStart} 0%, ${badgeInfo.bgColorEnd} 100%)`,
                                                        borderRadius: '8px',
                                                        border: `2px solid ${badgeInfo.borderColor}`,
                                                        boxShadow: `0 3px 6px rgba(0,0,0,0.2)`,
                                                        width: '48%',
                                                        animation: badgeAnimation
                                                    }}
                                                >
                                                    <div className="badge-icon mb-1">
                                                        {badgeInfo.icon}
                                                    </div>
                                                    <div className="badge-title" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: badgeInfo.textColor }}>
                                                        {badgeInfo.title}
                                                    </div>
                                                    <div className="badge-game" style={{ fontSize: '0.65rem', color: badgeInfo.textColor }}>
                                                        {detail.game}
                                                    </div>
                                                    {isLoserRanking && (
                                                        <div className="badge-loser" style={{ fontSize: '0.6rem', color: '#ff6b6b', marginTop: '2px' }}>
                                                            Biggest Loser
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            <div className="d-flex justify-content-between mb-3">
                                <div><FaCalendarAlt className="me-2" /><small>Joined</small></div>
                                <small>{profileData.registrationDate ? new Date(profileData.registrationDate).toLocaleDateString() : 'N/A'}</small>
                            </div>
                            <div className="balance-display p-3 mb-3 rounded" style={{ backgroundColor: '#334155' , borderColor: "#f59e0b", borderWidth: '1px', borderStyle: 'solid' }}>
                                <h5 className="mb-1">Current Balance</h5>
                                <h3 className="mb-0 text-warning">
                                    <FaCoins className="me-2" />
                                    {(profileData?.balance ?? 0).toFixed(2)}
                                </h3>
                            </div>
                            <div className="role-badge">
                                <Badge bg={profileData.role === 'ADMIN' ? 'danger' : 'info'} className="p-2">
                                    {profileData.role || 'USER'}
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Stats/History/Rankings Tabs */}
                <Col lg={8}>
                    <Card className='no-shadow'>
                    <Card.Header style={{ margin: 10, marginLeft:20, padding: 0, display: 'inline-block' }}>
                            <Tabs defaultActiveKey="stats" id="profile-tabs" className="card-header-tabs justify-content-around">
                                {/* Statistics Tab */}
                                <Tab eventKey="stats" title={<><FaCoins className="me-1" /> Statistics</>}>
                                    <div className="p-3 card-tab-body">
                                        {/* Balance Evolution Chart */}
                                        <Card className="mb-4" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                                            <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                                                <h5 className="mb-0"><FaChartLine className="me-2" /> Balance Evolution</h5>
                                                <div>
                                                    <Button 
                                                        variant={chartTimeframe === 'week' ? 'warning' : 'outline-secondary'} 
                                                        size="sm" 
                                                        className="me-2" 
                                                        onClick={() => setChartTimeframe('week')}
                                                    >
                                                        Week
                                                    </Button>
                                                    <Button 
                                                        variant={chartTimeframe === 'month' ? 'warning' : 'outline-secondary'} 
                                                        size="sm" 
                                                        className="me-2" 
                                                        onClick={() => setChartTimeframe('month')}
                                                    >
                                                        Month
                                                    </Button>
                                                    <Button 
                                                        variant={chartTimeframe === 'all' ? 'warning' : 'outline-secondary'} 
                                                        size="sm" 
                                                        onClick={() => setChartTimeframe('all')}
                                                    >
                                                        All Time
                                                    </Button>
                                                </div>
                                            </Card.Header>
                                            <Card.Body>
                                                {balanceHistory.length > 0 ? (
                                                    <div style={{ height: '300px', position: 'relative' }}>
                                                        <Line data={chartData} options={chartOptions} />
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <FaChartLine size={40} className="mb-3 text-secondary" />
                                                        <p>Not enough bet history to display balance evolution.</p>
                                                        <p className="text-muted small">Place more bets to see your balance change over time.</p>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                        
                                        <Row>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Total Bets</h6><h4>{stats.totalBets}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Total Wagered</h6><h4>${stats.totalWagered.toFixed(2)}</h4 ></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Win Rate</h6><h4>{(stats.winRate?? 0).toFixed(1)}%</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Total Won</h6><h4 className="text-success">${stats.totalWon.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Total Lost</h6><h4 className="text-danger">${stats.totalLost.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Net Profit</h6><h4 className={stats.netProfit >= 0 ? 'text-success' : 'text-danger'}>${stats.netProfit.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Max bet</h6><h4>${stats.maxBet.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Max Loss</h6><h4 className="text-danger">${stats.maxLoss.toFixed(2)}</h4></div></Col>
                                            <Col sm={6} md={4} className="mb-3"><div className="stat-item"><h6>Max Win</h6><h4 className="text-success">${stats.maxWin.toFixed(2)}</h4></div></Col>
                                        </Row>
                                        <h5 className="mt-4 mb-3 d-flex justify-content-between align-items-center text-white">
                                            <span>Game Statistics</span>
                                            <Button variant="outline-primary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                                            {isRefreshing ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Refreshing...</>) : (<><FaSync className="me-1 "  /> Refresh Profile</>)}
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
                                            <Col md={6} className="mb-3">
                                                <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                                                    <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#011b45' }}>
                                                        <span>Blackjack</span> <img src={blackjackImg} alt="Blackjack Icon" width={40} height={30} />
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Bets:</span> <span>{gameStats.blackjack.totalBets}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Win Rate:</span>
                                                            <span className="text-info"><FaPercentage className="me-1" />{(gameStats.blackjack.winRate ?? 0).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Wins:</span>
                                                            <span className="text-warning"><FaTrophy className="me-1" />{gameStats.blackjack.totalWins}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Net Profit:</span>
                                                            <span className={gameStats.blackjack.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                                                                <FaCoins className="me-1" />${(gameStats.blackjack.totalProfit ?? 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Card className="h-100" style={{ backgroundColor: '#294c85' }}>
                                                    <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#011b45' }}>
                                                        <span>Slot Machine</span> <img src={slotMachineImg} alt="Slot Machine Icon" width={40} height={30} />
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Bets:</span> <span>{gameStats.slotMachine.totalBets}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Win Rate:</span>
                                                            <span className="text-info"><FaPercentage className="me-1" />{(gameStats.slotMachine.winRate ?? 0).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Wins:</span>
                                                            <span className="text-warning"><FaTrophy className="me-1" />{gameStats.slotMachine.totalWins}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Net Profit:</span>
                                                            <span className={gameStats.slotMachine.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                                                                <FaCoins className="me-1" />${(gameStats.slotMachine.totalProfit ?? 0).toFixed(2)}
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
                                    <div className="p-3 card-tab-body">
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
                                                                    {(bet.game?.name === 'Dice' || bet.gameId === 2) ? (
                                                                        <div className="d-flex align-items-center"><GiRollingDices size={20} color="#3498db" className="me-2" /><span>Dice</span></div>
                                                                    ) : (bet.game?.name === 'Roulette' || bet.gameId === 1) ? (
                                                                        <div className="d-flex align-items-center"><img src={rouletteImg} alt="Roulette" width={25} height={20} className="me-2" /><span>Roulette</span></div>
                                                                    ) : (bet.game?.name === 'Blackjack' || bet.gameId === 9) ? (
                                                                        <div className="d-flex align-items-center"><img src={blackjackImg} alt="Blackjack" width={25} height={20} className="me-2" /><span>Blackjack</span></div>
                                                                    ) : (bet.game?.name === 'Slot Machine' || bet.gameId === 7 || bet.gameId === 10 || bet.type === 'SLOT_MACHINE') ? (
                                                                        <div className="d-flex align-items-center"><img src={slotMachineImg} alt="Slot Machine" width={25} height={20} className="me-2" /><span>Slot Machine</span></div>
                                                                    ) : (
                                                                        <span>{bet.game?.name || 'Unknown Game'}</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {(bet.gameId === 2) ? (
                                                                        bet.type === 'evenodd' ? `Even/Odd: ${bet.betValue}` :
                                                                        bet.type === 'number' ? `Sum: ${bet.betValue}` :
                                                                        `${bet.type}: ${bet.betValue}`
                                                                    ) : (bet.gameId === 1) ? (
                                                                        bet.type === 'NUMBER' ? `Number: ${bet.betValue}` :
                                                                        bet.type === 'COLOR' ? `Color: ${bet.betValue}` :
                                                                        bet.type === 'PARITY' ? `Parity: ${bet.betValue}` :
                                                                        `${bet.type}: ${bet.betValue}`
                                                                    ) : (bet.gameId === 9) ? (
                                                                        'Blackjack'
                                                                    ) : (bet.type === 'SLOT_MACHINE') ? ( 
                                                                        'Slot Machine'
                                                                    ) : (
                                                                        bet.type || 'Unknown Bet Type'
                                                                    )}
                                                                </td>
                                                                <td>${(bet.amount ?? 0).toFixed(2)}</td>
                                                                <td>
                                                                    <Badge
                                                                        bg={bet.status === 'WON' ? 'success' : bet.status === 'LOST' ? 'danger' : 'secondary'}
                                                                        className="d-flex align-items-center justify-content-center px-2 py-1"
                                                                        style={{ minWidth: '100px' }}
                                                                    >
                                                                        {bet.status === 'WON' ? (
                                                                            <><FaTrophy className="me-1" size={12} />WON ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : '0.00'}</>
                                                                        ) : bet.status === 'LOST' ? (
                                                                            <>LOST ${bet.winloss ? Math.abs(bet.winloss).toFixed(2) : (bet.amount ?? 0).toFixed(2)}</>
                                                                        ) : (
                                                                            bet.status
                                                                        )}
                                                                    </Badge>
                                                                </td>
                                                                <td>{bet.betDate ? new Date(bet.betDate).toLocaleString() : 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                                {totalPages > 1 && (
                                                    <Pagination className="justify-content-center mt-3">
                                                        <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                                                        <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                                        {[...Array(totalPages).keys()].map(number => {
                                                            // Mostrar un Number limitado de páginas para evitar saturación
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
                                    <div className="p-3 card-tab-body">
                                        <div className="d-flex justify-content-between mb-3">
                                            <h5 className="mb-0">My Rankings</h5>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                onClick={clearRankingCache} 
                                                disabled={isRefreshing}
                                            >
                                                {isRefreshing ? (
                                                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> Refreshing...</>
                                                ) : (
                                                    <>Clear Rankings Cache</>
                                                )}
                                            </Button>
                                        </div>
                                        {rankings.length > 0 ? (
                                            <>
                                                {/* Group rankings by game */}
                                                <h5 className="mb-3">Global Rankings</h5>
                                                <Table responsive hover variant='dark' className="mb-4">
                                                    <thead>
                                                        <tr>
                                                            <th>Ranking Type</th>
                                                            <th>Value</th>
                                                            <th>Position</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rankings
                                                            .filter(r => !r.game)
                                                            .sort((a, b) => a.position - b.position)
                                                            .map((ranking, index) => (
                                                                <tr key={index}>
                                                                    <td>{ranking.type?.replace(/_/g, ' ') || 'Unknown'}</td>
                                                                    <td>
                                                                        {ranking.type?.includes('PROFIT') || ranking.type?.includes('AMOUNT') || ranking.type?.includes('LOSERS')
                                                                            ? `$${parseFloat(ranking.score || 0).toFixed(2)}`
                                                                            : ranking.type?.includes('WIN_RATE')
                                                                            ? `${parseFloat(ranking.score || 0).toFixed(1)}%`
                                                                            : ranking.score}
                                                                    </td>
                                                                    <td>
                                                                        <Badge
                                                                            bg={
                                                                                ranking.position === 1 ? 'warning' :
                                                                                ranking.position <= 10  ? 'info' :
                                                                                'danger'
                                                                            }
                                                                        >
                                                                            #{ranking.position}
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </Table>

                                                {/* Group game-specific rankings by game */}
                                                {Array.from(new Set(rankings.filter(r => r.game).map(r => r.game?.id))).map(gameId => {
                                                    const gameRankings = rankings.filter(r => r.game?.id === gameId);
                                                    const gameName = gameRankings[0]?.game?.name || 'Unknown Game';
                                                    
                                                    return (
                                                        <div key={gameId} className="mb-4">
                                                            <h5 className="mb-3">{gameName} Rankings</h5>
                                                            <Table responsive hover variant='dark'>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Ranking Type</th>
                                                                        <th>Value</th>
                                                                        <th>Position</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {gameRankings
                                                                        .sort((a, b) => (a.position) - (b.position))
                                                                        .map((ranking, index) => (
                                                                            <tr key={index}>
                                                                                <td>{ranking.type?.replace(/_/g, ' ') || 'Unknown'}</td>
                                                                                <td>
                                                                                    {ranking.type?.includes('PROFIT') || ranking.type?.includes('AMOUNT')|| ranking.type?.includes('LOSERS') || ranking.type?.includes('LOSSES')
                                                                                        ? `$${parseFloat(ranking.score || 0).toFixed(2)}`
                                                                                        : ranking.type?.includes('WIN_RATE')
                                                                                        ? `${parseFloat(ranking.score || 0).toFixed(1)}%`
                                                                                        : ranking.score}
                                                                                </td>
                                                                                <td>
                                                                                    <Badge
                                                                                        bg={
                                                                                            ranking.position === 1 ? 'warning' :
                                                                                            ranking.position <= 10  ? 'info' :
                                                                                            'danger'
                                                                                        }
                                                                                    >
                                                                                        #{ranking.position}
                                                                                    </Badge>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <div className="text-center my-4">
                                                <FaTrophy size={40} className="mb-3 text-secondary" />
                                                <p>No ranking data available yet.</p>
                                                <p className="text-muted small">This might be due to insufficient game history or a temporary system issue.</p>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        console.log("Attempting to refresh rankings");
                                                        setIsRefreshing(true);
                                                        fetchProfileData(user?.id);
                                                    }}
                                                    className="mt-2"
                                                >
                                                    <FaSync className="me-1" /> Try Again
                                                </Button>
                                            </div>
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