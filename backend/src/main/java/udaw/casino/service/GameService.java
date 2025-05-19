package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Game;
import udaw.casino.repository.GameRepository;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;

/**
 * Service class for managing casino games.
 * Handles CRUD operations for games, including creation, retrieval,
 * updates, and deletion. Ensures game uniqueness and maintains
 * game-related data integrity.
 */
@Service
public class GameService {

    private final GameRepository gameRepository;

    public GameService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    /**
     * Creates a new game in the casino system.
     * Validates game name uniqueness before creation.
     *
     * @param game The game details to create
     * @return The newly created game
     * @throws IllegalArgumentException if a game with the same name already exists
     */
    @Transactional
    public Game createGame(Game game) {
        // Validate game name uniqueness
        if (gameRepository.findByName(game.getName()).isPresent()) {
            throw new IllegalArgumentException("Game with name '" + game.getName() + "' already exists.");
        }
        return gameRepository.save(game);
    }

    /**
     * Retrieves a game by its unique identifier.
     *
     * @param id The unique identifier of the game
     * @return The found game
     * @throws ResourceNotFoundException if no game exists with the given ID
     */
    public Game getGameById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", id));
    }

    /**
     * Retrieves a game by its name.
     *
     * @param name The name of the game to find
     * @return The found game
     * @throws ResourceNotFoundException if no game exists with the given name
     */
    public Game getGameByName(String name) {
        return gameRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "name", name));
    }

    /**
     * Retrieves all available games in the casino.
     *
     * @return A list of all games, ordered by their natural order
     */
    public List<Game> getAllGames() {
        return gameRepository.findAll();
    }

    /**
     * Deletes a game from the casino system.
     * WARNING: This operation is irreversible and may affect associated data.
     * Consider implementing checks for:
     * - Existing bets associated with the game
     * - Active rankings or statistics
     * - User preferences or favorites
     *
     * @param id The ID of the game to delete
     * @throws ResourceNotFoundException if no game exists with the given ID
     */
    @Transactional
    public void deleteGame(Long id) {
        Game game = getGameById(id); // Validate game existence
        gameRepository.delete(game);
    }

    /**
     * Updates an existing game's details.
     * Preserves the game's ID while updating other fields.
     * Note: Game name updates should be handled with care as it may affect
     * existing references and user interfaces.
     *
     * @param id The ID of the game to update
     * @param game The new game details
     * @return The updated game
     * @throws ResourceNotFoundException if no game exists with the given ID
     */
    @Transactional
    public Game updateGame(Long id, Game game) {
        Game existingGame = getGameById(id); // Validate game existence
        
        // Update game properties
        existingGame.setName(game.getName());
        existingGame.setDescription(game.getDescription());

        
        return gameRepository.save(existingGame);
    }
}
