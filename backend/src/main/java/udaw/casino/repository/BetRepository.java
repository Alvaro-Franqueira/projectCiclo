package udaw.casino.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import udaw.casino.model.Bet; 
import udaw.casino.model.Game;
import udaw.casino.model.User;

/**
 * Repository interface for managing Bet entities in the casino system.
 * Provides methods for finding, counting, and calculating statistics related to bets,
 * including user-specific and game-specific operations.
 */
@Repository
public interface BetRepository extends JpaRepository<Bet, Long> {

    /**
     * Finds all bets placed by a specific user, ordered by date descending.
     *
     * @param userId The ID of the user.
     * @return A list of Bet objects.
     */
    List<Bet> findByUserIdOrderByBetDateDesc(Long userId);

    /**
     * Finds all bets placed on a specific game, ordered by date descending.
     *
     * @param gameId The ID of the game.
     * @return A list of Bet objects.
     */
    List<Bet> findByGameIdOrderByBetDateDesc(Long gameId);

    /**
     * Counts the number of bets for a given user, game, and status.
     * Used to calculate rankings like BY_GAME_AMOUNT.
     *
     * @param user The user entity.
     * @param game The game entity.
     * @param status The status of the bet (e.g., "WON").
     * @return The count of matching bets.
     */
    long countByUserAndGameAndStatus(User user, Game game, String status);

    /**
     * Calculates the total amount bet by a user.
     *
     * @param userId The ID of the user.
     * @return The total amount bet.
     */
    @Query("SELECT COALESCE(SUM(b.amount), 0.0) FROM Bet b WHERE b.user.id = :userId")
    Double calculateTotalBetAmountForUser(@Param("userId") Long userId);

    /**
     * Calculates the total amount bet by a user on a specific game.
     *
     * @param userId The ID of the user.
     * @param gameId The ID of the game.
     * @return The total amount bet on the specific game.
     */
    @Query("SELECT COALESCE(SUM(b.amount), 0.0) FROM Bet b WHERE b.user.id = :userId AND b.game.id = :gameId")
    Double calculateTotalBetAmountForUserAndGame(@Param("userId") Long userId, @Param("gameId") Long gameId);

    /**
     * Calculates the total profit for a user (sum of winloss values).
     *
     * @param userId The ID of the user.
     * @return The total profit.
     */
    @Query("SELECT COALESCE(SUM(b.winloss), 0.0) FROM Bet b WHERE b.user.id = :userId")
    Double calculateTotalProfitForUser(@Param("userId") Long userId);

    /**
     * Counts the number of winning bets for a user in a specific game.
     *
     * @param userId The ID of the user.
     * @param gameId The ID of the game.
     * @return The number of wins.
     */
    @Query("SELECT COUNT(b) FROM Bet b WHERE b.user.id = :userId AND b.game.id = :gameId AND b.status = 'WON'")
    Long countWinsByUserAndGame(@Param("userId") Long userId, @Param("gameId") Long gameId);

    /**
     * Finds all distinct games that a user has bet on.
     *
     * @param userId The ID of the user.
     * @return List of games the user has bet on.
     */
    @Query("SELECT DISTINCT b.game FROM Bet b WHERE b.user.id = :userId")
    List<Game> findDistinctGamesByUserId(@Param("userId") Long userId);
    
    /**
     * Finds all bets placed by a specific user on a specific game, ordered by date descending.
     *
     * @param userId The ID of the user.
     * @param gameId The ID of the game.
     * @return A list of Bet objects.
     */
    @Query("SELECT b FROM Bet b WHERE b.user.id = :userId AND b.game.id = :gameId ORDER BY b.betDate DESC")
    List<Bet> findByUserIdAndGameIdOrderByBetDateDesc(
        @Param("userId") Long userId, 
        @Param("gameId") Long gameId);
        
    /**
     * Counts the total number of bets placed by a user.
     *
     * @param userId The ID of the user.
     * @return The total number of bets.
     */
    @Query("SELECT COUNT(b) FROM Bet b WHERE b.user.id = :userId")
    Long countTotalBetsByUser(@Param("userId") Long userId);
    
    /**
     * Counts the total number of winning bets placed by a user.
     *
     * @param userId The ID of the user.
     * @return The total number of winning bets.
     */
    @Query("SELECT COUNT(b) FROM Bet b WHERE b.user.id = :userId AND b.status = 'WON'")
    Long countWinningBetsByUser(@Param("userId") Long userId);
    
    /**
     * Calculates the win rate for a user (percentage of winning bets).
     * Returns 0 if the user has no bets.
     *
     * @param userId The ID of the user.
     * @return The win rate as a decimal (e.g., 0.65 for 65%).
     */
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN CAST(SUM(CASE WHEN b.status = 'WON' THEN 1 ELSE 0 END) AS double) / COUNT(b) ELSE 0 END FROM Bet b WHERE b.user.id = :userId")
    Double calculateWinRateForUser(@Param("userId") Long userId);
    
    /**
     * Counts the total number of bets placed by a user on a specific game.
     *
     * @param userId The ID of the user.
     * @param gameId The ID of the game.
     * @return The total number of bets for the specific game.
     */
    @Query("SELECT COUNT(b) FROM Bet b WHERE b.user.id = :userId AND b.game.id = :gameId")
    Long countTotalBetsByUserAndGame(@Param("userId") Long userId, @Param("gameId") Long gameId);
    
    /**
     * Calculates the win rate for a user on a specific game (percentage of winning bets).
     * Returns 0 if the user has no bets on the game.
     *
     * @param userId The ID of the user.
     * @param gameId The ID of the game.
     * @return The win rate as a decimal (e.g., 0.65 for 65%).
     */
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN CAST(SUM(CASE WHEN b.status = 'WON' THEN 1 ELSE 0 END) AS double) / COUNT(b) ELSE 0 END FROM Bet b WHERE b.user.id = :userId AND b.game.id = :gameId")
    Double calculateWinRateForUserAndGame(@Param("userId") Long userId, @Param("gameId") Long gameId);

    /**
     * Calculates the total profit for a user on a specific game (sum of winloss values).
     *
     * @param userId The ID of the user.
     * @param gameId The ID of the game.
     * @return The total profit for the specific game.
     */
    @Query("SELECT COALESCE(SUM(b.winloss), 0.0) FROM Bet b WHERE b.user.id = :userId AND b.game.id = :gameId")
    Double calculateTotalProfitForUserAndGame(@Param("userId") Long userId, @Param("gameId") Long gameId);
}
