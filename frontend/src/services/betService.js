import api from './api';

const BET_ENDPOINTS = {
  CREATE_BET: '/apuestas',
  GET_USER_BETS: (userId) => `/apuestas/usuario/${userId}`,
  GET_GAME_BETS: (gameId) => `/apuestas/juego/${gameId}`,
  GET_USER_GAME_BETS: (userId, gameId) => `/apuestas/usuario/${userId}/juego/${gameId}`,
  GET_BET_BY_ID: (betId) => `/apuestas/${betId}`,
  // These paths are relative to the API_BASE_URL which already includes '/api'
  PLACE_ROULETTE_BET: '/juegos/ruleta/jugar',
  PLACE_DICE_BET: '/dados/jugar', 
  GET_BALANCE: (userId) => `/usuarios/balance/${userId}`,
};

const betService = {
  // Create a new bet (generic)
  createBet: async (betData) => {
    try {
      const response = await api.post(BET_ENDPOINTS.CREATE_BET, betData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to place bet' };
    }
  },

  // Place a game-specific bet
  placeGameBet: async (gameType, betData) => {
    try {
      let endpoint;
      
      // Select the appropriate endpoint based on game type
      switch (gameType.toLowerCase()) {
        case 'ruleta':
        case 'roulette':
          endpoint = BET_ENDPOINTS.PLACE_ROULETTE_BET;
          break;
        case 'dados':
        case 'dice':
          endpoint = BET_ENDPOINTS.PLACE_DICE_BET;
          break;
        default:
          // Fall back to generic bet creation
          return betService.createBet(betData);
      }
      
      const response = await api.post(endpoint, betData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: `Failed to place ${gameType} bet` };
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
  },
  
  // Get bets for a specific user in a specific game
  getUserGameBets: async (userId, gameId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_USER_GAME_BETS(userId, gameId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user game bets' };
    }
  }
,
// Get user balance
  getUserBalance: async (userId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_BALANCE(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user balance' };
    }
  }
}

export default betService;
