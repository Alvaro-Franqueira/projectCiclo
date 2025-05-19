package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Game;
import udaw.casino.model.RankingType;
import udaw.casino.service.GameService;
import udaw.casino.service.RankingCalculationService;
import udaw.casino.service.RankingCalculationService.RankingEntry;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Controller for managing ranking calculations in the casino system.
 * Provides endpoints for retrieving various types of rankings, including global and game-specific rankings.
 */
@RestController
@RequestMapping("/api/rankings/v2") // New API version for calculated rankings
public class RankingCalculationController {

    private final RankingCalculationService rankingCalculationService;
    private final GameService gameService;

    public RankingCalculationController(RankingCalculationService rankingCalculationService, GameService gameService) {
        this.rankingCalculationService = rankingCalculationService;
        this.gameService = gameService;
    }

    /**
     * Gets all rankings (for all types).
     *
     * @return ResponseEntity containing a map with all ranking types and their entries.
     */
    @GetMapping
    public ResponseEntity<Map<String, List<RankingEntry>>> getAllRankings() {
        Map<String, List<RankingEntry>> allRankings = new HashMap<>();
        
        // Get global rankings for each type
        for (RankingType type : RankingType.values()) {
            if (type != RankingType.BY_GAME_AMOUNT && type != RankingType.BY_GAME_WIN_RATE 
                && type != RankingType.BY_GAME_PROFIT && type != RankingType.BY_GAME_LOSSES) { // Skip game-specific rankings
                List<RankingEntry> rankings = rankingCalculationService.getRankingByType(type);
                allRankings.put(type.name(), rankings);
            }
        }
        
        return ResponseEntity.ok(allRankings);
    }

    /**
     * Gets the global ranking list for a specific type (e.g., OVERALL_PROFIT, TOTAL_BETS_AMOUNT).
     *
     * @param type The type of ranking.
     * @return ResponseEntity containing the list of RankingEntry objects or an error.
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<RankingEntry>> getGlobalRankingByType(@PathVariable("type") RankingType type) {
        // Basic validation: Ensure the type is not game-specific if called without a game context
        if (type == RankingType.BY_GAME_AMOUNT || type == RankingType.BY_GAME_WIN_RATE 
            || type == RankingType.BY_GAME_PROFIT || type == RankingType.BY_GAME_LOSSES) {
            return ResponseEntity.badRequest().build(); // Indicate this endpoint isn't for game-specific types alone
        }
        
        // Process the ranking based on type
        try {
            List<RankingEntry> rankings = rankingCalculationService.getRankingByType(type);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            e.printStackTrace(); // or use a logger
            // Return 200 OK with empty list instead of error status to prevent frontend crashes
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Gets the ranking list for a specific game and ranking type.
     *
     * @param gameId The ID of the game.
     * @param type    The type of ranking (e.g., BY_GAME_AMOUNT).
     * @return ResponseEntity containing the list of RankingEntry objects or an error.
     */
    @GetMapping("/game/{gameId}/type/{type}")
    public ResponseEntity<List<RankingEntry>> getRankingByGameAndType(
            @PathVariable Long gameId,
            @PathVariable RankingType type) {
        try {
            // Fetch the game entity first
            Game game = gameService.getGameById(gameId);
            
            // Explicitly log the request for debugging
            System.out.println("Processing ranking request for game ID: " + gameId + ", type: " + type);
            
            // Get the rankings
            List<RankingEntry> rankings = rankingCalculationService.getRankingByGameAndType(type, game);
            return ResponseEntity.ok(rankings);
        } catch (ResourceNotFoundException e) {
            // Handle case where game is not found
            System.out.println("Game not found for ID: " + gameId);
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            // Handle other errors like invalid type for game ranking
            System.out.println("Invalid argument for game ID: " + gameId + ", type: " + type + " - " + e.getMessage());
            return ResponseEntity.badRequest().body(null); // Or return error message
        } catch (Exception e) {
            // Catch all other exceptions to prevent 500 errors
            System.out.println("Error processing ranking for game ID: " + gameId + ", type: " + type);
            e.printStackTrace();
            // Return empty list with 200 OK instead of error
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Gets all rankings for a specific user.
     *
     * @param userId The ID of the user.
     * @return ResponseEntity containing the list of RankingEntry objects or an error.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RankingEntry>> getUserRankings(@PathVariable Long userId) {
        try {
            List<RankingEntry> rankings = rankingCalculationService.getUserRankings(userId);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            e.printStackTrace(); // or use a logger
            // Return 200 OK with empty list instead of error status to prevent frontend crashes
            return ResponseEntity.ok(List.of());
        }
    }
}
