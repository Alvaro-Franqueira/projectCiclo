import api from './api';

const RANKING_ENDPOINTS = {
  ALL_RANKINGS: '/rankings/v2',
  RANKINGS_BY_TYPE: (type) => `/rankings/v2/type/${type}`,
  RANKINGS_BY_GAME_AND_TYPE: (gameId, type) => `/rankings/v2/game/${gameId}/type/${type}`,
  USER_RANKINGS: (userId) => `/rankings/v2/user/${userId}`,
};

// Ranking types enum to match backend RankingType.java
const RANKING_TYPES = {
  BY_GAME_WINS: 'BY_GAME_WINS',
  TOTAL_BETS_AMOUNT: 'TOTAL_BETS_AMOUNT',
  OVERALL_PROFIT: 'OVERALL_PROFIT',
  WIN_RATE: 'WIN_RATE',
  BY_GAME_WIN_RATE: 'BY_GAME_WIN_RATE',
  BY_GAME_PROFIT: 'BY_GAME_PROFIT',
  BIGGEST_LOSERS: 'BIGGEST_LOSERS' // New type for biggest losers
};

const rankingService = {
  // Expose ranking types enum
  RANKING_TYPES,
  
  // Helper to normalize ranking properties between Spanish and English
  normalizeRankingProperties: (ranking) => {
    // Spanish to English property mappings
    const propertyMappings = {
      usuario: 'user',
      valor: 'score',
      posicion: 'position',
      tipo: 'type',
      juego: 'game'
    };
    
    // For debugging
    console.log('Before normalization:', ranking);
    
    // Map Spanish properties to English
    Object.entries(propertyMappings).forEach(([spanishProp, englishProp]) => {
      if (ranking[spanishProp] !== undefined && ranking[englishProp] === undefined) {
        ranking[englishProp] = ranking[spanishProp];
      }
    });
    
    // Handle the reverse mapping for user/usuario
    if (ranking.user && !ranking.usuario) {
      ranking.usuario = ranking.user;
    }
    
    // Ensure score is a number and has both English and Spanish properties
    if (ranking.score !== undefined && ranking.valor === undefined) {
      ranking.valor = ranking.score;
    } else if (ranking.valor !== undefined && ranking.score === undefined) {
      ranking.score = ranking.valor;
    }
    
    // Convert score to number if it's a string
    if (typeof ranking.score === 'string') {
      ranking.score = parseFloat(ranking.score);
    }
    if (typeof ranking.valor === 'string') {
      ranking.valor = parseFloat(ranking.valor);
    }
    
    // Special case for game object
    if (ranking.juego && !ranking.game) {
      ranking.game = {
        ...ranking.juego,
        name: ranking.juego.name || ranking.juego.nombre || 'Unknown Game'
      };
    } else if (ranking.game && !ranking.juego) {
      ranking.juego = {
        ...ranking.game,
        nombre: ranking.game.nombre || ranking.game.name || 'Unknown Game'
      };
    }
    
    if (ranking.game) {
      // Ensure game has both name and nombre properties
      if (ranking.game.name && !ranking.game.nombre) {
        ranking.game.nombre = ranking.game.name;
      } else if (ranking.game.nombre && !ranking.game.name) {
        ranking.game.name = ranking.game.nombre;
      }
    }
    
    if (ranking.juego) {
      // Ensure juego has both name and nombre properties
      if (ranking.juego.name && !ranking.juego.nombre) {
        ranking.juego.nombre = ranking.juego.name;
      } else if (ranking.juego.nombre && !ranking.juego.name) {
        ranking.juego.name = ranking.juego.nombre;
      }
    }
    
    // For debugging
    console.log('After normalization:', ranking);
    
    return ranking;
  },
  
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
      // Normalize each ranking
      return Array.isArray(response.data) 
        ? response.data.map(ranking => rankingService.normalizeRankingProperties(ranking))
        : [];
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch rankings by type' };
    }
  },

  // Get rankings for a specific game and type
  getRankingsByGameAndType: async (gameId, rankingType) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, rankingType));
      // Normalize each ranking
      return Array.isArray(response.data) 
        ? response.data.map(ranking => rankingService.normalizeRankingProperties(ranking))
        : [];
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game rankings' };
    }
  },

  // Get rankings for a specific user
  getUserRankings: async (userId) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.USER_RANKINGS(userId));
      // Normalize each ranking
      return Array.isArray(response.data) 
        ? response.data.map(ranking => rankingService.normalizeRankingProperties(ranking))
        : [];
    } catch (error) {
      console.error("Failed to fetch user rankings:", error);
      // Return empty array instead of throwing error to prevent UI breaks
      return [];
    }
  },
  
  // Get game profit rankings
  getGameProfitRankings: async (gameId) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, RANKING_TYPES.BY_GAME_PROFIT));
      // Normalize each ranking
      return Array.isArray(response.data) 
        ? response.data.map(ranking => rankingService.normalizeRankingProperties(ranking))
        : [];
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game profit rankings' };
    }
  },

  // Get win rate rankings
  getWinRateRankings: async () => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_TYPE(RANKING_TYPES.WIN_RATE));
      // Normalize each ranking
      return Array.isArray(response.data) 
        ? response.data.map(ranking => rankingService.normalizeRankingProperties(ranking))
        : [];
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch win rate rankings' };
    }
  },
  
  // Get game-specific win rate rankings
  getGameWinRateRankings: async (gameId) => {
    try {
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, RANKING_TYPES.BY_GAME_WIN_RATE));
      // Normalize each ranking
      return Array.isArray(response.data) 
        ? response.data.map(ranking => rankingService.normalizeRankingProperties(ranking))
        : [];
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game win rate rankings' };
    }
  },
  
  // Get biggest losers rankings - players who have lost the most money
  getBiggestLosersRankings: async () => {
    try {
      // First get overall profit rankings
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_TYPE(RANKING_TYPES.OVERALL_PROFIT));
      
      if (!Array.isArray(response.data)) {
        return [];
      }
      
      // Normalize and sort by profit ascending (so biggest losers come first)
      const normalizedRankings = response.data.map(ranking => 
        rankingService.normalizeRankingProperties(ranking)
      );
      
      // Filter to only include losers (negative profit)
      const losers = normalizedRankings.filter(ranking => 
        (ranking.score < 0 || ranking.valor < 0)
      );
      
      // Sort by most negative first (biggest losers)
      losers.sort((a, b) => (a.score || a.valor) - (b.score || b.valor));
      
      // Recalculate positions
      losers.forEach((ranking, index) => {
        ranking.position = index + 1;
      });
      
      return losers;
    } catch (error) {
      console.error("Failed to fetch biggest losers rankings:", error);
      return [];
    }
  },
  
  // Get game-specific biggest losers rankings
  getGameBiggestLosersRankings: async (gameId) => {
    try {
      // First get game profit rankings
      const response = await api.get(RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, RANKING_TYPES.BY_GAME_PROFIT));
      
      if (!Array.isArray(response.data)) {
        return [];
      }
      
      // Normalize and sort by profit ascending (so biggest losers come first)
      const normalizedRankings = response.data.map(ranking => 
        rankingService.normalizeRankingProperties(ranking)
      );
      
      // Filter to only include losers (negative profit)
      const losers = normalizedRankings.filter(ranking => 
        (ranking.score < 0 || ranking.valor < 0)
      );
      
      // Sort by most negative first (biggest losers)
      losers.sort((a, b) => (a.score || a.valor) - (b.score || b.valor));
      
      // Recalculate positions
      losers.forEach((ranking, index) => {
        ranking.position = index + 1;
      });
      
      return losers;
    } catch (error) {
      console.error(`Failed to fetch biggest losers rankings for game ${gameId}:`, error);
      return [];
    }
  }
};

export default rankingService;
