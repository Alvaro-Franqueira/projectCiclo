import gameService from '../services/gameService';

/**
 * Ensures that the Blackjack game exists in the database
 * This can be called at application startup to make sure the game is available
 */
const ensureBlackjackGame = async () => {
  try {
    // First check if the game already exists
    try {
      const existingGame = await gameService.getGameByName('Blackjack');
      console.log('Blackjack game already exists in database:', existingGame);
      return existingGame;
    } catch (error) {
      // Game doesn't exist, create it
      console.log('Blackjack game not found, creating it...');
      
      const blackjackGame = {
        nombre: 'Blackjack',
        descripcion: 'Classic card game where the objective is to get a hand total of 21 or as close as possible without going over.',
        
      };
      
      const createdGame = await gameService.addGame(blackjackGame);
      console.log('Blackjack game created successfully:', createdGame);
      return createdGame;
    }
  } catch (error) {
    console.error('Error ensuring Blackjack game exists:', error);
    return null;
  }
};

export default ensureBlackjackGame; 