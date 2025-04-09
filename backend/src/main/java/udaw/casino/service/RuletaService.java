package udaw.casino.service;

import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import udaw.casino.exception.ResourceNotFoundException; 
import udaw.casino.exception.SaldoInsuficienteException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.transaction.Transactional;


@Service
public class RuletaService {

    private static final Logger log = LoggerFactory.getLogger(RuletaService.class);
    private static final String ROULETTE_GAME_NAME = "Roulette"; // Define game name constant

    private final ApuestaService apuestaService;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService; 
   
    // Constructor remains the same
    public RuletaService(ApuestaService apuestaService, UsuarioService usuarioService, JuegoService juegoService) {
        this.apuestaService = apuestaService;
        this.usuarioService = usuarioService;
        this.juegoService = juegoService;
    }

    /**
     * Handles playing a round of Roulette using a winning number provided externally (e.g., from frontend).
     * Finds the Roulette game dynamically, creates the bet, determines the result based on the provided number,
     * and resolves the bet.
     *
     * @param usuarioId            The ID of the user playing.
     * @param cantidad             The amount being bet.
     * @param tipoApuesta          The type of bet (e.g., "numero", "color", "paridad").
     * @param valorApuesta         The specific value bet on (e.g., "17", "rojo", "par").
     * @param numeroGanadorFrontend The winning number (0-36) provided by the client.
     * @return The resolved Apuesta object.
     * @throws ResourceNotFoundException if the user or the Roulette game is not found.
     * @throws SaldoInsuficienteException if the user has insufficient balance.
     * @throws IllegalArgumentException if numeroGanadorFrontend is out of range (0-36).
     */
    @Transactional // Ensure atomicity
    // *** MODIFIED SIGNATURE to accept numeroGanadorFrontend ***
    public Apuesta jugarRuleta(Long usuarioId, double cantidad, String tipoApuesta, String valorApuesta, int numeroGanadorFrontend) {

        // --- Validate the received winning number ---
        if (numeroGanadorFrontend < 0 || numeroGanadorFrontend > 36) {
             log.error("Invalid winning number received from client: {}. Must be between 0 and 36.", numeroGanadorFrontend);
             // Throw an exception that the controller can catch and return as a Bad Request
             throw new IllegalArgumentException("Número ganador inválido: " + numeroGanadorFrontend + ". Debe estar entre 0 y 36.");
        }
        // --- End Validation ---

        Usuario usuario = usuarioService.obtenerUsuarioPorId(usuarioId);

        // Find the Roulette game dynamically by name
        Juego juegoRuleta = juegoService.obtenerJuegoPorNombre(ROULETTE_GAME_NAME);
        // If obtenerJuegoPorNombre throws ResourceNotFoundException, it propagates up

        log.info("User {} playing Roulette (Game ID: {}) with bet type: {}, value: {}, amount: {}. Frontend winning number: {}",
                 usuario.getUsername(), juegoRuleta.getId(), tipoApuesta, valorApuesta, cantidad, numeroGanadorFrontend);

        // Create the bet object (ApuestaService handles balance check)
        Apuesta apuesta = new Apuesta();
        apuesta.setUsuario(usuario);
        apuesta.setJuego(juegoRuleta); // Set the fetched game object
        apuesta.setCantidad(cantidad);
        apuesta.setTipo(tipoApuesta); // Consider using an Enum for bet types too
        apuesta.setValorApostado(valorApuesta);

        // Create the bet via ApuestaService (checks balance, saves initial bet)
        Apuesta apuestaCreada = apuestaService.crearApuesta(apuesta);

        // *** REMOVED random number generation ***
        // int numeroGanador = random.nextInt(37); // 0-36  <- REMOVED

        // *** USE the numeroGanadorFrontend provided ***
        String colorGanador = obtenerColorNumero(numeroGanadorFrontend);
        String paridadGanadora = (numeroGanadorFrontend == 0) ? "cero" : (numeroGanadorFrontend % 2 == 0 ? "par" : "impar");

        log.info("Processing bet based on frontend result: Number={}, Color={}, Parity={}", numeroGanadorFrontend, colorGanador, paridadGanadora);

        // Determine if the bet won using the frontend's number
        boolean gano = determinarResultadoApuesta(apuestaCreada, numeroGanadorFrontend, colorGanador, paridadGanadora);

        // Resolve the bet (updates balance, sets win/loss state, triggers ranking update)
        // Pass the frontend number to be potentially stored with the bet result if needed by resolverApuesta
        // Modify resolverApuesta if you need to store the actual winning number on the Apuesta entity
        return apuestaService.resolverApuesta(apuestaCreada.getId(), gano /*, numeroGanadorFrontend (optional) */);
    }

    /**
     * Determines if the bet won based on the winning number, color, and parity.
     * (No changes needed in this helper method's logic)
     *
     * @param apuesta           The bet being checked.
     * @param numeroGanador     The winning number (0-36).
     * @param colorGanador      The winning color ("rojo", "negro", "verde").
     * @param paridadGanadora   The winning parity ("par", "impar", "cero").
     * @return true if the bet won, false otherwise.
     */
    private boolean determinarResultadoApuesta(Apuesta apuesta, int numeroGanador, String colorGanador, String paridadGanadora) {
        String tipo = apuesta.getTipo().toLowerCase();
        String valor = apuesta.getValorApostado().toLowerCase();

        switch (tipo) {
            case "numero":
                try {
                    int numeroApostado = Integer.parseInt(valor);
                    return numeroApostado == numeroGanador;
                } catch (NumberFormatException e) {
                    log.warn("Invalid number format for 'numero' bet: {}", valor);
                    return false; // Invalid bet value
                }
            case "color":
                return valor.equals(colorGanador);
            case "paridad": // Assuming "par" or "impar" from frontend too
                return valor.equals(paridadGanadora);
            // Add cases for other bet types (e.g., dozen, column, high/low) if needed
            // Ensure frontend bet values match expected values here (e.g., 'rojo', 'par', '1', 'bajo')
            case "docena":
                 try {
                     int numGanador = numeroGanador;
                     if (numGanador == 0) return false; // 0 is not in any dozen
                     int dozenApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int dozenGanadora = (int) Math.ceil((double) numGanador / 12.0);
                     return dozenApostada == dozenGanadora;
                 } catch (NumberFormatException | ArithmeticException e) {
                      log.warn("Invalid value for 'docena' bet: {} or error calculating dozen for {}", valor, numeroGanador, e);
                      return false;
                 }
             case "columna":
                 try {
                     int numGanador = numeroGanador;
                     if (numGanador == 0) return false; // 0 is not in any column
                     int colApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int colGanadora = (numGanador % 3 == 0) ? 3 : numGanador % 3;
                     return colApostada == colGanadora;
                 } catch (NumberFormatException e) {
                      log.warn("Invalid value for 'columna' bet: {}", valor, e);
                      return false;
                 }
             case "mitad": // Expecting "bajo" (1-18) or "alto" (19-36)
                 if (numeroGanador == 0) return false; // 0 is neither high nor low
                 boolean esBajo = numeroGanador >= 1 && numeroGanador <= 18;
                 if (valor.equals("bajo")) {
                     return esBajo;
                 } else if (valor.equals("alto")) {
                     return !esBajo;
                 } else {
                     log.warn("Invalid value for 'mitad' bet: {}", valor);
                     return false;
                 }

            default:
                 log.warn("Unknown bet type encountered: {}", tipo);
                return false; // Unknown bet type
        }
    }

    /**
     * Gets the color corresponding to a roulette number.
     * (No changes needed in this helper method)
     *
     * @param numero The number (0-36).
     * @return "rojo", "negro", or "verde".
     */
    private String obtenerColorNumero(int numero) {
        if (numero == 0) return "verde";
        // Standard European roulette coloring
        if ((numero >= 1 && numero <= 10) || (numero >= 19 && numero <= 28)) {
            return (numero % 2 != 0) ? "rojo" : "negro"; // Odd are red, Even are black
        } else { // Numbers 11-18 and 29-36
            return (numero % 2 != 0) ? "negro" : "rojo"; // Odd are black, Even are red
        }
    }
}