import api from './api';

const GAME_ENDPOINTS = {
  ALL_GAMES: '/games',
  GAME_BY_ID: (id) => `/games/${id}`,
  GAME_BY_NAME: (name) => `/games/name/${name}`
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
      console.error('Error fetching game by ID:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to fetch game details' };
    }
  },
  // get game by name
  getGameByName: async (gameName) => {
    try {
      const response = await api.get(GAME_ENDPOINTS.GAME_BY_NAME(gameName));
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch game details' };
    }
  },
  // Update an existing game
  updateGame: async (gameId, gameData) => {
    try {
      // Assuming gameData includes: name, description, imageUrl, price, genre
      const response = await api.put(GAME_ENDPOINTS.GAME_BY_ID(gameId), gameData);
      return response.data;
    } catch (error) {
      console.error('Error updating game:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to update game' };
    }
  },

  // Delete a game
  deleteGame: async (gameId) => {
    try {
      const response = await api.delete(GAME_ENDPOINTS.GAME_BY_ID(gameId));
      return response.data; // Or just response.status if no data is returned on delete
    } catch (error) {
      console.error('Error deleting game:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to delete game' };
    }
  },
  // Create a new game
  addGame: async (gameData) => {
    try {
      const response = await api.post(GAME_ENDPOINTS.ALL_GAMES, gameData);
      return response.data;
    } catch (error) {
      console.error('Error creating game:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to create game' };
    }
  }
};


export default gameService;
