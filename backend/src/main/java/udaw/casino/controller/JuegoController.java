package udaw.casino.controller;

import udaw.casino.dto.JuegoDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Juego;
import udaw.casino.service.JuegoService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PutMapping;


@RestController
@RequestMapping("/api/juegos")
public class JuegoController {




    @Autowired
    private JuegoService juegoService;



    private static final Logger log = LoggerFactory.getLogger(JuegoController.class);

    /**
     * Create a new game.
     * 
     * @param juego Game details
     * @return Created game
     */
    @PostMapping
    public ResponseEntity<?> crearJuego(@Valid @RequestBody JuegoDTO juegoDTO) {
        try {
            Juego juego = new Juego();
            juego.setNombre(juegoDTO.getNombre());
            juego.setDescripcion(juegoDTO.getDescripcion());
            Juego nuevoJuego = juegoService.crearJuego(juego);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoJuego);
        } catch (Exception e) {
            
            log.error("Error creating game with name: {}", juegoDTO.getNombre(), e);
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
     public ResponseEntity<?> obtenerJuegos() { // Use wildcard or a specific error DTO
         try {
             List<Juego> juegos = juegoService.obtenerTodosLosJuegos();
 
             // Optional: Log basic info if needed, *without* calling toString on entities
             log.info("Retrieved {} juegos from service.", juegos.size());
 
             List<JuegoDTO> juegoDTOs = new ArrayList<>();
             for (Juego juego : juegos) {
                 juegoDTOs.add(new JuegoDTO(juego));
             }
 
             // Or using streams:
             // List<JuegoDTO> juegoDTOs = juegos.stream()
             //                                 .map(JuegoDTO::new) // Equivalent to .map(juego -> new JuegoDTO(juego))
             //                                 .collect(Collectors.toList());
 
             log.debug("Returning {} JuegoDTOs.", juegoDTOs.size()); // Log DTO count if useful
             return ResponseEntity.ok(juegoDTOs);
 
         } catch (Exception e) {
             // Log the exception! Otherwise, you won't know what went wrong in production.
             log.error("Error fetching juegos", e);
             // Consider returning a more informative error response instead of just status
             // return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving games.");
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

    //obtener juego by nombre
    
    @GetMapping("/nombre/{nombre}")
    public ResponseEntity<JuegoDTO> obtenerJuegoPorNombre(@PathVariable String nombre) {
        Juego juego = juegoService.obtenerJuegoPorNombre(nombre);
        JuegoDTO juegoDTO = new JuegoDTO(juego);
        return ResponseEntity.ok(juegoDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarJuego(@PathVariable Long id, @RequestBody JuegoDTO juegoDTO) {
        try {
            Juego juego = new Juego();
            juego.setId(id);
            juego.setNombre(juegoDTO.getNombre());
            juego.setDescripcion(juegoDTO.getDescripcion());
            log.info("Attempting to update game with ID: {} and name: {}", id, juegoDTO.getNombre());
            Juego juegoActualizado = juegoService.updateGame(id, juego);
            
            log.info("Successfully updated game with ID: {}", juegoActualizado.getId());
            return ResponseEntity.ok(juegoActualizado);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            
            log.warn("Game not found for update with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to update game"));
        }
    }


    /**
     * Delete a game by ID.
     * 
     * @param id Game ID
     * @return Response status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarJuego(@PathVariable Long id) {
        try {
            juegoService.eliminarJuego(id);
            return ResponseEntity.ok(Map.of("message", "Game deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to delete game"));
        }
    }

    
}