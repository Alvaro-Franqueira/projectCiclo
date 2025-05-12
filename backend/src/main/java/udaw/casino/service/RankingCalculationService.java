package udaw.casino.service;

import udaw.casino.model.Game;
import udaw.casino.model.RankingType;
import udaw.casino.model.User;
import udaw.casino.repository.BetRepository;
import udaw.casino.repository.UserRepository;

import org.springframework.stereotype.Service;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for calculating rankings on-demand without storing them in the database.
 * This replaces the previous approach of maintaining a separate Ranking entity.
 */
@Service

public class RankingCalculationService {

    private static final Logger log = LoggerFactory.getLogger(RankingCalculationService.class);

    private final BetRepository betRepository;
    private final UserRepository userRepository;

    public RankingCalculationService(BetRepository betRepository, UserRepository userRepository) {
        this.betRepository = betRepository;
        this.userRepository = userRepository;
    }

    /**
     * Represents a ranking entry with user information and score.
     */
    @Getter
    @Setter
    public static class RankingEntry {
        private User user;
        private Game game;
        private RankingType type;
        private Double score;
        private Integer position;

        public RankingEntry(User user, Game game, RankingType type, Double score) {
            this.user = user;
            this.game = game;
            this.type = type;
            this.score = score;
        }

    }

    /**
     * Gets the global ranking list for a specific type.
     *
     * @param type The type of ranking.
     * @return List of RankingEntry objects ordered by score.
     */
    public List<RankingEntry> getRankingByType(RankingType type) {
        log.info("Calculating on-demand ranking for type: {}", type);
        
        // Check if the ranking type requires a game
        if (type == RankingType.BY_GAME_WINS || type == RankingType.BY_GAME_WIN_RATE || type == RankingType.BY_GAME_PROFIT) {
            log.warn("Requested game-specific ranking type {} without specifying a game - returning empty list", type);
            return new ArrayList<>(); // Return empty list for game-specific ranking types
        }
        
        List<User> users = userRepository.findAll();
        List<RankingEntry> rankings = new ArrayList<>();
        
        for (User user : users) {
            Double score = calculateScore(user, type, null);
            rankings.add(new RankingEntry(user, null, type, score));
        }
        
        // Sort by score (descending) and assign positions
        rankings.sort(Comparator.comparing(RankingEntry::getScore).reversed());
        
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setPosition(i + 1);
        }
        
        return rankings;
    }

    /**
     * Gets the ranking list for a specific game and ranking type.
     *
     * @param type The type of ranking.
     * @param game The game.
     * @return List of RankingEntry objects ordered by score.
     */
    public List<RankingEntry> getRankingByGameAndType(RankingType type, Game game) {
        log.info("Calculating on-demand ranking for type: {} and game: {}", type, game.getName());
        
        List<User> users = userRepository.findAll();
        List<RankingEntry> rankings = new ArrayList<>();
        
        for (User user : users) {
            Double score = calculateScore(user, type, game);
            rankings.add(new RankingEntry(user, game, type, score));
        }
        
        // Sort by score (descending) and assign positions
        rankings.sort(Comparator.comparing(RankingEntry::getScore).reversed());
        
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setPosition(i + 1);
        }
        
        return rankings;
    }

    /**
     * Gets the rankings for a specific user.
     *
     * @param userId The user ID.
     * @return List of RankingEntry objects for the user.
     */
    public List<RankingEntry> getUserRankings(Long userId) {
        log.info("Calculating on-demand rankings for user ID: {}", userId);
        
        User user;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (Exception e) {
            log.error("Error finding user with ID {}: {}", userId, e.getMessage());
            return new ArrayList<>(); // Return empty list instead of throwing exception
        }
        
        List<RankingEntry> rankings = new ArrayList<>();
        
        // Add global rankings
        for (RankingType type : RankingType.values()) {
            if (type != RankingType.BY_GAME_WINS && type != RankingType.BY_GAME_WIN_RATE 
                && type != RankingType.BY_GAME_PROFIT && type != RankingType.BY_GAME_LOSSES) {
                try {
                    Double score = calculateScore(user, type, null);
                    RankingEntry entry = new RankingEntry(user, null, type, score);
                    
                    // Calculate position
                    List<RankingEntry> allRankings = getRankingByType(type);
                    for (int i = 0; i < allRankings.size(); i++) {
                        if (allRankings.get(i).getUser().getId().equals(user.getId())) {
                            entry.setPosition(i + 1);
                            break;
                        }
                    }
                    
                    rankings.add(entry);
                    log.debug("Added global ranking for user {}: type={}, score={}, position={}", 
                              userId, type, score, entry.getPosition());
                } catch (Exception e) {
                    log.error("Error calculating {} ranking for user {}: {}", type, userId, e.getMessage());
                    // Continue to next ranking type
                }
            }
        }
        
        // Add game-specific rankings
        List<Game> games;
        try {
            games = betRepository.findDistinctGamesByUserId(userId);
            log.info("Found {} distinct games for user {}", games.size(), userId);
        } catch (Exception e) {
            log.error("Error finding games for user {}: {}", userId, e.getMessage());
            games = new ArrayList<>(); // Empty list to safely continue
        }
        
        for (Game game : games) {
            log.debug("Processing game rankings for user {} and game {} (ID: {})", 
                      userId, game.getName(), game.getId());
            
            // BY_GAME_WINS ranking
            try {
                Double winsScore = calculateScore(user, RankingType.BY_GAME_WINS, game);
                RankingEntry winsEntry = new RankingEntry(user, game, RankingType.BY_GAME_WINS, winsScore);
                
                // Calculate position for BY_GAME_WINS
                List<RankingEntry> allWinsRankings = getRankingByGameAndType(RankingType.BY_GAME_WINS, game);
                for (int i = 0; i < allWinsRankings.size(); i++) {
                    if (allWinsRankings.get(i).getUser().getId().equals(user.getId())) {
                        winsEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(winsEntry);
                log.debug("Added BY_GAME_WINS ranking for user {} and game {}: score={}, position={}", 
                          userId, game.getName(), winsScore, winsEntry.getPosition());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_WINS ranking for user {} and game {}: {}", 
                          userId, game.getName(), e.getMessage());
            }
            
            // BY_GAME_LOSSES ranking
            try {
                Double lossesScore = calculateScore(user, RankingType.BY_GAME_LOSSES, game);
                RankingEntry lossesEntry = new RankingEntry(user, game, RankingType.BY_GAME_LOSSES, lossesScore);
                
                // Calculate position for BY_GAME_LOSSES
                List<RankingEntry> allLossesRankings = getRankingByGameAndType(RankingType.BY_GAME_LOSSES, game);
                for (int i = 0; i < allLossesRankings.size(); i++) {
                    if (allLossesRankings.get(i).getUser().getId().equals(user.getId())) {
                        lossesEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(lossesEntry);
                log.debug("Added BY_GAME_LOSSES ranking for user {} and game {}: score={}, position={}", 
                          userId, game.getName(), lossesScore, lossesEntry.getPosition());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_LOSSES ranking for user {} and game {}: {}", 
                          userId, game.getName(), e.getMessage());
            }
            
            // BY_GAME_WIN_RATE ranking
            try {
                Double winRateScore = calculateScore(user, RankingType.BY_GAME_WIN_RATE, game);
                RankingEntry winRateEntry = new RankingEntry(user, game, RankingType.BY_GAME_WIN_RATE, winRateScore);
                
                // Calculate position for BY_GAME_WIN_RATE
                List<RankingEntry> allWinRateRankings = getRankingByGameAndType(RankingType.BY_GAME_WIN_RATE, game);
                for (int i = 0; i < allWinRateRankings.size(); i++) {
                    if (allWinRateRankings.get(i).getUser().getId().equals(user.getId())) {
                        winRateEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(winRateEntry);
                log.debug("Added BY_GAME_WIN_RATE ranking for user {} and game {}: score={}, position={}", 
                          userId, game.getName(), winRateScore, winRateEntry.getPosition());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_WIN_RATE ranking for user {} and game {}: {}", 
                          userId, game.getName(), e.getMessage());
            }
            
            // BY_GAME_PROFIT ranking
            try {
                Double profitScore = calculateScore(user, RankingType.BY_GAME_PROFIT, game);
                RankingEntry profitEntry = new RankingEntry(user, game, RankingType.BY_GAME_PROFIT, profitScore);
                
                // Calculate position for BY_GAME_PROFIT
                List<RankingEntry> allProfitRankings = getRankingByGameAndType(RankingType.BY_GAME_PROFIT, game);
                for (int i = 0; i < allProfitRankings.size(); i++) {
                    if (allProfitRankings.get(i).getUser().getId().equals(user.getId())) {
                        profitEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(profitEntry);
                log.debug("Added BY_GAME_PROFIT ranking for user {} and game {}: score={}, position={}", 
                          userId, game.getName(), profitScore, profitEntry.getPosition());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_PROFIT ranking for user {} and game {}: {}", 
                          userId, game.getName(), e.getMessage());
            }
        }
        
        log.info("Returning {} rankings for user {}", rankings.size(), userId);
        return rankings;
    }

    /**
     * Calculates the score for a given user, ranking type, and optionally game.
     *
     * @param user The user.
     * @param type The ranking type.
     * @param game The game (optional).
     * @return The calculated score.
     */
    private Double calculateScore(User user, RankingType type, Game game) {
        switch (type) {
            case OVERALL_PROFIT:
                // Returns Double or 0.0 - SAFE
                return betRepository.calculateTotalProfitForUser(user.getId());

            case TOP_LOSERS:
                // Negate the profit to rank users with most negative profit first
                Double negativeProfit = betRepository.calculateTotalProfitForUser(user.getId());
                return negativeProfit != null ? -negativeProfit : 0.0;

            case TOTAL_BETS_AMOUNT:
                // Returns Double or 0.0 - SAFE
                return betRepository.calculateTotalBetAmountForUser(user.getId());

            case BY_GAME_WINS:
                if (game == null || game.getId() == null) { // Added null check for game.getId() just in case
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_WINS ranking type");
                }
                // Returns Long or 0L - repo method returns Long
                Long wins = betRepository.countWinsByUserAndGame(user.getId(), game.getId());
                // Implicit conversion from Long to Double might happen here,
                // but explicitly converting is safer:
                return wins != null ? wins.doubleValue() : 0.0; // <--- SUGGESTED CHANGE

            case BY_GAME_LOSSES:
                if (game == null || game.getId() == null) {
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_LOSSES ranking type");
                }
                // Calculate the total money lost (negative profit becomes positive loss)
                Double lossProfit = betRepository.calculateTotalProfitForUserAndGame(user.getId(), game.getId());
                // If profit is negative, it's a loss, so return the absolute value
                // If profit is positive or zero, return 0 (no losses)
                return (lossProfit != null && lossProfit < 0) ? Math.abs(lossProfit) : 0.0;

            case WIN_RATE:
                // Returns Double (0.0 to 1.0) or 0.0 - SAFE
                Double winRate = betRepository.calculateWinRateForUser(user.getId());
                return winRate != null ? winRate * 100 : 0.0; // Convert to percentage

            case BY_GAME_WIN_RATE:
                if (game == null || game.getId() == null) { // Added null check for game.getId() just in case
                   throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_WIN_RATE ranking type");
                }
                // Returns Double (0.0 to 1.0) or 0.0 - SAFE
                Double gameWinRate = betRepository.calculateWinRateForUserAndGame(user.getId(), game.getId());
                return gameWinRate != null ? gameWinRate * 100 : 0.0; // Convert to percentage
                
            case BY_GAME_PROFIT:
                if (game == null || game.getId() == null) {
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_PROFIT ranking type");
                }
                // Returns Double or 0.0 - SAFE
                Double gameProfit = betRepository.calculateTotalProfitForUserAndGame(user.getId(), game.getId());
                return gameProfit != null ? gameProfit : 0.0;

            default:
                log.error("Unsupported RankingType encountered: {}", type);
                throw new IllegalArgumentException("Unsupported ranking type: " + type);
        }
    }
}
