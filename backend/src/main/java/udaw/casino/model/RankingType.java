package udaw.casino.model;

/**
 * Enum representing different types of rankings for users in the casino system.
 * This can be used to categorize and sort users based on various criteria.
 */
public enum RankingType {
    BY_GAME_WINS,      // Ranking based on wins within a specific game
    TOTAL_BETS_AMOUNT, // Ranking based on the total amount of money bet
    OVERALL_PROFIT,    // Ranking based on the highest net profit across all games
    WIN_RATE,          // Ranking based on win percentage (wins/total bets)
    BY_GAME_WIN_RATE   // Ranking based on win percentage for a specific game
    // Add more specific types as needed, e.g., BY_GAME_PROFIT
}