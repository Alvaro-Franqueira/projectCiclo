import api from './api';

const BET_ENDPOINTS = {
  CREATE_BET: '/apuestas',
  GET_USER_BETS: (userId) => `/apuestas/usuario/${userId}`,
  GET_GAME_BETS: (gameId) => `/apuestas/juego/${gameId}`,
  GET_BET_BY_ID: (betId) => `/apuestas/${betId}`,
};

const betService = {
  // Create a new bet
  createBet: async (betData) => {
    try {
      const response = await api.post(BET_ENDPOINTS.CREATE_BET, betData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to place bet' };
    }
  },

  // Get all bets for a user
  getUserBets: async (userId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_USER_BETS(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user bets' };
    }
  },

  // Get all bets for a game
  getGameBets: async (gameId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_GAME_BETS(gameId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game bets' };
    }
  },

  // Get bet by ID
  getBetById: async (betId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_BET_BY_ID(betId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch bet details' };
    }
  }
};

export default betService;
