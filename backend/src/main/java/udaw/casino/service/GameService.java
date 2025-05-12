package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Game;
import udaw.casino.repository.GameRepository;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;


@Service
public class GameService {

    private final GameRepository gameRepository;

    public GameService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    /**
     * Creates a new game.
     *
     * @param game The game details.
     * @return The saved Game object.
     */
    @Transactional
    public Game createGame(Game game) {
        // Optional: Add check for existing game name if it should be unique
        if (gameRepository.findByName(game.getName()).isPresent()) {
             throw new IllegalArgumentException("Game with name '" + game.getName() + "' already exists.");
        }
        return gameRepository.save(game);
    }

    /**
     * Retrieves a game by its ID.
     *
     * @param id The ID of the game.    
     * @return The found Game object.
     * @throws ResourceNotFoundException if the game is not found.
     */
    public Game getGameById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", id));
    }

    /**
     * Retrieves a game by its name.
     *
     * @param name The name of the game.
     * @return The found Game object.
     * @throws ResourceNotFoundException if the game is not found.
     */
    public Game getGameByName(String name) {
        return gameRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "name", name));
    }


    /**
     * Retrieves all available games.
     *
     * @return A list of all Game objects.
     */
    public List<Game> getAllGames() {
        return gameRepository.findAll();
    }

    // Optional: Add update and delete methods if needed for game management
    /**
     * Deletes a game by its ID.
     * CAUTION: Consider consequences of deleting a game with existing bets/rankings.
     * Might need cascading deletes or checks before allowing deletion.
     * @param id The ID of the game to delete.
     */
    @Transactional
    public void deleteGame(Long id) {
        Game game = getGameById(id); // Ensure game exists
        // Add checks here if needed (e.g., check if bets exist for this game)
        gameRepository.delete(game);
    }

    /**
     * Updates an existing game.
     *
     * @param id The ID of the game to update.
     * @param game The new game details.
     * @return The updated Game object.
     * @throws ResourceNotFoundException if the game is not found.
     */
    @Transactional
    public Game updateGame(Long id, Game game) {
        Game existingGame = getGameById(id); // Ensure game exists
        // Optional: Add checks for unique fields if needed (e.g., name)
        existingGame.setName(game.getName());
        existingGame.setDescription(game.getDescription());
        // Add other fields as necessary
        return gameRepository.save(existingGame);
    }
}
