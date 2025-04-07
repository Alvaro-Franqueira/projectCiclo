package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.RankingType;
import udaw.casino.model.Usuario;
import udaw.casino.repository.ApuestaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApuestaService {

    private static final Logger log = LoggerFactory.getLogger(ApuestaService.class);

    private final ApuestaRepository apuestaRepository;
    private final UsuarioService usuarioService;
    private final RankingService rankingService; // Inject RankingService

    // Use @Lazy on one side if a circular dependency between ApuestaService <-> RankingService occurs
    // (e.g., if RankingService needed to calculate scores based on Apuesta data fetched via ApuestaService)
    @Autowired
    public ApuestaService(ApuestaRepository apuestaRepository, UsuarioService usuarioService, @Lazy RankingService rankingService) {
        this.apuestaRepository = apuestaRepository;
        this.usuarioService = usuarioService;
        this.rankingService = rankingService;
    }

    /**
     * Creates a new bet after checking user balance.
     *
     * @param apuesta The Apuesta object containing bet details (user, game, amount, type, value).
     * @return The saved Apuesta object with status PENDIENTE.
     * @throws SaldoInsuficienteException if the user doesn't have enough balance.
     * @throws ResourceNotFoundException if the associated user or game doesn't exist (should be checked before calling).
     */
    @Transactional
    public Apuesta crearApuesta(Apuesta apuesta) {
        // Ensure user and game objects are valid and attached
        if (apuesta.getUsuario() == null || apuesta.getUsuario().getId() == null) {
            throw new IllegalArgumentException("Apuesta must have a valid Usuario.");
        }
         if (apuesta.getJuego() == null || apuesta.getJuego().getId() == null) {
            throw new IllegalArgumentException("Apuesta must have a valid Juego.");
        }

        // Fetch the latest user state to ensure balance is current
        Usuario usuario = usuarioService.obtenerUsuarioPorId(apuesta.getUsuario().getId());

        // Check balance
        if (usuario.getBalance() < apuesta.getCantidad()) {
            throw new SaldoInsuficienteException("Saldo insuficiente para realizar la apuesta. Saldo actual: " + usuario.getBalance());
        }

        // Deduct bet amount
        usuarioService.actualizarSaldoUsuario(usuario.getId(), usuario.getBalance() - apuesta.getCantidad());
        log.info("Deducted {} from user {} balance for bet. New balance: {}", apuesta.getCantidad(), usuario.getUsername(), usuario.getBalance() - apuesta.getCantidad());


        // Set initial bet state
        apuesta.setFechaApuesta(LocalDateTime.now());
        apuesta.setEstado("PENDIENTE"); // Initial state
        apuesta.setWinloss(0.0); // No win/loss yet

        // Re-attach the potentially updated user object if necessary, although cascade might handle it.
        // Fetching it again ensures we have the state after balance update if not using the returned object from updateUserBalance.
        apuesta.setUsuario(usuarioService.obtenerUsuarioPorId(usuario.getId()));

        return apuestaRepository.save(apuesta);
    }

    /**
     * Resolves a pending bet based on whether the user won or lost.
     * Updates user balance, sets bet state (GANADA/PERDIDA), calculates win/loss amount,
     * and triggers ranking updates.
     *
     * @param apuestaId The ID of the bet to resolve.
     * @param gano      true if the user won the bet, false otherwise.
     * @return The updated Apuesta object.
     * @throws ResourceNotFoundException if the bet is not found.
     */
    @Transactional
    public Apuesta resolverApuesta(Long apuestaId, boolean gano) {
        Apuesta apuesta = apuestaRepository.findById(apuestaId)
                .orElseThrow(() -> new ResourceNotFoundException("Apuesta", "id", apuestaId));

        if (!"PENDIENTE".equals(apuesta.getEstado())) {
             log.warn("Attempted to resolve an already resolved bet (ID: {}, Status: {})", apuestaId, apuesta.getEstado());
             return apuesta; // Or throw exception
        }

        Usuario usuario = apuesta.getUsuario(); // Get user from the bet
        Juego juego = apuesta.getJuego(); // Get game from the bet
        double cantidadApostada = apuesta.getCantidad();
        double ganancia = 0.0;

        if (gano) {
            // Simple double-or-nothing payout for now. Refine if needed based on game/bet type.
            ganancia = cantidadApostada * 2;
            apuesta.setEstado("GANADA");
            apuesta.setWinloss(cantidadApostada); // Net win is the amount bet (since they get original back + winnings)
            // Update user balance
            usuarioService.actualizarSaldoUsuario(usuario.getId(), usuario.getBalance() + ganancia);
            log.info("User {} won bet {}. Added {} to balance. New balance: {}", usuario.getUsername(), apuestaId, ganancia, usuario.getBalance() + ganancia);

        } else {
            apuesta.setEstado("PERDIDA");
            apuesta.setWinloss(-cantidadApostada); // Net loss is the amount bet
            // Balance was already deducted when bet was placed, no change needed on loss.
            log.info("User {} lost bet {}. Balance remains: {}", usuario.getUsername(), apuestaId, usuario.getBalance());
        }

        // Save the updated bet status and win/loss amount
        Apuesta apuestaResuelta = apuestaRepository.save(apuesta);

        // --- Trigger Ranking Updates ---
        // Update rankings that are affected by any bet resolution
        try {
            // Fetch the latest user state after potential balance update
            Usuario usuarioActualizado = usuarioService.obtenerUsuarioPorId(usuario.getId());

            // Update global rankings (no specific game)
            rankingService.actualizarRankingParaUsuario(usuarioActualizado, RankingType.OVERALL_PROFIT, null);
            rankingService.actualizarRankingParaUsuario(usuarioActualizado, RankingType.TOTAL_BETS_AMOUNT, null);

            // Update game-specific rankings if applicable (e.g., wins per game)
            // Note: BY_GAME_WINS calculation in RankingService needs implementation
            if (juego != null) {
                 rankingService.actualizarRankingParaUsuario(usuarioActualizado, RankingType.BY_GAME_WINS, juego);
            }

        } catch (Exception e) {
            // Log error but don't let ranking update failure rollback the bet resolution
             log.error("Failed to update rankings for User ID: {} after resolving Bet ID: {}",
                      (usuario != null ? usuario.getId() : "null"), apuestaId, e);
        }

        return apuestaResuelta;
    }


    /**
     * Retrieves a bet by its ID.
     *
     * @param id The ID of the bet.
     * @return The found Apuesta object.
     * @throws ResourceNotFoundException if the bet is not found.
     */
    public Apuesta obtenerApuestaPorId(Long id) {
        return apuestaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apuesta", "id", id));
    }

     /**
     * Retrieves all bets for a specific user.
     * Consider pagination for users with many bets.
     *
     * @param usuarioId The ID of the user.
     * @return A list of Apuesta objects for the user.
     */
    public List<Apuesta> obtenerApuestasPorUsuario(Long usuarioId) {
        // Ensure user exists first using UsuarioService
        return apuestaRepository.findByUsuarioIdOrderByFechaApuestaDesc(usuarioId); // Example ordering
    }

     /**
     * Retrieves all bets for a specific game.
     * Consider pagination for games with many bets.
     *
     * @param juegoId The ID of the game.
     * @return A list of Apuesta objects for the game.
     */
     public List<Apuesta> obtenerApuestasPorJuego(Long juegoId) {
        // Optional: Ensure game exists first using JuegoService
        return apuestaRepository.findByJuegoIdOrderByFechaApuestaDesc(juegoId); // Example ordering
    }

}