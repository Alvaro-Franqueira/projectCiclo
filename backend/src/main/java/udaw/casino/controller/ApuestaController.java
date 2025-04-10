package udaw.casino.controller;

import udaw.casino.dto.ApuestaDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Apuesta;
import udaw.casino.service.ApuestaService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/apuestas") // Base path for bets
public class ApuestaController {

    @Autowired
    private final ApuestaService apuestaService;

    public ApuestaController(ApuestaService apuestaService) {
        this.apuestaService = apuestaService;
    }

    // GET /api/apuestas/{id} - Get a specific bet by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApuestaDTO> obtenerApuestaPorId(@PathVariable Long id) {
        try {
            Apuesta apuesta = apuestaService.obtenerApuestaPorId(id);
            return ResponseEntity.ok(new ApuestaDTO(apuesta));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/apuestas/usuario/{usuarioId} - Get all bets for a user
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Apuesta>> obtenerApuestasPorUsuario(@PathVariable Long usuarioId) {
        try {
            // Service already checks if user exists
            List<Apuesta> apuestas = apuestaService.obtenerApuestasPorUsuario(usuarioId);
            return ResponseEntity.ok(apuestas);
        } catch (ResourceNotFoundException e) {
             // This happens if the user specified by usuarioId doesn't exist
             return ResponseEntity.notFound().build();
        }
    }

    // GET /api/apuestas/juego/{juegoId} - Get all bets for a game
    @GetMapping("/juego/{juegoId}")
    public ResponseEntity<List<Apuesta>> obtenerApuestasPorJuego(@PathVariable Long juegoId) {
        // Consider adding check if game exists via JuegoService first
        List<Apuesta> apuestas = apuestaService.obtenerApuestasPorJuego(juegoId);
        return ResponseEntity.ok(apuestas);
    }

    // GET /api/apuestas/usuario/{usuarioId}/juego/{juegoId} - Get all bets for a user in a specific game
    @GetMapping("/usuario/{usuarioId}/juego/{juegoId}")
    public ResponseEntity<List<Apuesta>> obtenerApuestasPorUsuarioYJuego(
            @PathVariable Long usuarioId, 
            @PathVariable Long juegoId) {
        try {
            List<Apuesta> apuestas = apuestaService.obtenerApuestasPorUsuarioYJuego(usuarioId, juegoId);
            return ResponseEntity.ok(apuestas);
        } catch (ResourceNotFoundException e) {
            // This happens if the user specified by usuarioId doesn't exist
            return ResponseEntity.notFound().build();
        }
    }
    // GET /api/apuestas - Get all bets (Admin only)
    @GetMapping
    public ResponseEntity<List<Apuesta>> obtenerTodasLasApuestas() {
        List<Apuesta> apuestas = apuestaService.obtenerTodasLasApuestas();
        return ResponseEntity.ok(apuestas);
    }

}