import gameService from '../services/gameService';

/**
 * Ensures that the Blackjack game exists in the database
 * If it doesn't exist, it will create it
 * @returns {Promise<Object>} The Blackjack game object
 */
export const ensureBlackjackGame = async () => {
  try {
    // Try to fetch the Blackjack game
    const blackjackGame = await gameService.getGameByName('Blackjack');
    console.log('Blackjack game found in the database:', blackjackGame);
    return blackjackGame;
  } catch (error) {
    console.log('Blackjack game not found in the database, creating it...');
    
    // Create the Blackjack game
    const gameData = {
      nombre: 'Blackjack',
      descripcion: 'Classic card game where the objective is to get a hand total of 21 or as close as possible without going over.'
    };
    
    try {
      const createdGame = await gameService.addGame(gameData);
      console.log('Blackjack game created successfully:', createdGame);
      return createdGame;
    } catch (createError) {
      console.error('Failed to create Blackjack game:', createError);
      throw createError;
    }
  }
};

export default ensureBlackjackGame;
