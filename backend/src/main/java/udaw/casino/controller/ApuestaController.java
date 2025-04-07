package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Apuesta;
import udaw.casino.service.ApuestaService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


// DTO for creating a bet (Recommended)
/*
class CreateApuestaRequest {
    private Long usuarioId;
    private Long juegoId;
    private double cantidad;
    private String tipo; // e.g., "numero", "color"
    private String valorApostado; // e.g., "17", "rojo"
    // Getters and Setters...
}
*/

@RestController
@RequestMapping("/api/apuestas") // Base path for bets
public class ApuestaController {

    private final ApuestaService apuestaService;

    @Autowired
    public ApuestaController(ApuestaService apuestaService) {
        this.apuestaService = apuestaService;
    }

    // POST /api/apuestas/crear is less RESTful than POST /api/apuestas
    // The creation logic is now typically handled within specific game endpoints (like /juegos/ruleta/jugar)
    // This endpoint might be removed or repurposed if bets are only created via game actions.
    /*
    @PostMapping("/crear") // Consider removing if bets are only created via game endpoints
    public ResponseEntity<?> crearApuesta(@RequestBody Apuesta apuesta) { // Use DTO (CreateApuestaRequest)
        try {
            // Need to set User and Juego based on IDs from DTO before calling service
            // Apuesta apuestaCreada = apuestaService.crearApuesta(apuesta);
            // return new ResponseEntity<>(apuestaCreada, HttpStatus.CREATED);
             return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body("Use game-specific endpoints to create bets.");
        } catch (SaldoInsuficienteException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(e.getMessage());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating bet.");
        }
    }
    */

    // GET /api/apuestas/{id} - Get a specific bet by ID
    @GetMapping("/{id}")
    public ResponseEntity<Apuesta> obtenerApuestaPorId(@PathVariable Long id) {
        try {
            Apuesta apuesta = apuestaService.obtenerApuestaPorId(id);
             // Clean sensitive data before returning
            if (apuesta.getUsuario() != null) apuesta.getUsuario().setPassword(null);
            return ResponseEntity.ok(apuesta);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/apuestas/usuario/{usuarioId} - Get all bets for a user
    @GetMapping("/usuario/{usuarioId}")
    // Add Security: Check if authenticated user matches usuarioId or is Admin
    public ResponseEntity<List<Apuesta>> obtenerApuestasPorUsuario(@PathVariable Long usuarioId) {
        try {
            // Service already checks if user exists
            List<Apuesta> apuestas = apuestaService.obtenerApuestasPorUsuario(usuarioId);
            // Clean sensitive data
            apuestas.forEach(a -> { if (a.getUsuario() != null) a.getUsuario().setPassword(null); });
            return ResponseEntity.ok(apuestas);
        } catch (ResourceNotFoundException e) {
             // This happens if the user specified by usuarioId doesn't exist
             return ResponseEntity.notFound().build();
        }
    }

    // GET /api/apuestas/juego/{juegoId} - Get all bets for a game
    @GetMapping("/juego/{juegoId}")
    // Add Security: Allow for authenticated users
    public ResponseEntity<List<Apuesta>> obtenerApuestasPorJuego(@PathVariable Long juegoId) {
        // Consider adding check if game exists via JuegoService first
        List<Apuesta> apuestas = apuestaService.obtenerApuestasPorJuego(juegoId);
         // Clean sensitive data
        apuestas.forEach(a -> { if (a.getUsuario() != null) a.getUsuario().setPassword(null); });
        return ResponseEntity.ok(apuestas);
    }


    // PUT /api/apuestas/resolver/{id} - Endpoint to manually resolve a bet (if needed, maybe admin only)
    // The primary resolution path is now internal via RuletaService -> ApuestaService.resolverApuesta
    // This endpoint might be removed or secured for admin use cases.
    /*
    @PutMapping("/resolver/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resolverApuesta(@PathVariable Long id, @RequestParam boolean gano) {
        try {
            Apuesta apuestaResuelta = apuestaService.resolverApuesta(id, gano);
             if (apuestaResuelta.getUsuario() != null) apuestaResuelta.getUsuario().setPassword(null);
            return ResponseEntity.ok(apuestaResuelta);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
             // Log error
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error resolving bet.");
        }
    }
    */
}