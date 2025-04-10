package udaw.casino.controller;

import udaw.casino.dto.ApuestaDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.service.RuletaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.AllArgsConstructor; 
import lombok.Data; 

@RestController
@RequestMapping("/api/juegos/ruleta") 
@AllArgsConstructor 
public class RuletaController {

    private final RuletaService ruletaService;

    /*
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
    public ResponseEntity<?> jugarRuleta(
            @RequestParam Long usuarioId,
            @RequestParam double cantidad,
            @RequestParam String tipoApuesta,
            @RequestParam String valorApuesta,
            @RequestParam int numeroGanador
            ) {


        try {
            // *** UPDATED service call to include numeroGanador ***
            Apuesta apuestaResuelta = ruletaService.jugarRuleta(usuarioId, cantidad, tipoApuesta, valorApuesta, numeroGanador);

            ApuestaDTO apuestaDTO = new ApuestaDTO(apuestaResuelta);
            // 

            // Create the response object
            RuletaResponse response = new RuletaResponse();
            response.setResolvedBet(apuestaDTO);
            // *** SET the winning number from the REQUEST PARAMETER ***
            response.setWinningNumber(numeroGanador);

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

}