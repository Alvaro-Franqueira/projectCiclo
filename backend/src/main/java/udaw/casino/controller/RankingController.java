package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Juego;
import udaw.casino.model.Ranking;
import udaw.casino.model.RankingType;
import udaw.casino.service.JuegoService;
import udaw.casino.service.RankingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rankings") // Base path for ranking related endpoints
public class RankingController {

    private final RankingService rankingService;
    private final JuegoService juegoService; // Inject JuegoService

    @Autowired
    public RankingController(RankingService rankingService, JuegoService juegoService) {
        this.rankingService = rankingService;
        this.juegoService = juegoService;
    }

    /**
     * Gets the global ranking list for a specific type (e.g., OVERALL_PROFIT, TOTAL_BETS_AMOUNT).
     *
     * @param tipo The type of ranking (Spring converts String to RankingType enum).
     * @return ResponseEntity containing the list of Ranking objects or an error.
     */
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<Ranking>> obtenerRankingGlobalPorTipo(@PathVariable("tipo") RankingType tipo) {
        // Basic validation: Ensure the type is not game-specific if called without a game context
        if (tipo == RankingType.BY_GAME_WINS) {
             // Or return a more specific error/message
             return ResponseEntity.badRequest().build(); // Indicate this endpoint isn't for game-specific types alone
        }
        List<Ranking> rankings = rankingService.obtenerRankingPorTipo(tipo);
        return ResponseEntity.ok(rankings);
    }

    /**
     * Gets the ranking list for a specific game and ranking type.
     *
     * @param juegoId The ID of the game.
     * @param tipo    The type of ranking (e.g., BY_GAME_WINS).
     * @return ResponseEntity containing the list of Ranking objects or an error.
     */
    @GetMapping("/juego/{juegoId}/tipo/{tipo}")
    public ResponseEntity<List<Ranking>> obtenerRankingPorJuegoYTipo(
            @PathVariable Long juegoId,
            @PathVariable RankingType tipo) {
        try {
            // Fetch the game entity first
            Juego juego = juegoService.obtenerJuegoPorId(juegoId);
            List<Ranking> rankings = rankingService.obtenerRankingPorJuegoYTipo(tipo, juego);
            return ResponseEntity.ok(rankings);
        } catch (ResourceNotFoundException e) {
            // Handle case where game is not found
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            // Handle other errors like invalid type for game ranking
            return ResponseEntity.badRequest().body(null); // Or return error message
        }
    }

    // Note: There's usually no direct POST/PUT/DELETE for Rankings via API.
    // Rankings are typically updated internally by the system based on game events.
    // If manual adjustment were needed, it would likely be an admin function.

}