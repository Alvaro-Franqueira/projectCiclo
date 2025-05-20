/**
 * UserProfile Component
 * A comprehensive user profile page that displays user information, betting history,
 * game statistics, and rankings in a casino platform.
 * 
 * Features:
 * - User profile information display
 * - Betting history with pagination
 * - Game-specific statistics (Dice, Roulette, Blackjack, Slot Machine)
 * - Balance evolution chart with timeframe filtering
 * - User rankings and achievements
 * - Real-time data refresh
 * - Error handling and loading states
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Alert, Tabs, Tab, Button, Spinner } from 'react-bootstrap';
import { FaCoins, FaGamepad, FaTrophy, FaSync, FaPercentage } from 'react-icons/fa';
import userService from '../services/userService';
import betService from '../services/betService';
import rankingService from '../services/rankingService';
import { useAuth } from '../context/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import BalanceChart from '../components/profile/BalanceChart';
import GameStats from '../components/profile/GameStats';
import BetHistory from '../components/profile/BetHistory';
import RankingsList from '../components/profile/RankingsList';
import '../assets/styles/UserProfile.css'; // Import the new CSS file for spinner styles
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

// Register Chart.js components for balance evolution visualization
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
    // Hooks
    const { user } = useAuth();

    // State Management
    // Core user data states
    const [profileData, setProfileData] = useState({}); // User profile information
    const [bets, setBets] = useState([]); // User's betting history
    const [rankings, setRankings] = useState([]); // User's rankings in different categories
    const [loading, setLoading] = useState(true); // Loading state for initial data fetch
    const [isRefreshing, setIsRefreshing] = useState(false); // Loading state for data refresh
    const [error, setError] = useState(''); // Error message state

    // Game statistics state
    // Tracks statistics for each game type (total bets, win rate, total wins, total profit)
    const [gameStats, setGameStats] = useState({
        dice: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
        roulette: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
        blackjack: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
        slotMachine: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 }
    });
    
    // Balance history and chart states
    const [balanceHistory, setBalanceHistory] = useState([]); // Balance evolution data points
    const [chartTimeframe, setChartTimeframe] = useState('all'); // Selected timeframe for balance chart
    const [currentPage, setCurrentPage] = useState(1); // Current page for bet history pagination
    const [betsPerPage] = useState(10); // Number of bets to display per page

    // Data Processing Functions
    /**
     * Calculates the user's balance history based on their bets and current balance
     * @returns {Array} Array of balance history points with date and balance values
     */
    const calculateBalanceHistory = useCallback(() => {
        if (!Array.isArray(bets) || bets.length === 0 || !profileData.balance) {
            return [];
        }
        
        // Sort bets by date to calculate balance evolution
        const sortedBets = [...bets].sort((a, b) => new Date(a.betDate) - new Date(b.betDate));
        const currentBalance = profileData.balance;
        const totalProfitLoss = sortedBets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
        const estimatedInitialBalance = Math.max(currentBalance - totalProfitLoss, 0);
        
        // Calculate running balance for each bet
        let runningBalance = estimatedInitialBalance;
        const history = [{
            date: new Date(sortedBets[0].betDate).toISOString().split('T')[0],
            balance: runningBalance
        }];
        
        // Add balance points for each bet that affected the balance
        sortedBets.forEach(bet => {
            runningBalance += (bet.winloss || 0);
            if (bet.winloss !== 0) {
                history.push({
                    date: new Date(bet.betDate).toISOString().split('T')[0],
                    balance: Math.max(runningBalance, 0)
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
        
        return filteredHistory.length > 0 ? filteredHistory : history;
    }, [bets, profileData.balance, chartTimeframe]);

    // Data Fetching Functions
    /**
     * Fetches all user profile data including bets, rankings, and game statistics
     * @param {string} userId - The ID of the user to fetch data for
     */
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
            // Fetch user details and betting history in parallel
            const [fetchedUserDetails, userBets] = await Promise.all([
                userService.getUserById(userId),
                betService.getUserBets(userId)
            ]);
            
            // Process and validate user details
            if (fetchedUserDetails) {
                const balance = fetchedUserDetails.balance !== undefined
                    ? Number(fetchedUserDetails.balance)
                    : 0;
                setProfileData({ ...fetchedUserDetails, balance: isNaN(balance) ? 0 : balance });
            } else {
                setProfileData({});
            }
            
            // Sort bets by date (newest first)
            setBets(Array.isArray(userBets) ? userBets.sort((a, b) => new Date(b.betDate) - new Date(a.betDate)) : []);
            
        } catch (err) {
            console.error("Error fetching essential profile data:", err);
            setError('Failed to load essential profile data. Please try again later.');
            hasProfileError = true;
        }
        
        // Fetch additional data if core profile data was successful
        if (!hasProfileError) {
            try {
                const userRankings = await rankingService.getUserRankings(userId);
                setRankings(Array.isArray(userRankings) ? userRankings : []);
            } catch (rankingErr) {
                console.error("Error fetching rankings:", rankingErr);
                setRankings([]);
            }
            
            try {
                await fetchGameSpecificStats(userId);
            } catch (statsErr) {
                console.error("Error fetching game stats:", statsErr);
            }
        }
        
        indicateLoading(false);
        setIsRefreshing(false);
    }, [isRefreshing]);

    /**
     * Fetches and calculates statistics for each game type
     * @param {string} userId - The ID of the user to fetch stats for
     */
    const fetchGameSpecificStats = async (userId) => {
        if (!userId) return;
        try {
            // Fetch bets for each game type in parallel
            const [diceBets, rouletteBets, blackjackBets, slotBets7, slotBets10] = await Promise.all([
                betService.getUserGameBets(userId, 2),
                betService.getUserGameBets(userId, 1),
                betService.getUserGameBets(userId, 9),
                betService.getUserGameBets(userId, 7),
                betService.getUserGameBets(userId, 10)
            ]);

            // Helper function to calculate statistics for a game type
            const calculateGameStats = (bets) => {
                if (!Array.isArray(bets)) return { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 };
                const totalBets = bets.length;
                const winningBets = bets.filter(bet => bet.status === 'WON').length;
                const profitLoss = bets.reduce((sum, bet) => sum + (bet.winloss || 0), 0);
                const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;
                return { totalBets, winRate, totalWins: winningBets, totalProfit: profitLoss };
            };

            // Combine slot machine bets from different game IDs
            const slotBets = [
                ...(Array.isArray(slotBets7) ? slotBets7 : []),
                ...(Array.isArray(slotBets10) ? slotBets10 : [])
            ];
            
            // Update game statistics state
            setGameStats({ 
                dice: calculateGameStats(diceBets),
                roulette: calculateGameStats(rouletteBets),
                blackjack: calculateGameStats(blackjackBets),
                slotMachine: calculateGameStats(slotBets)
            });
        } catch (error) {
            console.error('Error fetching game-specific stats:', error);
            setError(prev => prev ? prev + '\nFailed to load game stats.' : 'Failed to load game stats.');
        }
    };

    // Effects
    // Initial data fetch and cleanup
    useEffect(() => {
        const currentUserId = user?.id;
        if (currentUserId) {
            fetchProfileData(currentUserId);
        } else {
            // Reset all states when user is not available
            setLoading(false);
            setIsRefreshing(false);
            setBets([]);
            setRankings([]);
            setGameStats({
                dice: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
                roulette: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
                blackjack: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 },
                slotMachine: { totalBets: 0, winRate: 0, totalWins: 0, totalProfit: 0 }
            });
            setProfileData({});
            setBalanceHistory([]);
            setError('');
        }
    }, [user?.id, fetchProfileData]);
    
    // Update balance history when bets or timeframe changes
    useEffect(() => {
        if (bets.length > 0 && profileData.balance) {
            const history = calculateBalanceHistory();
            setBalanceHistory(history);
        }
    }, [bets, profileData.balance, chartTimeframe, calculateBalanceHistory]);

    // Event Handlers
    /**
     * Handles the refresh button click
     * Resets pagination and fetches fresh data
     */
    const handleRefresh = () => {
        if (user?.id && !isRefreshing) {
            setIsRefreshing(true);
            setCurrentPage(1);
            fetchProfileData(user.id);
        }
    };
    
    /**
     * Handles clearing the rankings cache
     * Refreshes rankings data after cache is cleared
     */
    const clearRankingCache = () => {
        try {
            rankingService.clearCache();
            if (user?.id) {
                setIsRefreshing(true);
                fetchProfileData(user.id);
            }
        } catch (error) {
            console.error('Error clearing ranking cache:', error);
            setError('Failed to clear ranking cache. Please try again.');
        }
    };
    
    // Loading State
    if (loading) {
        return (
            <Container className="text-center mt-5 game-selection-loading">
                <div className="spinner-container">
                    <Spinner animation="border" className="gold-spinner" />
                    <div className="spinner-light spinner-light-1"></div>
                    <div className="spinner-light spinner-light-2"></div>
                    <div className="spinner-light spinner-light-3"></div>
                    <div className="spinner-light spinner-light-4"></div>
                </div>
                <p className="mt-3 loading-text">Loading profile...</p>
            </Container>
        );
    }

    // Calculate number one rankings for achievements display
    const numberOneRankings = Array.isArray(rankings) ? rankings.filter(r => r.position === 1) : [];

    // Main Render
    return (
        <Container>
            <h2 className="text-center mb-4">My Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row>
                {/* Profile Header - User info and achievements */}
                <Col lg={4} className="mb-4 card-profile">
                    <ProfileHeader 
                        profileData={profileData}
                        numberOneRankings={numberOneRankings}
                    />
                </Col>

                {/* Main Content Area - Stats/History/Rankings Tabs */}
                <Col lg={8}>
                    <Card className='no-shadow'>
                    <Card.Header style={{ margin: 10, marginLeft:20, padding: 0, display: 'inline-block' }}>
                            <Tabs defaultActiveKey="stats" id="profile-tabs" className="card-header-tabs justify-content-around">
                                {/* Statistics Tab - Balance chart and game stats */}
                                <Tab eventKey="stats" title={<><FaCoins className="me-1" /> Statistics</>}>
                                    <div className="p-3 card-tab-body">
                                        <BalanceChart 
                                            balanceHistory={balanceHistory}
                                            chartTimeframe={chartTimeframe}
                                            onTimeframeChange={setChartTimeframe}
                                        />
                                        <GameStats gameStats={gameStats} />
                                    </div>
                                </Tab>

                                {/* Bet History Tab - Paginated bet history table */}
                                <Tab eventKey="bets" title={<><FaGamepad className="me-1" /> Bet History</>}>
                                    <BetHistory 
                                        bets={bets}
                                        currentPage={currentPage}
                                        betsPerPage={betsPerPage}
                                        onPageChange={setCurrentPage}
                                    />
                                </Tab>

                                {/* Rankings Tab - User rankings and achievements */}
                                <Tab eventKey="myRankings" title={<><FaTrophy className="me-1" /> My Rankings</>}>
                                    <RankingsList 
                                        rankings={rankings}
                                        isRefreshing={isRefreshing}
                                        onClearCache={clearRankingCache}
                                    />
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