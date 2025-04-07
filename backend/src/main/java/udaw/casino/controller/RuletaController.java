package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.service.RuletaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


// DTO for Roulette bet request (Recommended)
/*
class RuletaBetRequest {
    private double cantidad;
    private String tipoApuesta; // e.g., "numero", "color"
    private String valorApuesta; // e.g., "17", "rojo"
    // Getters and Setters...
}
*/

@RestController
@RequestMapping("/api/juegos/ruleta") // More specific path for the game
public class RuletaController {

    private final RuletaService ruletaService;

    @Autowired
    public RuletaController(RuletaService ruletaService) {
        this.ruletaService = ruletaService;
    }

    /**
     * Endpoint to place a bet and play a round of Roulette.
     * Requires authenticated user context (handled by Spring Security later).
     *
     * @param cantidad     The amount to bet.
     * @param tipoApuesta  The type of bet (e.g., "numero", "color").
     * @param valorApuesta The value being bet on (e.g., "17", "rojo").
     * @return ResponseEntity containing the resolved Apuesta or an error message.
     */
    @PostMapping("/jugar")
    // @AuthenticationPrincipal UserDetails userDetails // Inject authenticated user details later
    public ResponseEntity<?> jugarRuleta(
            // Ideally get userId from authenticated principal, not request param
            @RequestParam Long usuarioId, // Replace with principal.getId() later
            @RequestParam double cantidad,
            @RequestParam String tipoApuesta,
            @RequestParam String valorApuesta) {
            // Consider using @RequestBody with a DTO (like RuletaBetRequest) instead of multiple @RequestParams

        // Long userId = ((MyUserDetails) userDetails).getId(); // Example getting ID from principal

        if (cantidad <= 0) {
             return ResponseEntity.badRequest().body("Bet amount must be positive.");
        }

        try {
            Apuesta apuestaResuelta = ruletaService.jugarRuleta(usuarioId, cantidad, tipoApuesta, valorApuesta);
            // Avoid returning sensitive user data within the Apuesta response if not needed
            if (apuestaResuelta.getUsuario() != null) {
                apuestaResuelta.getUsuario().setPassword(null);
            }
            return ResponseEntity.ok(apuestaResuelta);
        } catch (SaldoInsuficienteException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(e.getMessage()); // 402 Payment Required is suitable
        } catch (ResourceNotFoundException e) {
            // Could be User not found or Roulette Game not found in DB
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
             // e.g., invalid bet type from service layer
             return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Log the exception
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while playing Roulette.");
        }
    }
}