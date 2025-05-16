package udaw.casino.model;

/**
 * Enum representing different types of rankings for users in the casino system.
 * This can be used to categorize and sort users based on various criteria.
 */
public enum RankingType {
         
    TOTAL_BETS_AMOUNT, // Ranking based on the total amount of money bet
    OVERALL_PROFIT,    // Ranking based on the highest net profit across all games
    WIN_RATE,          // Ranking based on the percentage of wins to total bets
    TOP_LOSERS,        // Ranking based on the highest losses
    BY_GAME_AMOUNT,    // Ranking based on the total amount wagered in a specific game
    BY_GAME_WIN_RATE,   // Ranking based on win percentage for a specific game
    BY_GAME_PROFIT,    // Ranking based on profit for a specific game
    BY_GAME_LOSSES     // Ranking based on most losses for a specific game
}