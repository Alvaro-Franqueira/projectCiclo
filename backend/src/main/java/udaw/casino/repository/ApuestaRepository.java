package udaw.casino.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    long countByUsuarioAndJuegoAndEstado(Usuario usuario, Juego juego, String estado);

    /**
     * Calculates the total amount bet by a user.
     *
     * @param usuarioId The ID of the user.
     * @return The total amount bet.
     */
    @Query("SELECT COALESCE(SUM(a.cantidad), 0.0) FROM Apuesta a WHERE a.usuario.id = :usuarioId")
    Double calculateTotalBetAmountForUser(@Param("usuarioId") Long usuarioId);

    /**
     * Calculates the total profit for a user (sum of winloss values).
     *
     * @param usuarioId The ID of the user.
     * @return The total profit.
     */
    @Query("SELECT COALESCE(SUM(a.winloss), 0.0) FROM Apuesta a WHERE a.usuario.id = :usuarioId")
    Double calculateTotalProfitForUser(@Param("usuarioId") Long usuarioId);

    /**
     * Counts the number of winning bets for a user in a specific game.
     *
     * @param usuarioId The ID of the user.
     * @param juegoId The ID of the game.
     * @return The number of wins.
     */
    @Query("SELECT COUNT(a) FROM Apuesta a WHERE a.usuario.id = :usuarioId AND a.juego.id = :juegoId AND a.estado = 'GANADA'")
    Long countWinsByUserAndGame(@Param("usuarioId") Long usuarioId, @Param("juegoId") Long juegoId);

    /**
     * Finds all distinct games that a user has bet on.
     *
     * @param usuarioId The ID of the user.
     * @return List of games the user has bet on.
     */
    @Query("SELECT DISTINCT a.juego FROM Apuesta a WHERE a.usuario.id = :usuarioId")
    List<Juego> findDistinctJuegosByUsuarioId(@Param("usuarioId") Long usuarioId);
    
    /**
     * Finds all bets placed by a specific user on a specific game, ordered by date descending.
     *
     * @param usuarioId The ID of the user.
     * @param juegoId The ID of the game.
     * @return A list of Apuesta objects.
     */
    @Query("SELECT a FROM Apuesta a WHERE a.usuario.id = :usuarioId AND a.juego.id = :juegoId ORDER BY a.fechaApuesta DESC")
    List<Apuesta> findByUsuarioIdAndJuegoIdOrderByFechaApuestaDesc(
        @Param("usuarioId") Long usuarioId, 
        @Param("juegoId") Long juegoId);
        
    /**
     * Counts the total number of bets placed by a user.
     *
     * @param usuarioId The ID of the user.
     * @return The total number of bets.
     */
    @Query("SELECT COUNT(a) FROM Apuesta a WHERE a.usuario.id = :usuarioId")
    Long countTotalBetsByUser(@Param("usuarioId") Long usuarioId);
    
    /**
     * Counts the total number of winning bets placed by a user.
     *
     * @param usuarioId The ID of the user.
     * @return The total number of winning bets.
     */
    @Query("SELECT COUNT(a) FROM Apuesta a WHERE a.usuario.id = :usuarioId AND a.estado = 'GANADA'")
    Long countWinningBetsByUser(@Param("usuarioId") Long usuarioId);
    
    /**
     * Calculates the win rate for a user (percentage of winning bets).
     * Returns 0 if the user has no bets.
     *
     * @param usuarioId The ID of the user.
     * @return The win rate as a decimal (e.g., 0.65 for 65%).
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN CAST(SUM(CASE WHEN a.estado = 'GANADA' THEN 1 ELSE 0 END) AS double) / COUNT(a) ELSE 0 END FROM Apuesta a WHERE a.usuario.id = :usuarioId")
    Double calculateWinRateForUser(@Param("usuarioId") Long usuarioId);
    
    /**
     * Counts the total number of bets placed by a user on a specific game.
     *
     * @param usuarioId The ID of the user.
     * @param juegoId The ID of the game.
     * @return The total number of bets for the specific game.
     */
    @Query("SELECT COUNT(a) FROM Apuesta a WHERE a.usuario.id = :usuarioId AND a.juego.id = :juegoId")
    Long countTotalBetsByUserAndGame(@Param("usuarioId") Long usuarioId, @Param("juegoId") Long juegoId);
    
    /**
     * Calculates the win rate for a user on a specific game (percentage of winning bets).
     * Returns 0 if the user has no bets on the game.
     *
     * @param usuarioId The ID of the user.
     * @param juegoId The ID of the game.
     * @return The win rate as a decimal (e.g., 0.65 for 65%).
     */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN CAST(SUM(CASE WHEN a.estado = 'GANADA' THEN 1 ELSE 0 END) AS double) / COUNT(a) ELSE 0 END FROM Apuesta a WHERE a.usuario.id = :usuarioId AND a.juego.id = :juegoId")
    Double calculateWinRateForUserAndGame(@Param("usuarioId") Long usuarioId, @Param("juegoId") Long juegoId);
}
