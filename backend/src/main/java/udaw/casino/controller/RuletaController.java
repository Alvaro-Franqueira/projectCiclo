package udaw.casino.controller;

import udaw.casino.dto.ApuestaDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
// import udaw.casino.model.Usuario; // No longer needed directly here
import udaw.casino.service.RuletaService;
// import udaw.casino.service.UsuarioService; // No longer needed directly here
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.AllArgsConstructor; // Use Lombok for constructor injection
import lombok.Data; // Use Lombok for RuletaResponse getters/setters

/* // Original DTO comment - can be removed or kept for reference
class RuletaBetRequest {
    private double cantidad;
    private String tipoApuesta; // e.g., "numero", "color"
    private String valorApuesta; // e.g., "17", "rojo"
    // Getters and Setters...
}
*/

@RestController
@RequestMapping("/api/juegos/ruleta") // More specific path for the game
@AllArgsConstructor // Lombok annotation for constructor injection
public class RuletaController {

    private final RuletaService ruletaService;
    // private final UsuarioService usuarioService; // Service is called within RuletaService now

    // Constructor injected by Lombok's @AllArgsConstructor
    // public RuletaController(RuletaService ruletaService, UsuarioService usuarioService) {
    //     this.ruletaService = ruletaService;
    //     this.usuarioService = usuarioService;
    // }

    /**
     * Endpoint to place a bet and play a round of Roulette, using a winning number from the client.
     * Requires authenticated user context (handled by Spring Security later).
     *
     * @param usuarioId      The ID of the user placing the bet.
     * @param cantidad       The amount to bet.
     * @param tipoApuesta    The type of bet (e.g., "numero", "color").
     * @param valorApuesta   The value being bet on (e.g., "17", "rojo").
     * @param numeroGanador  The winning number (0-36) provided by the frontend client.
     * @return ResponseEntity containing the winning number and the resolved ApuestaDTO, or an error message.
     */
    @PostMapping("/jugar")
    // @AuthenticationPrincipal UserDetails userDetails // Inject authenticated user details later
    public ResponseEntity<?> jugarRuleta(
            // Ideally get userId from authenticated principal, not request param
            @RequestParam Long usuarioId, // Replace with principal.getId() later
            @RequestParam double cantidad,
            @RequestParam String tipoApuesta,
            @RequestParam String valorApuesta,
            @RequestParam int numeroGanador // *** ADDED parameter from frontend request ***
            ) {
        // Consider using @RequestBody with a DTO for cleaner parameter handling in the future

        // Long userId = ((MyUserDetails) userDetails).getId(); // Example getting ID from principal

        if (cantidad <= 0) {
             return ResponseEntity.badRequest().body("La cantidad de la apuesta debe ser positiva.");
        }

        // Basic validation for numeroGanador can also happen here, though service layer is better
        if (numeroGanador < 0 || numeroGanador > 36) {
             return ResponseEntity.badRequest().body("Número ganador inválido: " + numeroGanador + ". Debe estar entre 0 y 36.");
        }


        try {
            // *** UPDATED service call to include numeroGanador ***
            Apuesta apuestaResuelta = ruletaService.jugarRuleta(usuarioId, cantidad, tipoApuesta, valorApuesta, numeroGanador);

            // Create DTO to represent the bet result (avoids circular refs if Apuesta has complex relations)
            // If ApuestaDTO doesn't include user balance, the frontend calculation might be slightly off
            // until the next balance fetch. Consider adding relevant fields to ApuestaDTO if needed.
            ApuestaDTO apuestaDTO = new ApuestaDTO(apuestaResuelta);

            // No need to fetch Usuario again here, balance update is handled within ApuestaService/resolverApuesta
            // Usuario usuario = usuarioService.obtenerUsuarioPorId(usuarioId); // REMOVED

            // Create the response object
            RuletaResponse response = new RuletaResponse();
            response.setResolvedBet(apuestaDTO);
            // *** SET the winning number from the REQUEST PARAMETER ***
            response.setWinningNumber(numeroGanador);

            // *** REMOVED local random number generation ***
            // int winningNumberLocal = determineWinningNumber(apuestaResuelta); // REMOVED
            // response.setWinningNumber(winningNumberLocal); // REMOVED


            return ResponseEntity.ok(response); // Return 200 OK with response body

        } catch (SaldoInsuficienteException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(e.getMessage()); // 402 Payment Required
        } catch (ResourceNotFoundException e) {
            // Could be User not found or Roulette Game not found
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage()); // 404 Not Found
        } catch (IllegalArgumentException e) {
             // Catching potential IllegalArgumentException from service (e.g., invalid numeroGanador range, invalid bet type)
             return ResponseEntity.badRequest().body(e.getMessage()); // 400 Bad Request
        } catch (Exception e) {
             // Log the exception for internal review
             // logger.error("Unexpected error during /jugar request", e); // Add proper logging
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ocurrió un error inesperado al procesar la apuesta."); // 500 Internal Server Error
        }
    }

    // Helper class for the response (Using Lombok @Data for brevity)
    @Data // Generates getters, setters, toString, equals, hashCode
    private static class RuletaResponse {
        private int winningNumber; // The number used to resolve the bet (came from frontend)
        private ApuestaDTO resolvedBet; // Details of the processed bet
    }

    // *** REMOVED local helper method - No longer needed ***
    /*
    private int determineWinningNumber(Apuesta apuesta) {
        // ... (implementation removed) ...
    }
    */
}