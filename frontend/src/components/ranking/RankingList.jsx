import React, { useState, useEffect } from 'react';
import { Container, Table, Tabs, Tab, Alert, Spinner, Badge, Card, Row, Col, Image } from 'react-bootstrap';
import { FaTrophy, FaCoins, FaGamepad, FaPercentage, FaChartLine, FaMedal, FaCrown, FaDice, FaCircle, FaDollarSign } from 'react-icons/fa';
import rankingService from '../../services/rankingService';
import gameService from '../../services/gameService';
import logoCasino from '../images/logo-casino.png';
import silverLogo from '../images/silver-logo.png';
import bronzeLogo from '../images/bronze-logo.png';
import './RankingList.css';

const RankingList = () => {
  const [activeTab, setActiveTab] = useState('overall');
  const [rankingType, setRankingType] = useState('OVERALL_PROFIT');
  const [gameRankingType, setGameRankingType] = useState('BY_GAME_WINS');
  const [rankings, setRankings] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Game-specific rankings
  const [diceRankings, setDiceRankings] = useState([]);
  const [rouletteRankings, setRouletteRankings] = useState([]);
  const [diceLoading, setDiceLoading] = useState(true);
  const [rouletteLoading, setRouletteLoading] = useState(true);
  
  // IDs of specific games
  const [diceGameId, setDiceGameId] = useState(null);
  const [rouletteGameId, setRouletteGameId] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await gameService.getAllGames();
        setGames(gamesData || []);
        
        // Find dice and roulette game IDs
        const diceGame = gamesData?.find(game => game.nombre.toLowerCase().includes('dice'));
        const rouletteGame = gamesData?.find(game => game.nombre.toLowerCase().includes('roulette'));
        
        if (diceGame) {
          setDiceGameId(diceGame.id);
          fetchGameRankings(diceGame.id, gameRankingType, setDiceRankings, setDiceLoading);
        }
        
        if (rouletteGame) {
          setRouletteGameId(rouletteGame.id);
          fetchGameRankings(rouletteGame.id, gameRankingType, setRouletteRankings, setRouletteLoading);
        }
        
        if (gamesData && gamesData.length > 0) {
          setSelectedGameId(gamesData[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch games:', err);
        setGames([]);
      }
    };

    fetchGames();
  }, []);

  const fetchGameRankings = async (gameId, rankingType, setRankingsState, setLoadingState) => {
    if (!gameId) {
      console.error('Cannot fetch game rankings without a valid game ID');
      setRankingsState([]);
      setLoadingState(false);
      return;
    }
    
    setLoadingState(true);
    try {
      let gameRankings;
      
      // Default to BY_GAME_WINS if BY_GAME_PROFIT causes errors
      if (rankingType === 'BY_GAME_PROFIT') {
        try {
          gameRankings = await rankingService.getGameProfitRankings(gameId);
        } catch (err) {
          console.error('Error fetching BY_GAME_PROFIT, falling back to BY_GAME_WINS:', err);
          // If BY_GAME_PROFIT fails, fall back to BY_GAME_WINS
          gameRankings = await rankingService.getRankingsByGameAndType(gameId, 'BY_GAME_WINS');
        }
      } else if (rankingType === 'BY_GAME_WIN_RATE') {
        gameRankings = await rankingService.getGameWinRateRankings(gameId);
      } else {
        // Default to BY_GAME_WINS
        gameRankings = await rankingService.getRankingsByGameAndType(gameId, 'BY_GAME_WINS');
      }
      
      setRankingsState(gameRankings || []);
    } catch (err) {
      console.error(`Failed to fetch game rankings for ID ${gameId} and type ${rankingType}:`, err);
      setRankingsState([]);
    } finally {
      setLoadingState(false);
    }
  };

  // Effect to update dice and roulette rankings when game ranking type changes
  useEffect(() => {
    if (diceGameId) {
      fetchGameRankings(diceGameId, gameRankingType, setDiceRankings, setDiceLoading);
    }
    
    if (rouletteGameId) {
      fetchGameRankings(rouletteGameId, gameRankingType, setRouletteRankings, setRouletteLoading);
    }
  }, [gameRankingType, diceGameId, rouletteGameId]);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError('');
      
      try {
        let rankingsData;
        
        if (activeTab === 'by-game' && selectedGameId) {
          // Use a try/catch block specifically for potentially problematic rankings
          if (gameRankingType === 'BY_GAME_PROFIT') {
            try {
              rankingsData = await rankingService.getGameProfitRankings(selectedGameId);
            } catch (err) {
              console.error('Error with BY_GAME_PROFIT, falling back to BY_GAME_WINS:', err);
              // If BY_GAME_PROFIT fails, fall back to BY_GAME_WINS
              rankingsData = await rankingService.getRankingsByGameAndType(selectedGameId, 'BY_GAME_WINS');
              // If we fell back to WIN_RATE, update UI state
              setGameRankingType('BY_GAME_WINS');
            }
          } else if (gameRankingType === 'BY_GAME_WIN_RATE') {
            rankingsData = await rankingService.getGameWinRateRankings(selectedGameId);
          } else {
            rankingsData = await rankingService.getRankingsByGameAndType(selectedGameId, gameRankingType);
          }
        } else {
          rankingsData = await rankingService.getRankingsByType(rankingType);
        }
        
        setRankings(rankingsData || []);
      } catch (err) {
        setError('Failed to load rankings. Please try again later.');
        console.error(err);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [rankingType, gameRankingType, selectedGameId, activeTab]);

  const handleTabSelect = (key) => {
    setActiveTab(key);
    if (key === 'overall') {
      setRankingType('OVERALL_PROFIT');
    } else if (key === 'by-game') {
      // Don't change the gameRankingType here, just keep what user selected before
    }
  };

  const handleOverallRankingTypeSelect = (type) => {
    setRankingType(type);
  };
  
  const handleGameRankingTypeSelect = (type) => {
    setGameRankingType(type);
  };

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
  };

  const formatValue = (value, type) => {
    if (type === 'OVERALL_PROFIT' || type === 'BY_GAME_PROFIT' || type === 'TOTAL_BETS_AMOUNT') {
      return `$${parseFloat(value).toFixed(2)}`;
    } else if (type === 'WIN_RATE' || type === 'BY_GAME_WIN_RATE') {
      return `${parseFloat(value).toFixed(1)}%`;
    } else {
      return value;
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) {
      return (
        <div className="top-player-badge">
          
          <div className="rank-icon rank-first" 
          >
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
    if (index === 1) return <div className="rank-icon rank-first" 
    >
      <Image 
        src={silverLogo} 
        alt="Casino Logo Silver" 
        width={18} 
        height={18} 
        style={{ filter: 'drop-shadow(0 0 3px rgba(35, 36, 37, 0.5))', borderRadius: '4px'  }} 
      />
    </div>;
    if (index === 2) return <div className="rank-icon rank-first" 
    >
      <Image 
        src={bronzeLogo} 
        alt="Casino Logo Bronze" 
        width={18} 
        height={18} 
        style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.5))', borderRadius: '4px'  }} 
      />
    </div>;
    return <span className="rank-number">#{index + 1}</span>;
  };

  const getValueColor = (value, type) => {
    if (type === 'OVERALL_PROFIT' || type === 'BY_GAME_PROFIT') {
      return parseFloat(value) > 0 ? 'success' : parseFloat(value) < 0 ? 'danger' : 'secondary';
    }
    return 'primary';
  };

  const getColumnTitle = (rankingTypeToUse) => {
    if (rankingTypeToUse === 'OVERALL_PROFIT' || rankingTypeToUse === 'BY_GAME_PROFIT') {
      return 'Total Profit';
    } else if (rankingTypeToUse === 'TOTAL_BETS_AMOUNT') {
      return 'Total Bet Amount';
    } else if (rankingTypeToUse === 'WIN_RATE' || rankingTypeToUse === 'BY_GAME_WIN_RATE') {
      return 'Win Rate';
    } else {
      return 'Wins';
    }
  };

  const renderRankingTable = (rankingsData, rankingTypeToUse, isLoading = false) => {
    if (isLoading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" className="spinner-accent" />
          <p className="mt-2">Loading rankings...</p>
        </div>
      );
    }

    if (error && rankingTypeToUse === gameRankingType) {
      return <Alert variant="danger">{error}</Alert>;
    }

    // Check if rankings is an array before attempting to map
    if (!Array.isArray(rankingsData) || rankingsData.length === 0) {
      // Show a special message for BY_GAME_PROFIT if it's not working
      if (rankingTypeToUse === 'BY_GAME_PROFIT') {
        return (
          <Alert variant="warning">
            Game profit rankings are currently unavailable. The feature may still be in development.
            <div className="mt-2">
              <small>Please try using the Wins or Win Rate rankings instead.</small>
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
                {getColumnTitle(rankingTypeToUse)}
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
                  {ranking.usuario?.username || 'Unknown'}
                </td>
                <td className="text-center">
                  <Badge 
                    bg={getValueColor(ranking.valor, rankingTypeToUse)} 
                    className="value-badge"
                  >
                    {formatValue(ranking.valor, rankingTypeToUse)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const renderOverallRankings = () => {
    return (
      <div className="overall-rankings">
        <Tabs
          activeKey={rankingType}
          onSelect={handleOverallRankingTypeSelect}
          className="ranking-subtabs mb-4"
        >
          <Tab 
            eventKey="OVERALL_PROFIT" 
            title={<><FaCoins className="me-1" /> Profit</>}
          >
            <div className="ranking-subtab-content">
              <p className="tab-description">Players ranked by their total profit across all games.</p>
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>
          <Tab 
            eventKey="TOTAL_BETS_AMOUNT" 
            title={<><FaCoins className="me-1" /> Bets</>}
          >
            <div className="ranking-subtab-content">
              <p className="tab-description">Players ranked by their total amount bet across all games.</p>
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>
          <Tab 
            eventKey="WIN_RATE" 
            title={<><FaPercentage className="me-1" /> Win Rate</>}
          >
            <div className="ranking-subtab-content">
              <p className="tab-description">Players ranked by their win percentage across all games.</p>
              {renderRankingTable(rankings, rankingType, loading)}
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  };

  const renderGameRankingsTabs = () => {
    return (
      <Tabs
        activeKey={gameRankingType}
        onSelect={handleGameRankingTypeSelect}
        className="ranking-subtabs-sub"
      >
        <Tab 
          eventKey="BY_GAME_WINS"
          title={<><FaTrophy className="me-1" /> Wins</>}
        >

        </Tab>
        <Tab 
          eventKey="BY_GAME_WIN_RATE" 
          title={<><FaPercentage className="me-1" /> Win Rate</>}
        >

        </Tab>
        <Tab 
          eventKey="BY_GAME_PROFIT" 
          title={<><FaDollarSign className="me-1" /> Profit</>}
        >
        </Tab>
      </Tabs>
    );
  };

  const renderGameRankings = () => {
    return (
      <div className="game-specific-rankings">
        {renderGameRankingsTabs()}

        <div className="game-tabs mb-4">
          <div className="game-badges">
            {games.map(game => (
              <Badge 
                key={game.id}
                bg={selectedGameId === game.id ? 'primary' : 'secondary'}
                className={`game-badge ${selectedGameId === game.id ? 'active' : ''}`}
                onClick={() => handleGameSelect(game.id)}
              >
                {game.nombre.toLowerCase().includes('dice') ? <FaDice className="me-1" /> : 
                 game.nombre.toLowerCase().includes('roulette') ? <FaCircle className="me-1" /> : 
                 <FaGamepad className="me-1" />}
                {game.nombre}
              </Badge>
            ))}
          </div>
        </div>
        
        {renderRankingTable(rankings, gameRankingType, loading)}
      </div>
    );
  };

  return (
    <Container>
      <Card className="ranking-card">
        <Card.Header className="text-center ranking-header d-flex align-items-center justify-content-center">
          
          <FaTrophy className="me-2 trophy-icon" />
          <h2 className="mb-0">Player Rankings</h2>
          <FaTrophy className="me-2 trophy-icon" />
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
