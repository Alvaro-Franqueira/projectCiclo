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
    public List<RankingEntry> obtenerRankingsDeUsuario(Long usuarioId) {
        log.info("Calculating on-demand rankings for user ID: {}", usuarioId);
        
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        List<RankingEntry> rankings = new ArrayList<>();
        
        // Add global rankings
        for (RankingType tipo : RankingType.values()) {
            if (tipo != RankingType.BY_GAME_WINS) {
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
            }
        }
        
        // Add game-specific rankings
        List<Juego> juegos = apuestaRepository.findDistinctJuegosByUsuarioId(usuarioId);
        for (Juego juego : juegos) {
            Double score = calcularScore(usuario, RankingType.BY_GAME_WINS, juego);
            RankingEntry entry = new RankingEntry(usuario, juego, RankingType.BY_GAME_WINS, score);
            
            // Calculate position
            List<RankingEntry> allRankings = obtenerRankingPorJuegoYTipo(RankingType.BY_GAME_WINS, juego);
            for (int i = 0; i < allRankings.size(); i++) {
                if (allRankings.get(i).getUsuario().getId().equals(usuario.getId())) {
                    entry.setPosicion(i + 1);
                    break;
                }
            }
            
            rankings.add(entry);
        }
        
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
                return apuestaRepository.calculateTotalProfitForUser(usuario.getId());
                
            case TOTAL_BETS_AMOUNT:
                return apuestaRepository.calculateTotalBetAmountForUser(usuario.getId());
                
            case BY_GAME_WINS:
                if (juego == null) {
                    throw new IllegalArgumentException("Game cannot be null for BY_GAME_WINS ranking type");
                }
                Long wins = apuestaRepository.countWinsByUserAndGame(usuario.getId(), juego.getId());
                return wins != null ? wins : 0.0;
                
            default:
                log.error("Unsupported RankingType encountered: {}", tipo);
                throw new IllegalArgumentException("Unsupported ranking type: " + tipo);
        }
    }
}
