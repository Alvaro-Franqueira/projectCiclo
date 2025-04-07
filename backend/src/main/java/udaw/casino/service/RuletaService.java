package udaw.casino.service;

import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.transaction.Transactional;

import java.util.Random;

@Service
public class RuletaService {

    private static final Logger log = LoggerFactory.getLogger(RuletaService.class);
    private static final String ROULETTE_GAME_NAME = "Roulette"; // Define game name constant

    private final ApuestaService apuestaService;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService; // Inject JuegoService
    private final Random random = new Random();

    @Autowired
    public RuletaService(ApuestaService apuestaService, UsuarioService usuarioService, JuegoService juegoService) {
        this.apuestaService = apuestaService;
        this.usuarioService = usuarioService;
        this.juegoService = juegoService; // Initialize JuegoService
    }

    /**
     * Handles playing a round of Roulette.
     * Finds the Roulette game dynamically, creates the bet, determines the result,
     * and resolves the bet.
     *
     * @param usuarioId   The ID of the user playing.
     * @param cantidad    The amount being bet.
     * @param tipoApuesta The type of bet (e.g., "numero", "color", "paridad").
     * @param valorApuesta The specific value bet on (e.g., "17", "rojo", "par").
     * @return The resolved Apuesta object.
     * @throws ResourceNotFoundException if the user or the Roulette game is not found.
     * @throws SaldoInsuficienteException if the user has insufficient balance.
     */
    @Transactional // Ensure atomicity
    public Apuesta jugarRuleta(Long usuarioId, double cantidad, String tipoApuesta, String valorApuesta) {
        Usuario usuario = usuarioService.obtenerUsuarioPorId(usuarioId);

        // Find the Roulette game dynamically by name
        Juego juegoRuleta = juegoService.obtenerJuegoPorNombre(ROULETTE_GAME_NAME);
        // If obtenerJuegoPorNombre throws ResourceNotFoundException, it propagates up

        log.info("User {} playing Roulette (Game ID: {}) with bet type: {}, value: {}, amount: {}",
                 usuario.getUsername(), juegoRuleta.getId(), tipoApuesta, valorApuesta, cantidad);

        // Create the bet object (ApuestaService handles balance check)
        Apuesta apuesta = new Apuesta();
        apuesta.setUsuario(usuario);
        apuesta.setJuego(juegoRuleta); // Set the fetched game object
        apuesta.setCantidad(cantidad);
        apuesta.setTipo(tipoApuesta); // Consider using an Enum for bet types too
        apuesta.setValorApostado(valorApuesta);

        // Create the bet via ApuestaService (checks balance, saves initial bet)
        Apuesta apuestaCreada = apuestaService.crearApuesta(apuesta);

        // Determine the outcome
        int numeroGanador = random.nextInt(37); // 0-36
        String colorGanador = obtenerColorNumero(numeroGanador);
        String paridadGanadora = (numeroGanador == 0) ? "cero" : (numeroGanador % 2 == 0 ? "par" : "impar");

        log.info("Roulette spin result: Number={}, Color={}, Parity={}", numeroGanador, colorGanador, paridadGanadora);

        // Determine if the bet won
        boolean gano = determinarResultadoApuesta(apuestaCreada, numeroGanador, colorGanador, paridadGanadora);

        // Resolve the bet (updates balance, sets win/loss state, triggers ranking update)
        return apuestaService.resolverApuesta(apuestaCreada.getId(), gano);
    }

    /**
     * Determines if the bet won based on the winning number, color, and parity.
     *
     * @param apuesta          The bet being checked.
     * @param numeroGanador    The winning number (0-36).
     * @param colorGanador     The winning color ("rojo", "negro", "verde").
     * @param paridadGanadora  The winning parity ("par", "impar", "cero").
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
            case "paridad": // Assuming "par" or "impar"
                return valor.equals(paridadGanadora);
            // Add cases for other bet types (e.g., dozen, column, high/low) if needed
            default:
                 log.warn("Unknown bet type encountered: {}", tipo);
                return false; // Unknown bet type
        }
    }

    /**
     * Gets the color corresponding to a roulette number.
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