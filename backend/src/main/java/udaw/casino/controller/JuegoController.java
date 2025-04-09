package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Juego;
import udaw.casino.service.JuegoService;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/juegos")
public class JuegoController {

    @Autowired
    private JuegoService juegoService;

    /**
     * Create a new game.
     * 
     * @param juego Game details
     * @return Created game
     */
    @PostMapping
    public ResponseEntity<?> crearJuego(@RequestBody Juego juego) {
        try {
            Juego nuevoJuego = juegoService.crearJuego(juego);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoJuego);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to create game"));
        }
    }

    /**
     * Get all games.
     * 
     * @return List of all games
     */
    @GetMapping
    public ResponseEntity<List<Juego>> obtenerJuegos() {
        try {
            List<Juego> juegos = juegoService.obtenerTodosLosJuegos();
            return ResponseEntity.ok(juegos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a game by ID.
     * 
     * @param id Game ID
     * @return Game details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerJuegoPorId(@PathVariable Long id) {
        try {
            Juego juego = juegoService.obtenerJuegoPorId(id);
            return ResponseEntity.ok(juego);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to fetch game"));
        }
    }
}