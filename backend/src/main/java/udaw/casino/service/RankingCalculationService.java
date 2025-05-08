package udaw.casino.service;

import udaw.casino.model.Juego;
import udaw.casino.model.RankingType;
import udaw.casino.model.Usuario;
import udaw.casino.repository.ApuestaRepository;
import udaw.casino.repository.UsuarioRepository;

import org.springframework.stereotype.Service;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for calculating rankings on-demand without storing them in the database.
 * This replaces the previous approach of maintaining a separate Ranking entity.
 */
@Service

public class RankingCalculationService {

    private static final Logger log = LoggerFactory.getLogger(RankingCalculationService.class);

    private final ApuestaRepository apuestaRepository;
    private final UsuarioRepository usuarioRepository;

    public RankingCalculationService(ApuestaRepository apuestaRepository, UsuarioRepository usuarioRepository) {
        this.apuestaRepository = apuestaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Represents a ranking entry with user information and score.
     */
    @Getter
    @Setter
    public static class RankingEntry {
        private Usuario usuario;
        private Juego juego;
        private RankingType tipo;
        private Double valor;
        private Integer posicion;

        public RankingEntry(Usuario usuario, Juego juego, RankingType tipo, Double valor) {
            this.usuario = usuario;
            this.juego = juego;
            this.tipo = tipo;
            this.valor = valor;
        }

    }

    /**
     * Gets the global ranking list for a specific type.
     *
     * @param tipo The type of ranking.
     * @return List of RankingEntry objects ordered by score.
     */
    public List<RankingEntry> obtenerRankingPorTipo(RankingType tipo) {
        log.info("Calculating on-demand ranking for type: {}", tipo);
        
        // Check if the ranking type requires a game
        if (tipo == RankingType.BY_GAME_WINS || tipo == RankingType.BY_GAME_WIN_RATE || tipo == RankingType.BY_GAME_PROFIT) {
            log.warn("Requested game-specific ranking type {} without specifying a game - returning empty list", tipo);
            return new ArrayList<>(); // Return empty list for game-specific ranking types
        }
        
        List<Usuario> usuarios = usuarioRepository.findAll();
        List<RankingEntry> rankings = new ArrayList<>();
        
        for (Usuario usuario : usuarios) {
            Double score = calcularScore(usuario, tipo, null);
            rankings.add(new RankingEntry(usuario, null, tipo, score));
        }
        
        // Sort by score (descending) and assign positions
        rankings.sort(Comparator.comparing(RankingEntry::getValor).reversed());
        
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setPosicion(i + 1);
        }
        
        return rankings;
    }

    /**
     * Gets the ranking list for a specific game and ranking type.
     *
     * @param tipo The type of ranking.
     * @param juego The game.
     * @return List of RankingEntry objects ordered by score.
     */
    public List<RankingEntry> obtenerRankingPorJuegoYTipo(RankingType tipo, Juego juego) {
        log.info("Calculating on-demand ranking for type: {} and game: {}", tipo, juego.getNombre());
        
        List<Usuario> usuarios = usuarioRepository.findAll();
        List<RankingEntry> rankings = new ArrayList<>();
        
        for (Usuario usuario : usuarios) {
            Double score = calcularScore(usuario, tipo, juego);
            rankings.add(new RankingEntry(usuario, juego, tipo, score));
        }
        
        // Sort by score (descending) and assign positions
        rankings.sort(Comparator.comparing(RankingEntry::getValor).reversed());
        
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setPosicion(i + 1);
        }
        
        return rankings;
    }

    /**
     * Gets the rankings for a specific user.
     *
     * @param usuarioId The user ID.
     * @return List of RankingEntry objects for the user.
     */
    public List<RankingEntry> obtenerRankingsDelUsuario(Long usuarioId) {
        log.info("Calculating on-demand rankings for user ID: {}", usuarioId);
        
        Usuario usuario;
        try {
            usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        } catch (Exception e) {
            log.error("Error finding user with ID {}: {}", usuarioId, e.getMessage());
            return new ArrayList<>(); // Return empty list instead of throwing exception
        }
        
        List<RankingEntry> rankings = new ArrayList<>();
        
        // Add global rankings
        for (RankingType tipo : RankingType.values()) {
            if (tipo != RankingType.BY_GAME_WINS && tipo != RankingType.BY_GAME_WIN_RATE && tipo != RankingType.BY_GAME_PROFIT) {
                try {
                    Double score = calcularScore(usuario, tipo, null);
                    RankingEntry entry = new RankingEntry(usuario, null, tipo, score);
                    
                    // Calculate position
                    List<RankingEntry> allRankings = obtenerRankingPorTipo(tipo);
                    for (int i = 0; i < allRankings.size(); i++) {
                        if (allRankings.get(i).getUsuario().getId().equals(usuario.getId())) {
                            entry.setPosicion(i + 1);
                            break;
                        }
                    }
                    
                    rankings.add(entry);
                    log.debug("Added global ranking for user {}: type={}, score={}, position={}", 
                              usuarioId, tipo, score, entry.getPosicion());
                } catch (Exception e) {
                    log.error("Error calculating {} ranking for user {}: {}", tipo, usuarioId, e.getMessage());
                    // Continue to next ranking type
                }
            }
        }
        
        // Add game-specific rankings
        List<Juego> juegos;
        try {
            juegos = apuestaRepository.findDistinctJuegosByUsuarioId(usuarioId);
            log.info("Found {} distinct games for user {}", juegos.size(), usuarioId);
        } catch (Exception e) {
            log.error("Error finding games for user {}: {}", usuarioId, e.getMessage());
            juegos = new ArrayList<>(); // Empty list to safely continue
        }
        
        for (Juego juego : juegos) {
            log.debug("Processing game rankings for user {} and game {} (ID: {})", 
                      usuarioId, juego.getNombre(), juego.getId());
            
            // BY_GAME_WINS ranking
            try {
                Double winsScore = calcularScore(usuario, RankingType.BY_GAME_WINS, juego);
                RankingEntry winsEntry = new RankingEntry(usuario, juego, RankingType.BY_GAME_WINS, winsScore);
                
                // Calculate position for BY_GAME_WINS
                List<RankingEntry> allWinsRankings = obtenerRankingPorJuegoYTipo(RankingType.BY_GAME_WINS, juego);
                for (int i = 0; i < allWinsRankings.size(); i++) {
                    if (allWinsRankings.get(i).getUsuario().getId().equals(usuario.getId())) {
                        winsEntry.setPosicion(i + 1);
                        break;
                    }
                }
                rankings.add(winsEntry);
                log.debug("Added BY_GAME_WINS ranking for user {} and game {}: score={}, position={}", 
                          usuarioId, juego.getNombre(), winsScore, winsEntry.getPosicion());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_WINS ranking for user {} and game {}: {}", 
                          usuarioId, juego.getNombre(), e.getMessage());
            }
            
            // BY_GAME_WIN_RATE ranking
            try {
                Double winRateScore = calcularScore(usuario, RankingType.BY_GAME_WIN_RATE, juego);
                RankingEntry winRateEntry = new RankingEntry(usuario, juego, RankingType.BY_GAME_WIN_RATE, winRateScore);
                
                // Calculate position for BY_GAME_WIN_RATE
                List<RankingEntry> allWinRateRankings = obtenerRankingPorJuegoYTipo(RankingType.BY_GAME_WIN_RATE, juego);
                for (int i = 0; i < allWinRateRankings.size(); i++) {
                    if (allWinRateRankings.get(i).getUsuario().getId().equals(usuario.getId())) {
                        winRateEntry.setPosicion(i + 1);
                        break;
                    }
                }
                rankings.add(winRateEntry);
                log.debug("Added BY_GAME_WIN_RATE ranking for user {} and game {}: score={}, position={}", 
                          usuarioId, juego.getNombre(), winRateScore, winRateEntry.getPosicion());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_WIN_RATE ranking for user {} and game {}: {}", 
                          usuarioId, juego.getNombre(), e.getMessage());
            }
            
            // BY_GAME_PROFIT ranking
            try {
                Double profitScore = calcularScore(usuario, RankingType.BY_GAME_PROFIT, juego);
                RankingEntry profitEntry = new RankingEntry(usuario, juego, RankingType.BY_GAME_PROFIT, profitScore);
                
                // Calculate position for BY_GAME_PROFIT
                List<RankingEntry> allProfitRankings = obtenerRankingPorJuegoYTipo(RankingType.BY_GAME_PROFIT, juego);
                for (int i = 0; i < allProfitRankings.size(); i++) {
                    if (allProfitRankings.get(i).getUsuario().getId().equals(usuario.getId())) {
                        profitEntry.setPosicion(i + 1);
                        break;
                    }
                }
                rankings.add(profitEntry);
                log.debug("Added BY_GAME_PROFIT ranking for user {} and game {}: score={}, position={}", 
                          usuarioId, juego.getNombre(), profitScore, profitEntry.getPosicion());
            } catch (Exception e) {
                log.error("Error calculating BY_GAME_PROFIT ranking for user {} and game {}: {}", 
                          usuarioId, juego.getNombre(), e.getMessage());
            }
        }
        
        log.info("Returning {} rankings for user {}", rankings.size(), usuarioId);
        return rankings;
    }

    /**
     * Calculates the score for a given user, ranking type, and optionally game.
     *
     * @param usuario The user.
     * @param tipo The ranking type.
     * @param juego The game (optional).
     * @return The calculated score.
     */
    private Double calcularScore(Usuario usuario, RankingType tipo, Juego juego) {
        switch (tipo) {
            case OVERALL_PROFIT:
                // Returns Double or 0.0 - SAFE
                return apuestaRepository.calculateTotalProfitForUser(usuario.getId());

            case TOTAL_BETS_AMOUNT:
                // Returns Double or 0.0 - SAFE
                return apuestaRepository.calculateTotalBetAmountForUser(usuario.getId());

            case BY_GAME_WINS:
                if (juego == null || juego.getId() == null) { // Added null check for juego.getId() just in case
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_WINS ranking type");
                }
                // Returns Long or 0L - repo method returns Long
                Long wins = apuestaRepository.countWinsByUserAndGame(usuario.getId(), juego.getId());
                // Implicit conversion from Long to Double might happen here,
                // but explicitly converting is safer:
                return wins != null ? wins.doubleValue() : 0.0; // <--- SUGGESTED CHANGE

            case WIN_RATE:
                // Returns Double (0.0 to 1.0) or 0.0 - SAFE
                Double winRate = apuestaRepository.calculateWinRateForUser(usuario.getId());
                return winRate != null ? winRate * 100 : 0.0; // Convert to percentage

            case BY_GAME_WIN_RATE:
                if (juego == null || juego.getId() == null) { // Added null check for juego.getId() just in case
                   throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_WIN_RATE ranking type");
                }
                // Returns Double (0.0 to 1.0) or 0.0 - SAFE
                Double gameWinRate = apuestaRepository.calculateWinRateForUserAndGame(usuario.getId(), juego.getId());
                return gameWinRate != null ? gameWinRate * 100 : 0.0; // Convert to percentage
                
            case BY_GAME_PROFIT:
                if (juego == null || juego.getId() == null) {
                    throw new IllegalArgumentException("Game and Game ID cannot be null for BY_GAME_PROFIT ranking type");
                }
                // Returns Double or 0.0 - SAFE
                Double gameProfit = apuestaRepository.calculateTotalProfitForUserAndGame(usuario.getId(), juego.getId());
                return gameProfit != null ? gameProfit : 0.0;

            default:
                log.error("Unsupported RankingType encountered: {}", tipo);
                throw new IllegalArgumentException("Unsupported ranking type: " + tipo);
        }
    }
}
