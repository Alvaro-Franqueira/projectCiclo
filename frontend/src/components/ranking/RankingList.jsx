import React, { useState, useEffect } from 'react';
import { Container, Table, Tabs, Tab, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaTrophy, FaCoins, FaGamepad, FaPercentage, FaChartLine } from 'react-icons/fa';
import rankingService from '../../services/rankingService';
import gameService from '../../services/gameService';

const RankingList = () => {
  const [rankingType, setRankingType] = useState('OVERALL_PROFIT');
  const [rankings, setRankings] = useState([]); // Initialize as empty array
  const [games, setGames] = useState([]); // Initialize as empty array
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await gameService.getAllGames();
        setGames(gamesData || []); // Ensure it's always an array
        if (gamesData && gamesData.length > 0) {
          setSelectedGameId(gamesData[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch games:', err);
        setGames([]); // Ensure games is still an empty array on error
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError('');
      
      try {
        let rankingsData;
        
        if (rankingType === 'BY_GAME_WINS' && selectedGameId) {
          rankingsData = await rankingService.getRankingsByGame(selectedGameId);
        } else {
          rankingsData = await rankingService.getRankingsByType(rankingType);
        }
        
        setRankings(rankingsData || []); // Ensure rankingsData is always an array
      } catch (err) {
        setError('Failed to load rankings. Please try again later.');
        console.error(err);
        setRankings([]); // Ensure rankings is still an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [rankingType, selectedGameId]);

  const handleTabSelect = (key) => {
    setRankingType(key);
  };

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
  };

  const formatValue = (value) => {
    if (rankingType === 'OVERALL_PROFIT') {
      return `$${parseFloat(value).toFixed(2)}`;
    } else if (rankingType === 'TOTAL_BETS_AMOUNT') {
      return `$${parseFloat(value).toFixed(2)}`;
    } else if (rankingType === 'WIN_RATE' || rankingType === 'BY_GAME_WIN_RATE') {
      return `${parseFloat(value).toFixed(1)}%`;
    } else {
      return value;
    }
  };

  const renderRankingTable = () => {
    if (loading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading rankings...</p>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    // Check if rankings is an array before attempting to map
    if (!Array.isArray(rankings) || rankings.length === 0) {
      return <Alert variant="info">No rankings available yet.</Alert>;
    }

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th width="10%">Rank</th>
            <th>Player</th>
            <th width="20%">
              {rankingType === 'OVERALL_PROFIT' ? 'Total Profit' : 
               rankingType === 'TOTAL_BETS_AMOUNT' ? 'Total Bet Amount' : 
               'Wins'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking, index) => (
            <tr key={index}>
              <td className="text-center">
                {index === 0 ? (
                  <FaTrophy className="text-warning" size={24} />
                ) : index === 1 ? (
                  <FaTrophy className="text-secondary" size={20} />
                ) : index === 2 ? (
                  <FaTrophy style={{ color: '#CD7F32' }} size={18} />
                ) : (
                  `#${index + 1}`
                )}
              </td>
              <td>{ranking.usuario?.username || 'Unknown'}</td>
              <td>
                {rankingType === 'OVERALL_PROFIT' && parseFloat(ranking.valor) > 0 ? (
                  <Badge bg="success">{formatValue(ranking.valor)}</Badge>
                ) : rankingType === 'OVERALL_PROFIT' && parseFloat(ranking.valor) < 0 ? (
                  <Badge bg="danger">{formatValue(ranking.valor)}</Badge>
                ) : (
                  formatValue(ranking.valor)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  const renderGameTabs = () => {
    if (!Array.isArray(games) || games.length === 0) {
      return <Alert variant="info">No games available.</Alert>;
    }

    return (
      <div className="mb-4">
        <h5 className="mb-3">Select Game</h5>
        <div className="d-flex flex-wrap gap-2">
          {games.map(game => (
            <Badge 
              key={game.id}
              bg={selectedGameId === game.id ? 'primary' : 'secondary'}
              style={{ cursor: 'pointer', padding: '8px 12px' }}
              onClick={() => handleGameSelect(game.id)}
            >
              <FaGamepad className="me-1" />
              {game.nombre}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Container>
      <h2 className="text-center mb-4">
        <FaTrophy className="me-2" />
        Player Rankings
      </h2>
      
      <Tabs
        activeKey={rankingType}
        onSelect={handleTabSelect}
        className="mb-4"
      >
        <Tab 
          eventKey="OVERALL_PROFIT" 
          title={<><FaCoins className="me-1" /> Overall Profit</>}
        >
          <div className="py-3">
            <p>Players ranked by their total profit across all games.</p>
            {renderRankingTable()}
          </div>
        </Tab>
        <Tab 
          eventKey="TOTAL_BETS_AMOUNT" 
          title={<><FaCoins className="me-1" /> Total Bets</>}
        >
          <div className="py-3">
            <p>Players ranked by their total amount bet across all games.</p>
            {renderRankingTable()}
          </div>
        </Tab>
        <Tab 
          eventKey="WIN_RATE" 
          title={<><FaPercentage className="me-1" /> Win Rate</>}
        >
          <div className="py-3">
            <p>Players ranked by their win percentage across all games.</p>
            {renderRankingTable()}
          </div>
        </Tab>
        <Tab 
          eventKey="BY_GAME_WINS" 
          title={<><FaGamepad className="me-1" /> Game Wins</>}
        >
          <div className="py-3">
            <p>Players ranked by their wins in specific games.</p>
            {renderGameTabs()}
            {renderRankingTable()}
          </div>
        </Tab>
        <Tab 
          eventKey="BY_GAME_WIN_RATE" 
          title={<><FaChartLine className="me-1" /> Game Win Rate</>}
        >
          <div className="py-3">
            <p>Players ranked by their win percentage in specific games.</p>
            {renderGameTabs()}
            {renderRankingTable()}
          </div>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default RankingList;
