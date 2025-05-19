package udaw.casino.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import udaw.casino.model.Game;

/**
 * Repository interface for managing Game entities in the casino system.
 * Provides methods for finding games by name and other standard CRUD operations.
 */
@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    /**
     * Finds a game by its unique name.
     *
     * @param name The name of the game to find (e.g., "Roulette").
     * @return An Optional containing the Game if found, otherwise an empty Optional.
     */
    Optional<Game> findByName(String name); // Add method to find by name

}
