import api from './api';

const RANKING_ENDPOINTS = {
  ALL_RANKINGS: '/rankings/v2',
  RANKINGS_BY_TYPE: (type) => `/rankings/v2/type/${type}`,
  RANKINGS_BY_GAME_AND_TYPE: (gameId, type) => `/rankings/v2/game/${gameId}/type/${type}`,
  USER_RANKINGS: (userId) => `/rankings/v2/user/${userId}`,
};

// Ranking types enum to match backend RankingType.java
const RANKING_TYPES = {
  BY_GAME_AMOUNT: 'BY_GAME_AMOUNT',
  TOTAL_BETS_AMOUNT: 'TOTAL_BETS_AMOUNT',
  OVERALL_PROFIT: 'OVERALL_PROFIT',
  WIN_RATE: 'WIN_RATE',
  BY_GAME_WIN_RATE: 'BY_GAME_WIN_RATE',
  BY_GAME_PROFIT: 'BY_GAME_PROFIT',
  TOP_LOSERS: 'TOP_LOSERS',
  BY_GAME_LOSSES: 'BY_GAME_LOSSES'
};

// Cache to store ranking results and reduce API calls
const rankingCache = {
  // Structure: { cacheKey: { data: [...], timestamp: Date.now() } }
  cache: {},
  
  // Cache expiration time in milliseconds (10 minutes, increased from 5)
  CACHE_EXPIRY: 10 * 60 * 1000,
  
  // Shorter cache for development/debugging (30 seconds)
  DEBUG_CACHE_EXPIRY: 30 * 1000,
  
  // Flag to enable shorter cache expiry for debugging
  debugMode: false,
  
  // Generate cache key based on endpoint and parameters
  getCacheKey: (endpoint, params = {}) => {
    return `${endpoint}${params.gameId ? '_game_' + params.gameId : ''}${params.type ? '_type_' + params.type : ''}`;
  },
  
  // Get data from cache if available and not expired
  get: (key) => {
    const cachedData = rankingCache.cache[key];
    const expiryTime = rankingCache.debugMode ? rankingCache.DEBUG_CACHE_EXPIRY : rankingCache.CACHE_EXPIRY;
    
    if (cachedData && (Date.now() - cachedData.timestamp < expiryTime)) {
      return cachedData.data;
    }
    return null;
  },
  
  // Set data in cache with current timestamp
  set: (key, data) => {
    rankingCache.cache[key] = {
      data,
      timestamp: Date.now()
    };
    return data;
  },
  
  // Clear entire cache or specific key
  clear: (key = null) => {
    if (key) {
      delete rankingCache.cache[key];
    } else {
      rankingCache.cache = {};
    }
  },
  
  // Clear all game-related caches for a specific game
  clearGameCaches: (gameId) => {
    Object.keys(rankingCache.cache).forEach(key => {
      if (key.includes(`_game_${gameId}`)) {
        delete rankingCache.cache[key];
      }
    });
  },
  
  // Clear all caches for a specific ranking type
  clearTypeCache: (rankingType) => {
    Object.keys(rankingCache.cache).forEach(key => {
      if (key.includes(`_type_${rankingType}`)) {
        delete rankingCache.cache[key];
      }
    });
  },
  
  // Mark an endpoint as failed (to avoid repeated failures)
  markEndpointFailed: (endpoint, params = {}) => {
    const key = rankingCache.getCacheKey(endpoint, params);
    rankingCache.cache[key] = {
      data: [],
      timestamp: Date.now(),
      failed: true
    };
  },
  
  // Check if an endpoint has previously failed
  hasEndpointFailed: (endpoint, params = {}) => {
    const key = rankingCache.getCacheKey(endpoint, params);
    const cachedData = rankingCache.cache[key];
    return cachedData && cachedData.failed === true;
  },
  
  // Set debug mode
  setDebugMode: (isDebug) => {
    rankingCache.debugMode = isDebug;
  }
};

const rankingService = {
  // Expose ranking types enum
  RANKING_TYPES,
  
  // Generic function to fetch ranking data with caching
  fetchRankings: async (endpoint, params = {}, options = {}) => {
    const { skipCache = false, fallbackFunction = null } = options;
    const cacheKey = rankingCache.getCacheKey(endpoint, params);
    
    // Try to get from cache first
    if (!skipCache) {
      const cachedData = rankingCache.get(cacheKey);
      if (cachedData) return cachedData;
    }
    
    try {
      // Make API call
      const response = await api.get(endpoint);
      
      // Process data
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
        
        // Ensure numeric score values
        data.forEach(ranking => {
          if (typeof ranking.score === 'string') {
            ranking.score = parseFloat(ranking.score);
          }
        });
      }
      
      // Cache the result
      return rankingCache.set(cacheKey, data);
    } catch (error) {
      // Try fallback if provided
      if (fallbackFunction) {
        try {
          return await fallbackFunction();
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${endpoint}`);
          return [];
        }
      }
      
      return [];
    }
  },
  
  // Get all rankings
  getAllRankings: async () => {
    return rankingService.fetchRankings(RANKING_ENDPOINTS.ALL_RANKINGS);
  },

  // Get rankings by type (OVERALL_PROFIT, TOTAL_BETS_AMOUNT, WIN_RATE, etc.)
  getRankingsByType: async (rankingType) => {
    return rankingService.fetchRankings(
      RANKING_ENDPOINTS.RANKINGS_BY_TYPE(rankingType),
      { type: rankingType }
    );
  },

  // Get rankings for a specific game and type
  getRankingsByGameAndType: async (gameId, rankingType) => {
    return rankingService.fetchRankings(
      RANKING_ENDPOINTS.RANKINGS_BY_GAME_AND_TYPE(gameId, rankingType),
      { gameId, type: rankingType }
    );
  },

  // Get rankings for a specific user
  getUserRankings: async (userId) => {
    return rankingService.fetchRankings(
      RANKING_ENDPOINTS.USER_RANKINGS(userId),
      { userId }
    );
  },
  
  // Get game profit rankings
  getGameProfitRankings: async (gameId) => {
    return rankingService.getRankingsByGameAndType(gameId, RANKING_TYPES.BY_GAME_PROFIT);
  },

  // Get win rate rankings
  getWinRateRankings: async () => {
    return rankingService.getRankingsByType(RANKING_TYPES.WIN_RATE);
  },
  
  // Get game-specific win rate rankings
  getGameWinRateRankings: async (gameId) => {
    return rankingService.getRankingsByGameAndType(gameId, RANKING_TYPES.BY_GAME_WIN_RATE);
  },
  
  // Get biggest losers rankings
  getBiggestLosersRankings: async () => {
    return rankingService.getRankingsByType(RANKING_TYPES.TOP_LOSERS);
  },
  
  // Get game-specific losses rankings
  getGameMostLossesRankings: async (gameId) => {
    return rankingService.getRankingsByGameAndType(gameId, RANKING_TYPES.BY_GAME_LOSSES);
  },
  
  // Clear all cached rankings data
  clearCache: () => {
    rankingCache.clear();
  },
  
  // Reset cache for specific ranking types (useful for debugging)
  resetRankingTypeCache: (rankingType) => {
    console.log(`Resetting cache for ranking type: ${rankingType}`);
    rankingCache.clearTypeCache(rankingType);
    return true;
  },
  
  // Reset cache for specific game rankings (useful for debugging)
  resetGameCache: (gameId) => {
    console.log(`Resetting cache for game ID: ${gameId}`);
    rankingCache.clearGameCaches(gameId);
    return true;
  },
  
   
};

export default rankingService;
