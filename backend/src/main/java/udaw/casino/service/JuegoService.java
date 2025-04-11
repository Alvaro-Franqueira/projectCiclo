package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Juego;
import udaw.casino.repository.JuegoRepository;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;


@Service
public class JuegoService {

    private final JuegoRepository juegoRepository;

    public JuegoService(JuegoRepository juegoRepository) {
        this.juegoRepository = juegoRepository;
    }

    /**
     * Creates a new game.
     *
     * @param juego The game details.
     * @return The saved Juego object.
     */
    @Transactional
    public Juego crearJuego(Juego juego) {
        // Optional: Add check for existing game name if it should be unique
        if (juegoRepository.findByNombre(juego.getNombre()).isPresent()) {
             throw new IllegalArgumentException("Game with name '" + juego.getNombre() + "' already exists.");
        }
        return juegoRepository.save(juego);
    }

    /**
     * Retrieves a game by its ID.
     *
     * @param id The ID of the game.    
     * @return The found Juego object.
     * @throws ResourceNotFoundException if the game is not found.
     */
    public Juego obtenerJuegoPorId(Long id) {
        return juegoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Juego", "id", id));
    }

    /**
     * Retrieves a game by its name.
     *
     * @param nombre The name of the game.
     * @return The found Juego object.
     * @throws ResourceNotFoundException if the game is not found.
     */
    public Juego obtenerJuegoPorNombre(String nombre) {
        return juegoRepository.findByNombre(nombre)
                .orElseThrow(() -> new ResourceNotFoundException("Juego", "nombre", nombre));
    }


    /**
     * Retrieves all available games.
     *
     * @return A list of all Juego objects.
     */
    public List<Juego> obtenerTodosLosJuegos() {
        return juegoRepository.findAll();
    }

    // Optional: Add update and delete methods if needed for game management
    /**
     * Deletes a game by its ID.
     * CAUTION: Consider consequences of deleting a game with existing bets/rankings.
     * Might need cascading deletes or checks before allowing deletion.
     * @param id The ID of the game to delete.
     */
    @Transactional
    public void eliminarJuego(Long id) {
        Juego juego = obtenerJuegoPorId(id); // Ensure game exists
        // Add checks here if needed (e.g., check if apuestas exist for this juego)
        juegoRepository.delete(juego);
    }
}