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


/**
 * Service for calculating user rankings on-demand without persistent storage.
 * Provides functionality to calculate various types of rankings:
 * - Global rankings (across all games)
 * - Game-specific rankings
 * - Individual user rankings
 * 
 * Rankings are calculated based on different metrics:
 * - Total amount bet
 * - Win rate
 * - Total profit/losses
 * - Game-specific statistics
 */
@Service
public class RankingCalculationService {

    private final BetRepository betRepository;
    private final UserRepository userRepository;

    public RankingCalculationService(BetRepository betRepository, UserRepository userRepository) {
        this.betRepository = betRepository;
        this.userRepository = userRepository;
    }

    /**
     * Represents a single entry in a ranking list.
     * Contains user information, game context (if applicable),
     * ranking type, calculated score, and position in the ranking.
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
     * Calculates global rankings for a specific ranking type.
     * Global rankings are calculated across all users and games.
     * 
     * @param type The type of ranking to calculate
     * @return List of RankingEntry objects sorted by score in descending order
     */
    public List<RankingEntry> getRankingByType(RankingType type) {

        // Validate ranking type
        if (type == RankingType.BY_GAME_AMOUNT || type == RankingType.BY_GAME_WIN_RATE || 
            type == RankingType.BY_GAME_PROFIT || type == RankingType.BY_GAME_LOSSES) {
            return new ArrayList<>();
        }
        
        // Calculate scores for all users
        List<User> users = userRepository.findAll();
        List<RankingEntry> rankings = new ArrayList<>();
        
        for (User user : users) {
            Double score = calculateScore(user, type, null);
            rankings.add(new RankingEntry(user, null, type, score));
        }
        
        // Sort and assign positions
        rankings.sort(Comparator.comparing(RankingEntry::getScore).reversed());
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setPosition(i + 1);
        }
        
        return rankings;
    }

    /**
     * Calculates game-specific rankings for a particular game and ranking type.
     * 
     * @param type The type of ranking to calculate
     * @param game The game to calculate rankings for
     * @return List of RankingEntry objects sorted by score in descending order
     */
    public List<RankingEntry> getRankingByGameAndType(RankingType type, Game game) {
        List<User> users = userRepository.findAll();
        List<RankingEntry> rankings = new ArrayList<>();
        
        // Calculate scores for all users in the specific game
        for (User user : users) {
            Double score = calculateScore(user, type, game);
            rankings.add(new RankingEntry(user, game, type, score));
        }
        
        // Sort and assign positions
        rankings.sort(Comparator.comparing(RankingEntry::getScore).reversed());
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setPosition(i + 1);
        }
        
        return rankings;
    }

    /**
     * Calculates all rankings for a specific user.
     * Includes both global and game-specific rankings.
     * 
     * @param userId The ID of the user to calculate rankings for
     * @return List of RankingEntry objects containing all rankings for the user
     */
    public List<RankingEntry> getUserRankings(Long userId) {
        // Find user
        User user;
        try {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (Exception e) {
            return new ArrayList<>();
        }
        
        List<RankingEntry> rankings = new ArrayList<>();
        
        // Calculate global rankings
        for (RankingType type : RankingType.values()) {
            if (type != RankingType.BY_GAME_AMOUNT && type != RankingType.BY_GAME_WIN_RATE 
                && type != RankingType.BY_GAME_PROFIT && type != RankingType.BY_GAME_LOSSES) {
                try {
                    Double score = calculateScore(user, type, null);
                    RankingEntry entry = new RankingEntry(user, null, type, score);
                    
                    // Calculate position in global ranking
                    List<RankingEntry> fullRanking = getRankingByType(type);
                    for (int i = 0; i < fullRanking.size(); i++) {
                        if (fullRanking.get(i).getUser().getId().equals(user.getId())) {
                            entry.setPosition(i + 1);
                            break;
                        }
                    }
                    
                    rankings.add(entry);
                } catch (Exception e) {
                    // Exception handling without logging
                }
            }
        }
        
        // Calculate game-specific rankings
        List<Game> games;
        try {
            games = betRepository.findDistinctGamesByUserId(userId);
        } catch (Exception e) {
            games = new ArrayList<>();
        }
        
        // Calculate rankings for each game
        for (Game game : games) {
            // Calculate BY_GAME_AMOUNT ranking
            try {
                Double winsScore = calculateScore(user, RankingType.BY_GAME_AMOUNT, game);
                RankingEntry winsEntry = new RankingEntry(user, game, RankingType.BY_GAME_AMOUNT, winsScore);
                
                // Calculate position
                List<RankingEntry> allWinsRankings = getRankingByGameAndType(RankingType.BY_GAME_AMOUNT, game);
                for (int i = 0; i < allWinsRankings.size(); i++) {
                    if (allWinsRankings.get(i).getUser().getId().equals(user.getId())) {
                        winsEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(winsEntry);
            } catch (Exception e) {
                // Exception handling without logging
            }
            
            // Calculate BY_GAME_LOSSES ranking
            try {
                Double lossesScore = calculateScore(user, RankingType.BY_GAME_LOSSES, game);
                RankingEntry lossesEntry = new RankingEntry(user, game, RankingType.BY_GAME_LOSSES, lossesScore);
                
                // Calculate position
                List<RankingEntry> allLossesRankings = getRankingByGameAndType(RankingType.BY_GAME_LOSSES, game);
                for (int i = 0; i < allLossesRankings.size(); i++) {
                    if (allLossesRankings.get(i).getUser().getId().equals(user.getId())) {
                        lossesEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(lossesEntry);
            } catch (Exception e) {
                // Exception handling without logging
            }
            
            // Calculate BY_GAME_WIN_RATE ranking
            try {
                Double winRateScore = calculateScore(user, RankingType.BY_GAME_WIN_RATE, game);
                RankingEntry winRateEntry = new RankingEntry(user, game, RankingType.BY_GAME_WIN_RATE, winRateScore);
                
                // Calculate position
                List<RankingEntry> allWinRateRankings = getRankingByGameAndType(RankingType.BY_GAME_WIN_RATE, game);
                for (int i = 0; i < allWinRateRankings.size(); i++) {
                    if (allWinRateRankings.get(i).getUser().getId().equals(user.getId())) {
                        winRateEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(winRateEntry);
            } catch (Exception e) {
                // Exception handling without logging
            }
            
            // Calculate BY_GAME_PROFIT ranking
            try {
                Double profitScore = calculateScore(user, RankingType.BY_GAME_PROFIT, game);
                RankingEntry profitEntry = new RankingEntry(user, game, RankingType.BY_GAME_PROFIT, profitScore);
                
                // Calculate position
                List<RankingEntry> allProfitRankings = getRankingByGameAndType(RankingType.BY_GAME_PROFIT, game);
                for (int i = 0; i < allProfitRankings.size(); i++) {
                    if (allProfitRankings.get(i).getUser().getId().equals(user.getId())) {
                        profitEntry.setPosition(i + 1);
                        break;
                    }
                }
                rankings.add(profitEntry);
            } catch (Exception e) {
                // Exception handling without logging
            }
        }
        
        return rankings;
    }

    /**
     * Calculates the score for a user based on the ranking type and game context.
     * 
     * @param user The user to calculate the score for
     * @param type The type of ranking to calculate
     * @param game The game context (null for global rankings)
     * @return The calculated score
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

            case BY_GAME_AMOUNT:
                if (game == null || game.getId() == null) { // Added null check for game.getId() just in case
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_AMOUNT ranking type");
                }
                // Calculate total amount bet for specific game - returns Double or 0.0
                return betRepository.calculateTotalBetAmountForUserAndGame(user.getId(), game.getId());

            case BY_GAME_LOSSES:
                if (game == null || game.getId() == null) {
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_LOSSES ranking type");
                }
                // Calculate the total money lost (negative profit becomes positive loss)
                Double lossProfit = betRepository.calculateTotalProfitForUserAndGame(user.getId(), game.getId());
                // If profit is negative, it's a loss, so return the absolute value
                return lossProfit != null ? -lossProfit : 0.0;

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
                throw new IllegalArgumentException("Unsupported ranking type: " + type);
        }
    }
}