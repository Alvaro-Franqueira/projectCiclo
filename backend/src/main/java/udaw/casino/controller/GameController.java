package udaw.casino.controller;

import udaw.casino.dto.GameDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Game;
import udaw.casino.service.GameService;

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

/**
 * Controller for managing casino games.
 * Provides endpoints for creating, retrieving, updating, and deleting games.
 */
@RestController
@RequestMapping("/api/games")
public class GameController {

    @Autowired
    private GameService gameService;

    private static final Logger log = LoggerFactory.getLogger(GameController.class);

    /**
     * Create a new game.
     * 
     * @param gameDTO Game details
     * @return Created game
     */
    @PostMapping
    public ResponseEntity<?> createGame(@Valid @RequestBody GameDTO gameDTO) {
        try {
            Game game = new Game();
            game.setName(gameDTO.getName());
            game.setDescription(gameDTO.getDescription());
            Game newGame = gameService.createGame(game);
            return ResponseEntity.status(HttpStatus.CREATED).body(newGame);
        } catch (Exception e) {
            log.error("Error creating game with name: {}", gameDTO.getName(), e);
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
    public ResponseEntity<?> getAllGames() {
        try {
            List<Game> games = gameService.getAllGames();
            log.info("Retrieved {} games from service.", games.size());
            List<GameDTO> gameDTOs = new ArrayList<>();
            for (Game game : games) {
                gameDTOs.add(new GameDTO(game));
            }
            log.debug("Returning {} GameDTOs.", gameDTOs.size());
            return ResponseEntity.ok(gameDTOs);
        } catch (Exception e) {
            log.error("Error fetching games", e);
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
    public ResponseEntity<?> getGameById(@PathVariable Long id) {
        try {
            Game game = gameService.getGameById(id);
            GameDTO gameDTO = new GameDTO(game);
            return ResponseEntity.ok(gameDTO);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching game with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to fetch game"));
        }
    }

    /**
     * Get a game by name.
     * 
     * @param name Game name
     * @return Game details
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<GameDTO> getGameByName(@PathVariable String name) {
        Game game = gameService.getGameByName(name);
        GameDTO gameDTO = new GameDTO(game);
        return ResponseEntity.ok(gameDTO);
    }

    /**
     * Update a game by ID.
     * 
     * @param id Game ID
     * @param gameDTO Updated game details
     * @return Updated game
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGame(@PathVariable Long id, @RequestBody GameDTO gameDTO) {
        try {
            Game game = new Game();
            game.setId(id);
            game.setName(gameDTO.getName());
            game.setDescription(gameDTO.getDescription());
            log.info("Attempting to update game with ID: {} and name: {}", id, gameDTO.getName());
            Game updatedGame = gameService.updateGame(id, game);
            log.info("Successfully updated game with ID: {}", updatedGame.getId());
            return ResponseEntity.ok(updatedGame);
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
    public ResponseEntity<?> deleteGame(@PathVariable Long id) {
        try {
            gameService.deleteGame(id);
            return ResponseEntity.ok(Map.of("message", "Game deleted successfully"));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to delete game"));
        }
    }
}
