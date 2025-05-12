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

  // Helper to normalize bet properties from Spanish to English
  normalizeBetProperties: (bet) => {
    // Spanish to English property mappings
    const propertyMappings = {
      juegoId: 'gameId',
      tipo: 'type',
      tipoApuesta: 'type',
      juego: 'game',
      valorApostado: 'betValue',
      valorGanador: 'winningValue',
      fechaApuesta: 'betDate',
      estado: 'status',
      gananciaPerdida: 'winloss'
    };
    
    // First handle special case for tipoApuesta
    if (bet.tipoApuesta && !bet.tipo) {
      bet.tipo = bet.tipoApuesta;
    }
    
    // Map all Spanish properties to English
    Object.entries(propertyMappings).forEach(([spanishProp, englishProp]) => {
      if (bet[spanishProp] !== undefined && bet[englishProp] === undefined) {
        bet[englishProp] = bet[spanishProp];
      }
    });
    
    // Handle slot machine game IDs - normalize both IDs 7 and 10 to be consistent
    // This ensures all slot machine bets are recognized regardless of which ID was used
    if (bet.gameId === 10 && bet.type === 'SLOT_MACHINE') {
      bet.gameId = 7; // Use 7 as the canonical ID for slot machines
    }
    
    // Special case for game object
    if (bet.juego && !bet.game) {
      bet.game = {
        ...bet.juego,
        // Ensure game has an English name
        name: bet.juego.name || 
              (bet.juego.nombre ? 
              (bet.juego.id === 1 ? 'Roulette' : 
               bet.juego.id === 2 ? 'Dice' : 
               bet.juego.id === 9 ? 'Blackjack' :
               bet.juego.id === 7 || bet.juego.id === 10 ? 'Slot Machine' :
               bet.juego.id === 11 ? 'Sports Betting' : bet.juego.nombre) : 
               'Unknown Game')
      };
    }
    
    return bet;
  },

  // Get all bets for a user with detailed game information
  getUserBets: async (userId) => {
    try {
      const response = await api.get(BET_ENDPOINTS.GET_USER_BETS(userId));
      const bets = response.data;
      
      // If we have bets, fetch detailed information for each
      if (Array.isArray(bets) && bets.length > 0) {
        // Get unique game IDs from the bets that have juegoId or gameId
        const gameIds = [...new Set(bets
          .filter(bet => bet.gameId || bet.juegoId)
          .map(bet => bet.gameId || bet.juegoId))];
        
        // Process each bet to normalize properties
        const processedBets = bets.map(bet => betService.normalizeBetProperties(bet));
        
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
  },

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
