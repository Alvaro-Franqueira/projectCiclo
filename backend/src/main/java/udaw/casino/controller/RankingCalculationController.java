package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Juego;
import udaw.casino.model.RankingType;
import udaw.casino.service.JuegoService;
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

@RestController
@RequestMapping("/api/rankings/v2") // New API version for calculated rankings
public class RankingCalculationController {

    private final RankingCalculationService rankingCalculationService;
    private final JuegoService juegoService;

    public RankingCalculationController(RankingCalculationService rankingCalculationService, JuegoService juegoService) {
        this.rankingCalculationService = rankingCalculationService;
        this.juegoService = juegoService;
    }

    /**
     * Gets all rankings (for all types).
     *
     * @return ResponseEntity containing a map with all ranking types and their entries.
     */
    @GetMapping
    public ResponseEntity<Map<String, List<RankingEntry>>> obtenerTodosLosRankings() {
        Map<String, List<RankingEntry>> allRankings = new HashMap<>();
        
        // Get global rankings for each type
        for (RankingType tipo : RankingType.values()) {
            if (tipo != RankingType.BY_GAME_WINS && tipo != RankingType.BY_GAME_WIN_RATE) { // Skip game-specific rankings
                List<RankingEntry> rankings = rankingCalculationService.obtenerRankingPorTipo(tipo);
                allRankings.put(tipo.name(), rankings);
            }
        }
        
        return ResponseEntity.ok(allRankings);
    }

    /**
     * Gets the global ranking list for a specific type (e.g., OVERALL_PROFIT, TOTAL_BETS_AMOUNT).
     *
     * @param tipo The type of ranking.
     * @return ResponseEntity containing the list of RankingEntry objects or an error.
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<RankingEntry>> obtenerRankingGlobalPorTipo(@PathVariable("tipo") RankingType tipo) {
        // Basic validation: Ensure the type is not game-specific if called without a game context
        if (tipo == RankingType.BY_GAME_WINS) {
            return ResponseEntity.badRequest().build(); // Indicate this endpoint isn't for game-specific types alone
        }
        List<RankingEntry> rankings = rankingCalculationService.obtenerRankingPorTipo(tipo);
        return ResponseEntity.ok(rankings);
    }

    /**
     * Gets the ranking list for a specific game and ranking type.
     *
     * @param juegoId The ID of the game.
     * @param tipo    The type of ranking (e.g., BY_GAME_WINS).
     * @return ResponseEntity containing the list of RankingEntry objects or an error.
     */
    @GetMapping("/juego/{juegoId}/tipo/{tipo}")
    public ResponseEntity<List<RankingEntry>> obtenerRankingPorJuegoYTipo(
            @PathVariable Long juegoId,
            @PathVariable RankingType tipo) {
        try {
            // Fetch the game entity first
            Juego juego = juegoService.obtenerJuegoPorId(juegoId);
            List<RankingEntry> rankings = rankingCalculationService.obtenerRankingPorJuegoYTipo(tipo, juego);
            return ResponseEntity.ok(rankings);
        } catch (ResourceNotFoundException e) {
            // Handle case where game is not found
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            // Handle other errors like invalid type for game ranking
            return ResponseEntity.badRequest().body(null); // Or return error message
        }
    }

    /**
     * Gets all rankings for a specific user.
     *
     * @param usuarioId The ID of the user.
     * @return ResponseEntity containing the list of RankingEntry objects or an error.
     */
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<RankingEntry>> obtenerRankingsDeUsuario(@PathVariable Long usuarioId) {
        try {
            List<RankingEntry> rankings = rankingCalculationService.obtenerRankingsDelUsuario(usuarioId);
            return ResponseEntity.ok(rankings);
        } catch (Exception e) {
            e.printStackTrace(); // or use a logger
            return ResponseEntity.status(500).body(null); // or return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
