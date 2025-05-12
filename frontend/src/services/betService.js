import api from './api';

const BET_ENDPOINTS = {
  CREATE_BET: '/bets',
  GET_USER_BETS: (userId) => `/bets/user/${userId}`,
  GET_GAME_BETS: (gameId) => `/bets/game/${gameId}`,
  GET_USER_GAME_BETS: (userId, gameId) => `/bets/user/${userId}/game/${gameId}`,
  GET_BET_BY_ID: (betId) => `/bets/${betId}`,
  // These paths are relative to the API_BASE_URL which already includes '/api'
  PLACE_ROULETTE_BET: '/games/roulette/play',
  PLACE_DICE_BET: '/dice/play', 
  GET_BALANCE: (userId) => `/users/balance/${userId}`,
};

const betService = {
  // Create a new bet (generic)
  createBet: async (betData) => {
    try {
      console.log('Making API request to create bet:', betData);
      const response = await api.post(BET_ENDPOINTS.CREATE_BET, betData);
      console.log('API response for create bet:', response.data);
      return response.data;
    } catch (error) {
      console.error('API error creating bet:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      throw error.response?.data || { message: 'Failed to place bet' };
    }
  },

  // Place a game-specific bet
  placeGameBet: async (gameType, betData) => {
    try {
      let endpoint;
      
      // Select the appropriate endpoint based on game type
      switch (gameType.toLowerCase()) {
        case 'roulette':
          endpoint = BET_ENDPOINTS.PLACE_ROULETTE_BET;
          break;
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

  // Get all bets for a user with detailed game information
  getUserBets: async (userId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_USER_BETS(userId));
      const bets = response.data;
      
      // If we have bets, fetch detailed information for each
      if (Array.isArray(bets) && bets.length > 0) {
        // Get unique game IDs from the bets that have juegoId
        const gameIds = [...new Set(bets
          .filter(bet => bet.juegoId)
          .map(bet => bet.juegoId))];
        
        // For bets without juegoId, try to determine from bet type
        const processedBets = await Promise.all(bets.map(async (bet) => {
          // If bet already has juego object, return as is
          if (bet.juego) return bet;
          
          // If bet has juegoId but no juego object, fetch game details
          if (bet.juegoId) {
            try {
              // Attempt to get game details - in a real app, you'd have an API for this
              // For now, we'll create a placeholder based on known game IDs
              bet.juego = {
                id: bet.juegoId,
                nombre: bet.juegoId === 1 ? 'Ruleta' : bet.juegoId === 2 ? 'Dados' : `Game ${bet.juegoId}`
              };
            } catch (err) {
              console.error(`Failed to fetch game details for game ID ${bet.juegoId}:`, err);
            }
          } 

          
          
          // Normalize property names for UI consistency
          if (bet.tipoApuesta && !bet.tipo) {
            bet.tipo = bet.tipoApuesta;
          }
          
          return bet;
        }));
        
        return processedBets;
      }
      
      return bets;
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
