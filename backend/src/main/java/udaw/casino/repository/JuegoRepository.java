package udaw.casino.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import udaw.casino.model.Juego;

@Repository
public interface JuegoRepository extends JpaRepository<Juego, Long> {

    /**
     * Finds a game by its unique name.
     *
     * @param nombre The name of the game to find (e.g., "Roulette").
     * @return An Optional containing the Juego if found, otherwise an empty Optional.
     */
    Optional<Juego> findByNombre(String nombre); // Add method to find by name

}
