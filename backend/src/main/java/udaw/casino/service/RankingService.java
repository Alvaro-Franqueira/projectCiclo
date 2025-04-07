package udaw.casino.service;

import udaw.casino.model.Ranking;
import udaw.casino.model.RankingType;
import udaw.casino.model.Usuario;
import udaw.casino.model.Juego;
import udaw.casino.repository.RankingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Optional;

@Service
public class RankingService {

    private static final Logger log = LoggerFactory.getLogger(RankingService.class);

    private final RankingRepository rankingRepository;
    // Removed UsuarioRepository dependency if not strictly needed here
    // We get Usuario objects passed in from other services

    @Autowired
    public RankingService(RankingRepository rankingRepository) {
        this.rankingRepository = rankingRepository;
    }

    /**
     * Updates or creates ranking entries for a user based on a specific event or calculation.
     * This method should be called when a user's score for a ranking type potentially changes
     * (e.g., after a bet is resolved).
     *
     * @param usuario The user whose ranking needs updating.
     * @param tipo    The type of ranking to update.
     * @param juego   The specific game related to the ranking (can be null for global rankings).
     */
    @Transactional
    public void actualizarRankingParaUsuario(Usuario usuario, RankingType tipo, Juego juego) {
        if (usuario == null || tipo == null) {
            log.warn("Attempted to update ranking with null user or type. User: {}, Type: {}", usuario, tipo);
            return; // Or throw an exception
        }

        log.info("Updating ranking for User ID: {}, Type: {}, Game ID: {}",
                 usuario.getId(), tipo, (juego != null ? juego.getId() : "N/A"));

        // 1. Calculate the new score based on the RankingType
        Double newScore = calcularScore(usuario, tipo, juego);

        // 2. Find existing ranking entry or create a new one
        Optional<Ranking> rankingOpt;
        if (juego != null) {
            rankingOpt = rankingRepository.findByUsuarioAndTipoAndJuego(usuario, tipo, juego);
        } else {
            rankingOpt = rankingRepository.findByUsuarioAndTipoAndJuegoIsNull(usuario, tipo);
        }

        Ranking ranking = rankingOpt.orElseGet(() -> {
            log.info("No existing ranking found for User ID: {}, Type: {}, Game ID: {}. Creating new entry.",
                     usuario.getId(), tipo, (juego != null ? juego.getId() : "N/A"));
            Ranking newRanking = new Ranking();
            newRanking.setUsuario(usuario);
            newRanking.setTipo(tipo);
            newRanking.setJuego(juego); // Will be null if juego is null
            return newRanking;
        });

        // 3. Update the score and save
        if (!ranking.getScore().equals(newScore)) {
             log.info("Updating score for User ID: {}, Type: {}, Game ID: {}. Old score: {}, New score: {}",
                     usuario.getId(), tipo, (juego != null ? juego.getId() : "N/A"), ranking.getScore(), newScore);
            ranking.setScore(newScore);
            rankingRepository.save(ranking);
        } else {
             log.info("Score unchanged for User ID: {}, Type: {}, Game ID: {}. Score: {}",
                     usuario.getId(), tipo, (juego != null ? juego.getId() : "N/A"), newScore);
        }
    }

    /**
     * Calculates the score for a given user, ranking type, and optionally game.
     * This is where the logic for different ranking criteria resides.
     *
     * @param usuario The user.
     * @param tipo    The ranking type.
     * @param juego   The game (optional).
     * @return The calculated score.
     */
    private Double calcularScore(Usuario usuario, RankingType tipo, Juego juego) {
        switch (tipo) {
            case OVERALL_PROFIT:
                // Use the repository method to calculate total profit across all bets
                return rankingRepository.calculateTotalProfitForUser(usuario);
            case TOTAL_BETS_AMOUNT:
                // Use the repository method to calculate total amount bet across all bets
                return rankingRepository.calculateTotalBetAmountForUser(usuario);
            //case BY_GAME_WINS:
                // This requires more specific logic.
                // Option 1: Query Apuesta table for wins for this user and game.
                // Option 2: Store win counts directly in the Ranking entity (more complex update logic).
                // For now, returning a placeholder. Needs implementation based on how 'wins' are defined.
                //log.warn("Calculation logic for BY_GAME_WINS is not fully implemented yet for User ID: {}, Game ID: {}",
                         //usuario.getId(), (juego != null ? juego.getId() : "N/A"));
                // Example placeholder: return current balance (like original code, but likely incorrect for "wins")
                 //return usuario.getBalance(); // Placeholder - REPLACE WITH ACTUAL WIN CALCULATION
            default:
                log.error("Unsupported RankingType encountered: {}", tipo);
                throw new IllegalArgumentException("Unsupported ranking type: " + tipo);
        }
    }


    /**
     * Retrieves the leaderboard for a specific ranking type.
     * This method now ONLY reads the pre-calculated ranking data.
     *
     * @param tipo The RankingType enum value.
     * @return A list of Ranking objects ordered by score (highest first).
     */
    public List<Ranking> obtenerRankingPorTipo(RankingType tipo) {
         log.info("Fetching ranking for Type: {}", tipo);
         // Use the repository method that orders by score
        return rankingRepository.findByTipoOrderByScoreDesc(tipo);
    }

     /**
     * Retrieves the leaderboard for a specific ranking type and a specific game.
     *
     * @param tipo The RankingType enum value.
     * @param juego The Juego object.
     * @return A list of Ranking objects for the specified game, ordered by score.
     */
    public List<Ranking> obtenerRankingPorJuegoYTipo(RankingType tipo, Juego juego) {
        if (juego == null) {
             throw new IllegalArgumentException("Juego cannot be null when fetching game-specific ranking.");
        }
         log.info("Fetching ranking for Type: {}, Game ID: {}", tipo, juego.getId());
        return rankingRepository.findByTipoAndJuegoOrderByScoreDesc(tipo, juego);
    }


    // --- Potentially keep or remove the old methods if they are no longer used ---
    /*
    // OLD METHOD - Logic moved/changed
    @Transactional
    public void actualizarRanking(Long usuarioId, String tipo) {
        // This logic is now handled by actualizarRankingParaUsuario and calcularScore
        // Triggered by events, not direct calls like this typically.
        log.warn("Deprecated method actualizarRanking(userId, tipo) called.");
        // ... old logic ...
    }
    */

    /*
    // OLD METHOD - Replaced by obtenerRankingPorTipo(RankingType tipo)
    public List<Ranking> obtenerRankingPorTipo(String tipo) {
         log.warn("Deprecated method obtenerRankingPorTipo(String tipo) called.");
         // Convert String to Enum and call the new method, or remove this entirely
         try {
            RankingType rankingType = RankingType.valueOf(tipo.toUpperCase());
            return obtenerRankingPorTipo(rankingType);
         } catch (IllegalArgumentException e) {
             log.error("Invalid ranking type string provided: {}", tipo);
             throw new ResourceNotFoundException("Ranking type not found: " + tipo);
         }
    }
    */
}