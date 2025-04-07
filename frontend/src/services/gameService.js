import api from './api';

const GAME_ENDPOINTS = {
  ALL_GAMES: '/juegos',
  GAME_BY_ID: (id) => `/juegos/${id}`,
};

const gameService = {
  // Get all available games
  getAllGames: async () => {
    try {
      const response = await api.get(GAME_ENDPOINTS.ALL_GAMES);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch games' };
    }
  },

  // Get game by ID
  getGameById: async (gameId) => {
    try {
      const response = await api.get(GAME_ENDPOINTS.GAME_BY_ID(gameId));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game details' };
    }
  }
};

export default gameService;
