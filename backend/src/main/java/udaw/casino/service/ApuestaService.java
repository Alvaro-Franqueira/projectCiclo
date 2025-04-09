package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import udaw.casino.repository.ApuestaRepository;
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
    private final JuegoService juegoService;
    public ApuestaService(ApuestaRepository apuestaRepository, UsuarioService usuarioService, JuegoService juegoService) {
        this.juegoService = juegoService; 
        this.apuestaRepository = apuestaRepository;
        this.usuarioService = usuarioService;
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
     * Updates user balance, sets bet state (GANADA/PERDIDA), calculates win/loss amount.
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
             return apuesta; 
        }

        Usuario usuario = apuesta.getUsuario();
        Juego juego = apuesta.getJuego(); // Needed for win calculation
        double cantidadApostada = apuesta.getCantidad();
        double gananciaTotal = 0.0; // Total amount returned to player if won (original bet + winnings)
        double netWinLoss = 0.0; // Net change in balance

        if (gano) {
            gananciaTotal = calcularGananciaTotal(apuesta); // Calculate total return based on game/type
            netWinLoss = gananciaTotal - cantidadApostada; // Calculate net win
            apuesta.setEstado("GANADA");
            apuesta.setWinloss(netWinLoss); // Set the net win amount

            // Update user balance with the total amount returned
            // Note: Need to fetch the latest balance before updating
            Usuario usuarioActualizado = usuarioService.obtenerUsuarioPorId(usuario.getId());
            usuarioService.actualizarSaldoUsuario(usuario.getId(), usuarioActualizado.getBalance() + gananciaTotal);
            log.info("User {} won bet {}. Returning {} (Net Win: {}). New balance approx: {}", 
                     usuario.getUsername(), apuestaId, gananciaTotal, netWinLoss, usuarioActualizado.getBalance() + gananciaTotal);

        } else {
            gananciaTotal = 0.0; // No return on loss
            netWinLoss = -cantidadApostada; // Net loss is the amount bet
            apuesta.setEstado("PERDIDA");
            apuesta.setWinloss(netWinLoss);
            // Balance was already deducted when bet was placed, no balance change needed on loss.
            log.info("User {} lost bet {}. Net loss: {}. Balance remains: {}", 
                     usuario.getUsername(), apuestaId, netWinLoss, usuario.getBalance());
        }

        // Save the updated bet status and win/loss amount
        Apuesta apuestaResuelta = apuestaRepository.save(apuesta);
        log.info("Bet {} resolved. Status: {}, Win/Loss: {}", apuestaId, apuestaResuelta.getEstado(), apuestaResuelta.getWinloss());
 
        return apuestaResuelta;
    }

    /**
     * Calculates the total amount to be returned to the player for a winning bet,
     * based on the game type and bet type.
     *
     * @param apuesta The winning Apuesta object.
     * @return The total amount (original bet + winnings).
     */
    private double calcularGananciaTotal(Apuesta apuesta) {
        String gameName = apuesta.getJuego().getNombre().toLowerCase();
        String betType = apuesta.getTipo().toLowerCase();
        double amountBet = apuesta.getCantidad();
        double payoutMultiplier = 1.0; // Default: return original bet if type unknown

        log.debug("Calculating winnings for Bet ID: {}, Game: {}, Type: {}, Amount: {}", 
                  apuesta.getId(), gameName, betType, amountBet);

        switch (gameName) {
            case "ruleta":
                switch (betType) {
                    case "numero": payoutMultiplier = 36.0; break; // 35:1 + original
                    case "color": payoutMultiplier = 2.0; break;  // 1:1 + original
                    case "paridad": payoutMultiplier = 2.0; break; // 1:1 + original (par/impar)
                    case "docena": payoutMultiplier = 3.0; break;  // 2:1 + original
                    case "columna": payoutMultiplier = 3.0; break; // 2:1 + original
                    // Assuming 'alto_bajo' or similar for 1-18/19-36 type bets
                    case "alto_bajo": 
                    case "mitad": // Adding 'mitad' as potential alias
                         payoutMultiplier = 2.0; break; // 1:1 + original
                    default:
                        log.warn("Unknown or unsupported Roulette bet type: '{}' for Bet ID: {}. Returning original bet.", betType, apuesta.getId());
                        payoutMultiplier = 1.0; 
                }
                break;
                
            case "dados": // Assuming game name is "dados"
                 switch (betType) {
                    case "numero": 
                        // Assuming standard 6-sided die win payout 5:1
                        payoutMultiplier = 6.0; break; // 5:1 + original 
                    case "parimpar": // Assuming odd/even bet
                    case "paridad": // Allow alias
                        payoutMultiplier = 2.0; break; // 1:1 + original
                    default:
                        log.warn("Unknown or unsupported Dice bet type: '{}' for Bet ID: {}. Returning original bet.", betType, apuesta.getId());
                        payoutMultiplier = 1.0; 
                }
                break;
                
            default:
                 log.warn("Unsupported game name: '{}' for win calculation (Bet ID: {}). Returning original bet.", gameName, apuesta.getId());
                 payoutMultiplier = 1.0; // Return original bet for unknown games
        }
        
        double totalReturn = amountBet * payoutMultiplier;
        log.debug("Bet ID: {}. Payout Multiplier: {}. Total Return: {}", apuesta.getId(), payoutMultiplier, totalReturn);
        return totalReturn;
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
        try {
            usuarioService.obtenerUsuarioPorId(usuarioId);
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("Usuario", "id", usuarioId);
        }
        // Optional: Consider pagination for large result sets
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
        try {
             juegoService.obtenerJuegoPorId(juegoId); 
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("Juego", "id", juegoId);
        }
        return apuestaRepository.findByJuegoIdOrderByFechaApuestaDesc(juegoId); // Example ordering
    }

    /**
     * Retrieves all bets for a specific user in a specific game.
     * 
     * @param usuarioId The ID of the user.
     * @param juegoId The ID of the game.
     * @return A list of Apuesta objects for the user in the specified game.
     * @throws ResourceNotFoundException if the user or game doesn't exist.
     */
    public List<Apuesta> obtenerApuestasPorUsuarioYJuego(Long usuarioId, Long juegoId) {
        try {
            usuarioService.obtenerUsuarioPorId(usuarioId);
            juegoService.obtenerJuegoPorId(juegoId);
        } catch (ResourceNotFoundException e) {
            throw e; // Re-throw the exception with the original message
        }
        
        return apuestaRepository.findByUsuarioIdAndJuegoIdOrderByFechaApuestaDesc(usuarioId, juegoId);
    }
}