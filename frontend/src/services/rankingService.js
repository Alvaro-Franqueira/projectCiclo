import api from './api';

const RANKING_ENDPOINTS = {
  ALL_RANKINGS: '/rankings',
  RANKINGS_BY_TYPE: (type) => `/rankings/type/${type}`,
  RANKINGS_BY_GAME: (gameId) => `/rankings/game/${gameId}`,
  USER_RANKINGS: (userId) => `/rankings/usuario/${userId}`,
};

const rankingService = {
  // Get all rankings
  getAllRankings: async () => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.ALL_RANKINGS);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch rankings' };
    }
  },

  // Get rankings by type (OVERALL_PROFIT, TOTAL_BETS_AMOUNT, BY_GAME_WINS)
  getRankingsByType: async (rankingType) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_TYPE(rankingType));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch rankings by type' };
    }
  },

  // Get rankings for a specific game
  getRankingsByGame: async (gameId) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME(gameId));
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
  }
};

export default rankingService;
