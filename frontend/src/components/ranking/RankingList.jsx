/**
 * RankingList Component
 * A comprehensive ranking system for the casino platform that displays player statistics and achievements.
 * 
 * Features:
 * - Overall rankings (profit, bet amount, win rate, losses)
 * - Game-specific rankings (Dice, Roulette, Blackjack, Slot Machine)
 * - Real-time data updates with cache management
 * - Responsive UI with loading states
 * - Visual indicators for top performers
 * - Multiple ranking metrics per game
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Table, Tabs, Tab, Alert, Spinner, Badge, Card, Row, Col, Image } from 'react-bootstrap';
import { FaTrophy, FaCircle, FaCoins, FaGamepad, FaPercentage, FaChartLine, FaMedal, FaCrown, FaDice, FaDollarSign, FaArrowDown, FaSkull, FaThumbsDown } from 'react-icons/fa';
import { Icon } from '@mdi/react';
import { mdiEmoticonPoop } from '@mdi/js';
import rankingService from '../../services/rankingService';
import gameService from '../../services/gameService';
import logoCasino from '../images/logo-casino.png';
import silverLogo from '../images/silver-logo.png';
import bronzeLogo from '../images/bronze-logo.png';
import '../../assets/styles/RankingList.css';

// ===== Constants =====

/**
 * Ranking types enum for consistent usage across the component
 */
const { RANKING_TYPES } = rankingService;

/**
 * Icon for losers ranking tab
 */
const iconLosers = <Icon path={mdiEmoticonPoop} size={0.8} />;

// ===== Memoized Components =====

/**
 * RankingTable Component
 * A memoized table component for displaying ranking data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.rankingsData - Array of ranking data
 * @param {string} props.rankingType - Type of ranking being displayed
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.error - Error message if any
 * @param {Function} props.getRankIcon - Function to get rank icon
 * @param {Function} props.getValueColor - Function to get value color
 * @param {Function} props.formatValue - Function to format value
 * @param {Function} props.getColumnTitle - Function to get column title
 */
const RankingTable = React.memo(({ 
  rankingsData, 
  rankingType,
  isLoading, 
  error, 
  getRankIcon, 
  getValueColor, 
  formatValue, 
  getColumnTitle 
}) => {
  if (isLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" className="spinner-accent" />
        <p className="mt-2">Loading rankings...</p>
      </div>
    );
  }

  if (error && rankingType) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // Check if rankings is an array before attempting to map
  if (!Array.isArray(rankingsData) || rankingsData.length === 0) {
    // Show a special message for BY_GAME_PROFIT if it's not working
    if (rankingType === 'BY_GAME_PROFIT') {
      return (
        <Alert variant="warning">
          Game profit rankings are currently unavailable. The feature may still be in development.
          <div className="mt-2">
            <small>Please try using the Bet Amount or Win Rate rankings instead.</small>
          </div>
        </Alert>
      );
    }
    return <Alert variant="info">No rankings available yet.</Alert>;
  }

  return (
    <div className="ranking-table-container">
      <Table striped hover responsive className="ranking-table">
        <thead>
          <tr>
            <th width="10%" className="text-center">Rank</th>
            <th>Player</th>
            <th width="20%" className="text-center">
              {getColumnTitle(rankingType)}
            </th>
          </tr>
        </thead>
        <tbody>
          {rankingsData.map((ranking, index) => (
            <tr key={index} className={index < 3 ? `top-ranking rank-${index + 1}` : ''}>
              <td className="text-center rank-column">
                {getRankIcon(index)}
              </td>
              <td className="player-name">
                {ranking.user?.username || 'Unknown'}
              </td>
              <td className="text-center">
                <Badge 
                  pill 
                  bg={getValueColor(ranking.score, rankingType)}
                  className="ranking-badge"
                >
                  {formatValue(ranking.score, rankingType)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
});

// Prevent re-rendering when props haven't changed
RankingTable.displayName = 'RankingTable';

// ===== Main Component =====

/**
 * RankingList Component
 * Main component for displaying player rankings and statistics
 */
const RankingList = () => {
  // ===== State Management =====
  
  // Tab and ranking type states
  const [activeTab, setActiveTab] = useState('overall');
  const [rankingType, setRankingType] = useState(RANKING_TYPES.OVERALL_PROFIT);
  const [gameRankingType, setGameRankingType] = useState(RANKING_TYPES.BY_GAME_AMOUNT);
  
  // Overall rankings state
  const [rankings, setRankings] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Game-specific rankings states
  const [diceRankings, setDiceRankings] = useState([]);
  const [rouletteRankings, setRouletteRankings] = useState([]);
  const [blackjackRankings, setBlackjackRankings] = useState([]);
  const [slotRankings, setSlotRankings] = useState([]);
  const [diceLoading, setDiceLoading] = useState(true);
  const [rouletteLoading, setRouletteLoading] = useState(true);
  const [blackjackLoading, setBlackjackLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(true);
  
  // Game IDs state
  const [diceGameId, setDiceGameId] = useState(null);
  const [rouletteGameId, setRouletteGameId] = useState(null);
  const [blackjackGameId, setBlackjackGameId] = useState(null);
  const [slotGameId, setSlotGameId] = useState(null);

  // ===== Utility Functions =====

  /**
   * Formats a value based on the ranking type
   * @param {number|string} value - The value to format
   * @param {string} type - The ranking type
   * @returns {string} Formatted value
   */
  const formatValue = useCallback((value, type) => {
    if (value === undefined || value === null) return '0';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if we have a valid number
    if (isNaN(numValue)) return '0';
    
    if (type === 'OVERALL_PROFIT' || type === 'BY_GAME_PROFIT' || type === 'TOP_LOSERS' || type === 'BY_GAME_LOSSES') {
      return `$${numValue.toFixed(2)}`;
    } else if (type === 'TOTAL_BETS_AMOUNT' || type === 'BY_GAME_AMOUNT') {
      return `$${numValue.toFixed(2)}`;
    } else if (type === 'WIN_RATE' || type === 'BY_GAME_WIN_RATE') {
      return `${numValue.toFixed(1)}%`;
    } else {
      return numValue.toString();
    }
  }, []);

  /**
   * Gets the color for a value based on the ranking type
   * @param {number|string} value - The value to get color for
   * @param {string} type - The ranking type
   * @returns {string} Color class name
   */
  const getValueColor = useCallback((value, type) => {
    if (value === undefined || value === null) return 'secondary';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if we have a valid number
    if (isNaN(numValue)) return 'secondary';
    
    if (type === 'OVERALL_PROFIT' || type === 'BY_GAME_PROFIT') {
      return numValue > 0 ? 'success' : numValue < 0 ? 'danger' : 'secondary';
    } else if (type === 'TOP_LOSERS' || type === 'BY_GAME_LOSSES') {
      // For losses, higher values are worse, so use 'danger' for higher values
      return numValue > 0 ? 'danger' : 'secondary';
    }
    return 'primary';
  }, []);

  /**
   * Gets the rank icon for a position
   * @param {number} index - The position in ranking
   * @returns {JSX.Element} Rank icon
   */
  const getRankIcon = useCallback((index) => {
    if (index === 0) {
      return (
        <div className="top-player-badge">
          <div className="rank-icon rank-first">
            <Image 
              src={logoCasino} 
              alt="Casino Logo Gold" 
              width={20} 
              height={20} 
              style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))' }} 
            />
          </div>
        </div>
      );
    }
    if (index === 1) return <div className="rank-icon rank-first">
      <Image 
        src={silverLogo} 
        alt="Casino Logo Silver" 
        width={18} 
        height={18} 
        style={{ filter: 'drop-shadow(0 0 3px rgba(35, 36, 37, 0.5))', borderRadius: '4px'  }} 
      />
    </div>;
    if (index === 2) return <div className="rank-icon rank-first">
      <Image 
        src={bronzeLogo} 
        alt="Casino Logo Bronze" 
        width={18} 
        height={18} 
        style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))', borderRadius: '4px'  }} 
      />
    </div>;
    return <span className="rank-number">#{index + 1}</span>;
  }, []);

  /**
   * Gets the column title based on ranking type
   * @param {string} rankingTypeToUse - The ranking type
   * @returns {string} Column title
   */
  const getColumnTitle = useCallback((rankingTypeToUse) => {
    if (rankingTypeToUse === 'OVERALL_PROFIT' || rankingTypeToUse === 'BY_GAME_PROFIT') {
      return 'Total Profit';
    } else if (rankingTypeToUse === 'TOTAL_BETS_AMOUNT') {
      return 'Total Bet Amount';
    } else if (rankingTypeToUse === 'WIN_RATE' || rankingTypeToUse === 'BY_GAME_WIN_RATE') {
      return 'Win Rate';
    } else if (rankingTypeToUse === 'TOP_LOSERS') {
      return 'Total Losses';
    } else if (rankingTypeToUse === 'BY_GAME_LOSSES') {
      return 'Total Losses';
    } else if (rankingTypeToUse === RANKING_TYPES.BY_GAME_AMOUNT) {
      return 'Total Bet Amount';
    } else {
      return 'Wins';
    }
  }, []);

  // ===== Data Fetching =====

  /**
   * Fetches game-specific rankings
   * @param {number} gameId - The game ID
   * @param {string} rankingType - The ranking type
   * @param {Function} setRankingsState - State setter for rankings
   * @param {Function} setLoadingState - State setter for loading
   */
  const fetchGameRankings = useCallback(async (gameId, rankingType, setRankingsState, setLoadingState) => {
    if (!gameId) {
      setRankingsState([]);
      setLoadingState(false);
      return;
    }
    
    setLoadingState(true);
    try {
      let gameRankings;
      
      if (rankingType === RANKING_TYPES.BY_GAME_PROFIT) {
        try {
          gameRankings = await rankingService.getGameProfitRankings(gameId);
        } catch (err) {
          gameRankings = await rankingService.getRankingsByGameAndType(gameId, RANKING_TYPES.BY_GAME_AMOUNT);
        }
      } else if (rankingType === RANKING_TYPES.BY_GAME_WIN_RATE) {
        gameRankings = await rankingService.getGameWinRateRankings(gameId);
      } else if (rankingType === RANKING_TYPES.BY_GAME_LOSSES) {
        gameRankings = await rankingService.getGameMostLossesRankings(gameId);
      } else {
        // Default to BY_GAME_AMOUNT
        gameRankings = await rankingService.getRankingsByGameAndType(gameId, RANKING_TYPES.BY_GAME_AMOUNT);
      }
      
      setRankingsState(gameRankings || []);
    } catch (err) {
      setRankingsState([]);
    } finally {
      setLoadingState(false);
    }
  }, []);

  // ===== Effects =====

  /**
   * Effect to fetch games and set up game IDs
   */
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await gameService.getAllGames();
        setGames(gamesData || []);
        
        // Find game IDs for popular games
        const diceGame = gamesData?.find(game => game.name?.toLowerCase().includes('dice'));
        const rouletteGame = gamesData?.find(game => game.name?.toLowerCase().includes('roulette'));
        const blackjackGame = gamesData?.find(game => game.name?.toLowerCase().includes('blackjack'));
        
        // Enhanced slot machine detection to handle both IDs
        const slotGame = gamesData?.find(game => 
          game.name?.toLowerCase().includes('slot') || 
          game.name?.toLowerCase().includes('machine') ||
          game.id === 7 
        );
        
        // Update state with game IDs, selected game ID, and trigger initial data load
        const gameIdsUpdate = {};
        if (diceGame) gameIdsUpdate.diceGameId = diceGame.id;
        if (rouletteGame) gameIdsUpdate.rouletteGameId = rouletteGame.id;
        if (blackjackGame) gameIdsUpdate.blackjackGameId = blackjackGame.id;
        if (slotGame) gameIdsUpdate.slotGameId = slotGame.id;
        
        // Set default selected game ID to the first available specific game or the first game
        const defaultGameId = diceGame?.id || rouletteGame?.id || blackjackGame?.id || 
                             slotGame?.id || (gamesData.length > 0 ? gamesData[0].id : null);
        
        // Batch state updates to avoid multiple re-renders
        if (diceGame) setDiceGameId(diceGame.id);
        if (rouletteGame) setRouletteGameId(rouletteGame.id);
        if (blackjackGame) setBlackjackGameId(blackjackGame.id);
        if (slotGame) setSlotGameId(slotGame.id);
        if (defaultGameId) setSelectedGameId(defaultGameId);
      } catch (err) {
        console.error('Failed to fetch games:', err);
        setGames([]);
      }
    };

    fetchGames();
  }, []); // Only run once on component mount

  /**
   * Effect to fetch all ranking data
   */
  useEffect(() => {
    // Use a ref to track if the component is still mounted
    let isMounted = true;
    
    const fetchAllRankingData = async () => {
      // Prevent unnecessary loading if games aren't loaded yet
      if (games.length === 0) return;
      
      // Use a flag to track if we need to load overall rankings
      const loadOverallRankings = activeTab === 'overall';
      
      // Use a flag to track if we need to load game-specific rankings for the main table
      const loadSelectedGameRankings = activeTab === 'by-game' && selectedGameId;
      
      // Create an array to collect all fetch promises
      const fetchPromises = [];
      
      // Add specific game tab fetches that need to be loaded
      if (activeTab === 'by-game') {
        // Only fetch game data for the active submenus to reduce API calls
        if (diceGameId) {
          setDiceLoading(true);
          fetchPromises.push(
            fetchGameRankings(diceGameId, gameRankingType, setDiceRankings, setDiceLoading)
          );
        }
        
        if (rouletteGameId) {
          setRouletteLoading(true);
          fetchPromises.push(
            fetchGameRankings(rouletteGameId, gameRankingType, setRouletteRankings, setRouletteLoading)
          );
        }

        if (blackjackGameId) {
          setBlackjackLoading(true);
          fetchPromises.push(
            fetchGameRankings(blackjackGameId, gameRankingType, setBlackjackRankings, setBlackjackLoading)
          );
        }

        if (slotGameId) {
          setSlotLoading(true);
          fetchPromises.push(
            fetchGameRankings(slotGameId, gameRankingType, setSlotRankings, setSlotLoading)
          );
        }
      }
      
      // Add overall rankings loading if needed (only when on overall tab)
      if (loadOverallRankings) {
        setLoading(true);
        try {
          let rankingsData;
          if (rankingType === 'TOP_LOSERS') {
            rankingsData = await rankingService.getBiggestLosersRankings();
          } else {
            rankingsData = await rankingService.getRankingsByType(rankingType);
          }
          
          // Check if component is still mounted before updating state
          if (isMounted) {
            setRankings(rankingsData || []);
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError('Failed to load rankings. Please try again later.');
            setRankings([]);
            setLoading(false);
          }
        }
      }
      
      // Add selected game rankings loading if needed (only when on by-game tab)
      if (loadSelectedGameRankings) {
        setLoading(true);
        try {
          let rankingsData;
          
          if (gameRankingType === RANKING_TYPES.BY_GAME_PROFIT) {
            try {
              rankingsData = await rankingService.getGameProfitRankings(selectedGameId);
            } catch (err) {
              rankingsData = await rankingService.getRankingsByGameAndType(selectedGameId, RANKING_TYPES.BY_GAME_AMOUNT);
            }
          } else if (gameRankingType === RANKING_TYPES.BY_GAME_WIN_RATE) {
            rankingsData = await rankingService.getGameWinRateRankings(selectedGameId);
          } else if (gameRankingType === RANKING_TYPES.BY_GAME_LOSSES) {
            rankingsData = await rankingService.getGameMostLossesRankings(selectedGameId);
          } else {
            rankingsData = await rankingService.getRankingsByGameAndType(selectedGameId, gameRankingType);
          }
          
          // Check if component is still mounted before updating state
          if (isMounted) {
            setRankings(rankingsData || []);
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError('Failed to load rankings. Please try again later.');
            setRankings([]);
            setLoading(false);
          }
        }
      }
      
      // Wait for all game tab requests to complete
      await Promise.all(fetchPromises);
    };

    fetchAllRankingData();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [
    games, // Depends on games being loaded
    activeTab, rankingType, // Needed to decide what to fetch for overall tab
    gameRankingType, selectedGameId, // Needed to decide what to fetch for game tab
    diceGameId, rouletteGameId, blackjackGameId, slotGameId, // Needed for game tabs
    fetchGameRankings // Include the memoized function in dependencies
  ]);

  // ===== Event Handlers =====

  /**
   * Handles tab selection
   * @param {string} key - The selected tab key
   */
  const handleTabSelect = useCallback((key) => {
    setActiveTab(key);
  }, []);
  
  /**
   * Clears ranking cache and reloads data
   */
  const clearRankingCache = () => {
    try {
      setIsRefreshing(true);
      setError('');
      
      // Clear all ranking cache
      rankingService.clearCache();
      console.log('Ranking cache cleared successfully');
      
      // Show a brief message before reloading
      setTimeout(() => {
        // Reload the entire page to get fresh data
        window.location.reload();
      }, 500); // Short delay to show the loading state
    } catch (error) {
      console.error('Error clearing ranking cache:', error);
      setError('Failed to clear ranking cache. Please try again.');
      setIsRefreshing(false);
    }
  };

  /**
   * Handles overall ranking type selection
   * @param {string} type - The selected ranking type
   */
  const handleOverallRankingTypeSelect = useCallback((type) => {
    setRankingType(type);
  }, []);
  
  /**
   * Handles game ranking type selection
   * @param {string} type - The selected ranking type
   */
  const handleGameRankingTypeSelect = useCallback((type) => {
    setGameRankingType(type);
  }, []);

  /**
   * Handles game selection
   * @param {number} gameId - The selected game ID
   */
  const handleGameSelect = useCallback((gameId) => {
    setSelectedGameId(gameId);
  }, []);

  // ===== Render Functions =====

  /**
   * Renders the ranking table
   * @param {Array} rankingsData - The rankings data
   * @param {string} rankingTypeToUse - The ranking type
   * @param {boolean} isLoading - Loading state
   * @returns {JSX.Element} Ranking table
   */
  const renderRankingTable = (rankingsData, rankingTypeToUse, isLoading = false) => {
    return (
      <RankingTable
        rankingsData={rankingsData}
        rankingType={rankingTypeToUse}
        isLoading={isLoading}
        error={error}
        getRankIcon={getRankIcon}
        getValueColor={getValueColor}
        formatValue={formatValue}
        getColumnTitle={getColumnTitle}
      />
    );
  };

  /**
   * Renders overall rankings section
   * @returns {JSX.Element} Overall rankings section
   */
  const renderOverallRankings = () => {
    return (
      <div className="overall-rankings">
        <Tabs
          activeKey={rankingType}
          onSelect={handleOverallRankingTypeSelect}
          className="ranking-subtabs mb-4"
        >          
          <Tab 
            eventKey="TOTAL_BETS_AMOUNT" 
            title={<><FaCoins className="me-1" /> Bet Amount</>}
          >
            <div className="ranking-subtab-content">
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>
          <Tab 
            eventKey="OVERALL_PROFIT" 
            title={<><FaCoins className="me-1" /> Profit</>}
          >
            <div className="ranking-subtab-content">
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>
          <Tab 
            eventKey="WIN_RATE" 
            title={<><FaPercentage className="me-1" /> Win Rate</>}
          >
            <div className="ranking-subtab-content">
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>

          <Tab 
            eventKey="TOP_LOSERS" 
            title={<><Icon path={mdiEmoticonPoop} size={0.8} className="me-1" />Losers</>}
          >
            <div className="ranking-subtab-content losers-tab">
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>

          
        </Tabs>
      </div>
    );
  };

  /**
   * Renders game rankings tabs
   * @returns {JSX.Element} Game rankings tabs
   */
  const renderGameRankingsTabs = () => {
    return (
      <Tabs
        activeKey={gameRankingType}
        onSelect={handleGameRankingTypeSelect}
        className="ranking-subtabs-sub"
      >
        <Tab 
          eventKey={RANKING_TYPES.BY_GAME_AMOUNT}
          title={<><FaCoins className="me-1" /> Bet Amount</>}
        />

        <Tab 
          eventKey={RANKING_TYPES.BY_GAME_PROFIT}
          title={<><FaDollarSign className="me-1" /> Profit</>}
        />
        <Tab 
          eventKey={RANKING_TYPES.BY_GAME_WIN_RATE}
          title={<><FaPercentage className="me-1" /> Win Rate</>}
        />
        <Tab 
          eventKey={RANKING_TYPES.BY_GAME_LOSSES}
          title={<><Icon path={mdiEmoticonPoop} size={0.8} className="me-1" /> Losses</>}
        />

      </Tabs>
    );
  };

  /**
   * Renders game rankings section
   * @returns {JSX.Element} Game rankings section
   */
  const renderGameRankings = () => {
    return (
      <div className="game-specific-rankings">
        {renderGameRankingsTabs()}
        
        {/* Game Ranking Type Description */}
        <div className="ranking-subtab-content mt-3 mb-4">
          {gameRankingType === RANKING_TYPES.BY_GAME_AMOUNT}
          {gameRankingType === RANKING_TYPES.BY_GAME_LOSSES}
          {gameRankingType === RANKING_TYPES.BY_GAME_WIN_RATE}
          {gameRankingType === RANKING_TYPES.BY_GAME_PROFIT}
        </div>
        
        <div className="mt-4">
          <Tabs
            defaultActiveKey={diceGameId ? 'dice' : rouletteGameId ? 'roulette' : blackjackGameId ? 'blackjack' : slotGameId ? 'slot' : 'other'}
            className="mb-4 game-tabs"
          >
            {/* Dice Game Tab */}
            {diceGameId && (
              <Tab 
                eventKey="dice" 
                title={<><FaDice className="me-2" />Dice</>}
              >
                <div className="ranking-subtab-content">
                 
                  {renderRankingTable(diceRankings, gameRankingType, diceLoading)}
                </div>
              </Tab>
            )}

            {/* Roulette Tab */}
            {rouletteGameId && (
              <Tab 
                eventKey="roulette" 
                title={<><FaCircle className="me-2" />Roulette</>}
              >
                <div className="ranking-subtab-content">
                 
                  {renderRankingTable(rouletteRankings, gameRankingType, rouletteLoading)}
                </div>
              </Tab>
            )}

            {/* Blackjack Tab */}
            {blackjackGameId && (
              <Tab 
                eventKey="blackjack" 
                title={<><FaGamepad className="me-2" />Blackjack</>}
              >
                <div className="ranking-subtab-content">
                 
                  {renderRankingTable(blackjackRankings, gameRankingType, blackjackLoading)}
                </div>
              </Tab>
            )}

            {/* Slot Machine Tab */}
            {slotGameId && (
              <Tab 
                eventKey="slot" 
                title={<><FaGamepad className="me-2" />Slot Machine</>}
              >
                <div className="ranking-subtab-content">
                 
                  {renderRankingTable(slotRankings, gameRankingType, slotLoading)}
                </div>
              </Tab>
            )}


          </Tabs>
        </div>
      </div>
    );
  };

  // ===== Main Render =====
  return (
    <Container>
      <Card className="ranking-card">
        <Card.Header className="ranking-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <FaTrophy className="me-2 trophy-icon" />
            <h2 className="mb-0">Player Rankings</h2>
            <FaTrophy className="ms-2 trophy-icon" />
          </div>
          <div>
            <button 
              className="btn btn-outline-danger btn-sm" 
              onClick={clearRankingCache}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Refreshing...
                </>
              ) : (
                'Clear Rankings Cache'
              )}
            </button>
          </div>
        </Card.Header>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabSelect}
            className="mb-4 ranking-tabs"
          >
            <Tab 
              eventKey="overall" 
              title={<><FaChartLine className="me-1" /> Overall Rankings</>}
            >
              {renderOverallRankings()}
            </Tab>
            <Tab 
              eventKey="by-game" 
              title={<><FaGamepad className="me-1" /> Game Rankings</>}
            >
              {renderGameRankings()}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RankingList;
