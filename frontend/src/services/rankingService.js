import api from './api';

const RANKING_ENDPOINTS = {
  ALL_RANKINGS: '/rankings/v2',
  RANKINGS_BY_TYPE: (type) => `/rankings/v2/tipo/${type}`,
  RANKINGS_BY_GAME_AND_TYPE: (gameId, type) => `/rankings/v2/juego/${gameId}/tipo/${type}`,
  USER_RANKINGS: (userId) => `/rankings/v2/usuario/${userId}`,
};

// Ranking types enum to match backend RankingType.java
const RANKING_TYPES = {
  BY_GAME_WINS: 'BY_GAME_WINS',
  TOTAL_BETS_AMOUNT: 'TOTAL_BETS_AMOUNT',
  OVERALL_PROFIT: 'OVERALL_PROFIT',
  WIN_RATE: 'WIN_RATE',
  BY_GAME_WIN_RATE: 'BY_GAME_WIN_RATE'
};

const rankingService = {
  // Expose ranking types enum
  RANKING_TYPES,
  
  // Get all rankings
  getAllRankings: async () => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.ALL_RANKINGS);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch rankings' };
    }
  },

  // Get rankings by type (OVERALL_PROFIT, TOTAL_BETS_AMOUNT, WIN_RATE, etc.)
  getRankingsByType: async (rankingType) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_TYPE(rankingType));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch rankings by type' };
    }
  },

  // Get rankings for a specific game and type
  getRankingsByGameAndType: async (gameId, rankingType) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, rankingType));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game rankings' };
    }
  },

  // Get rankings for a specific user
  getUserRankings: async (userId) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.USER_RANKINGS(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user rankings' };
    }
  },
  
  // Get win rate rankings
  getWinRateRankings: async () => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_TYPE(RANKING_TYPES.WIN_RATE));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch win rate rankings' };
    }
  },
  
  // Get game-specific win rate rankings
  getGameWinRateRankings: async (gameId) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, RANKING_TYPES.BY_GAME_WIN_RATE));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game win rate rankings' };
    }
  }
};

export default rankingService;
