package udaw.casino.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import udaw.casino.model.Apuesta; 
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;


@Repository
public interface ApuestaRepository extends JpaRepository<Apuesta, Long> {

    /**
     * Finds all bets placed by a specific user, ordered by date descending.
     *
     * @param usuarioId The ID of the user.
     * @return A list of Apuesta objects.
     */
    List<Apuesta> findByUsuarioIdOrderByFechaApuestaDesc(Long usuarioId);

    /**
     * Finds all bets placed on a specific game, ordered by date descending.
     *
     * @param juegoId The ID of the game.
     * @return A list of Apuesta objects.
     */
    List<Apuesta> findByJuegoIdOrderByFechaApuestaDesc(Long juegoId);

    /**
     * Counts the number of bets for a given user, game, and status.
     * Used to calculate rankings like BY_GAME_WINS.
     *
     * @param usuario The user entity.
     * @param juego   The game entity.
     * @param estado  The status of the bet (e.g., "GANADA").
     * @return The count of matching bets.
     */
    long countByUsuarioAndJuegoAndEstado(Usuario usuario, Juego juego, String estado); // Add count method

}
