package udaw.casino.repository;
import udaw.casino.model.Ranking;
import udaw.casino.model.RankingType;
import udaw.casino.model.Usuario;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import udaw.casino.model.Juego;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RankingRepository extends JpaRepository<Ranking, Long> {

    /**
     * Finds a specific ranking entry for a given user and ranking type.
     * Optionally filters by game if the game is provided.
     *
     * @param usuario The user.
     * @param tipo The type of ranking.
     * @param juego The game (can be null for global rankings).
     * @return Optional containing the Ranking entry if found.
     */
    Optional<Ranking> findByUsuarioAndTipoAndJuego(Usuario usuario, RankingType tipo, Juego juego);

    /**
     * Finds a specific global ranking entry for a given user and ranking type (where juego is null).
     *
     * @param usuario The user.
     * @param tipo The type of ranking.
     * @return Optional containing the Ranking entry if found.
     */
    Optional<Ranking> findByUsuarioAndTipoAndJuegoIsNull(Usuario usuario, RankingType tipo);


    /**
     * Finds all ranking entries for a specific ranking type, ordered by score descending.
     * This is used to get the actual leaderboard.
     *
     * @param tipo The type of ranking.
     * @return A list of Ranking entries ordered by score.
     */
    List<Ranking> findByTipoOrderByScoreDesc(RankingType tipo);

    /**
     * Finds all ranking entries for a specific ranking type and game, ordered by score descending.
     *
     * @param tipo The type of ranking.
     * @param juego The specific game.
     * @return A list of Ranking entries for that game, ordered by score.
     */
    List<Ranking> findByTipoAndJuegoOrderByScoreDesc(RankingType tipo, Juego juego);


    // Example of a query to calculate total bet amount for a user (could be used by RankingService)
    @Query("SELECT COALESCE(SUM(a.cantidad), 0.0) FROM Apuesta a WHERE a.usuario = :usuario")
    Double calculateTotalBetAmountForUser(@Param("usuario") Usuario usuario);

    // Example of a query to calculate total profit for a user (could be used by RankingService)
    // Note: This assumes 'winloss' accurately reflects profit/loss from the bet amount.
    // If winloss only stores the amount won/lost *excluding* the original bet, adjust accordingly.
    @Query("SELECT COALESCE(SUM(a.winloss), 0.0) FROM Apuesta a WHERE a.usuario = :usuario")
    Double calculateTotalProfitForUser(@Param("usuario") Usuario usuario);


    // Removed the incorrect method signature and fixed the syntax error (extra '}')
    // Optional<Ranking> findByUsuarioIdAndTipo(Long usuarioId, RankingType tipo);
} // Correct closing brace for the interface

