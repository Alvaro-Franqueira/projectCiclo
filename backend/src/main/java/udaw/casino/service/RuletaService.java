package udaw.casino.service;

import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import udaw.casino.repository.UsuarioRepository;
import udaw.casino.exception.ResourceNotFoundException; 
import udaw.casino.exception.SaldoInsuficienteException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.transaction.Transactional;


@Service
public class RuletaService {

    // NAME OF THE GAME
    private static final String ROULETTE_GAME_NAME = "Roulette"; // Define game name constant

    private static final Logger log = LoggerFactory.getLogger(RuletaService.class);

    private final ApuestaService apuestaService;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService; 
    private final UsuarioRepository userRepository; 
    // Constructor remains the same
    public RuletaService(UsuarioRepository userRepository, ApuestaService apuestaService, UsuarioService usuarioService, JuegoService juegoService) {
        this.apuestaService = apuestaService;
        this.usuarioService = usuarioService;
        this.juegoService = juegoService;
        this.userRepository = userRepository; // Initialize the user repository
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
    @Transactional
    public Apuesta jugarRuleta(Long usuarioId, double cantidad, String tipoApuesta, String valorApuesta, int numeroGanadorFrontend) {


        // --- Validation ---
        if (usuarioId == null) {
            log.error("User ID is required but not provided.");
            throw new IllegalArgumentException("ID de usuario es requerido pero no se proporcionó.");
        }
        if (cantidad <= 0) {
            log.error("Invalid bet amount: {}. Must be greater than 0.", cantidad);
            throw new IllegalArgumentException("Cantidad de apuesta inválida: " + cantidad + ". Debe ser mayor que 0.");
        }   
        if (tipoApuesta == null || tipoApuesta.isEmpty()) {
            log.error("Bet type is required but not provided.");
            throw new IllegalArgumentException("Tipo de apuesta es requerido pero no se proporcionó.");
        }
        if (valorApuesta == null || valorApuesta.isEmpty()) {
            log.error("Bet value is required but not provided.");
            throw new IllegalArgumentException("Valor de apuesta es requerido pero no se proporcionó.");
        }
        if (numeroGanadorFrontend < 0 || numeroGanadorFrontend > 36) {
             log.error("Invalid winning number received from client: {}. Must be between 0 and 36.", numeroGanadorFrontend);
             // Throw an exception that the controller can catch and return as a Bad Request
             throw new IllegalArgumentException("Número ganador inválido: " + numeroGanadorFrontend + ". Debe estar entre 0 y 36.");
        }


        Usuario usuario = usuarioService.obtenerUsuarioPorId(usuarioId);
        Juego juegoRuleta = juegoService.obtenerJuegoPorNombre(ROULETTE_GAME_NAME);

        log.info("User {} playing Roulette (Game ID: {}) with bet type: {}, value: {}, amount: {}. Frontend winning number: {}",
                 usuario.getUsername(), juegoRuleta.getId(), tipoApuesta, valorApuesta, cantidad, numeroGanadorFrontend);

        // Create the bet object (ApuestaService handles balance check)
        Apuesta apuesta = new Apuesta();
        apuesta.setUsuario(usuario);
        apuesta.setJuego(juegoRuleta); // Set the fetched game object
        apuesta.setCantidad(cantidad);
        apuesta.setTipoApuesta(tipoApuesta); // Consider using an Enum for bet types too
        apuesta.setValorApostado(valorApuesta);

        // Create the bet via ApuestaService (checks balance, saves initial bet)
        Apuesta apuestaCreada = apuestaService.crearApuesta(apuesta);

        log.info("Processing bet based on frontend result: Number={}, Color={}, Parity={}", numeroGanadorFrontend);

        // Determine if the bet won using the frontend's number
        
            apuestaCreada.setWinloss(determinarResultadoApuesta(apuestaCreada, numeroGanadorFrontend)); // Use the frontend number for result calculation
            log.info("Bet won(maybe)! User: {}, Bet ID: {}, Winning Number: {}", usuario.getUsername(), apuestaCreada.getId(), numeroGanadorFrontend);

            Double balance = usuario.getBalance() + apuestaCreada.getWinloss(); // Calculate new balance based on win/loss
            
            userRepository.save(usuarioService.actualizarSaldoUsuario(usuario.getId(), balance)); // Update user balance based on win/loss

        // Resolve the bet (updates balance, sets win/loss state, triggers ranking update)
        // Pass the frontend number to be potentially stored with the bet result if needed by resolverApuesta
        // Modify resolverApuesta if you need to store the actual winning number on the Apuesta entity
        return apuestaService.resolverApuesta(apuestaCreada);
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
    private Double determinarResultadoApuesta(Apuesta apuesta, int numeroGanador) {
        String tipo = apuesta.getTipoApuesta().toLowerCase();
        String valor = apuesta.getValorApostado().toLowerCase();
        String colorGanador = obtenerColorNumero(numeroGanador);
        String paridadGanadora = (numeroGanador == 0) ? "cero" : (numeroGanador % 2 == 0) ? "par" : "impar";

        switch (tipo) {
            case "numero":
                try {
                    int numeroApostado = Integer.parseInt(valor);
                    if (numeroApostado == numeroGanador){
                        return apuesta.getCantidad() * 35; 
                    } else {
                        return -apuesta.getCantidad(); 
                    }
                } catch (NumberFormatException e) {
                    log.warn("Invalid number format for 'numero' bet: {}", valor);
                    return null; // Invalid bet value
                }
                case "color": // expects 1 for red and 2 for black
                if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 is not red or black
                if ((colorGanador.equals("rojo") && valor.equals("1")) || 
                    (colorGanador.equals("negro") && valor.equals("2"))) {
                    return apuesta.getCantidad(); // Winning bet
                } else {
                    return -apuesta.getCantidad(); // Losing bet
                }
            
                 
            case "paridad": // Assuming "par" or "impar" from frontend too
                if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 is neither even nor odd
                if (valor.equals(paridadGanadora)){
                    return apuesta.getCantidad(); // Winning bet
                } else {
                    return -apuesta.getCantidad(); // Losing bet
                }
            // Ensure frontend bet values match expected values here (e.g., 'rojo', 'par', '1', 'bajo')
            case "docena":
                 try {
                     if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 is not in any dozen
                     int docenaApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int docenaGanadora = (int) Math.ceil((double) numeroGanador / 12.0);
                     return docenaApostada == docenaGanadora ? apuesta.getCantidad() * 2 : -apuesta.getCantidad(); // Winning dozen pays 2:1
                 } catch (NumberFormatException | ArithmeticException e) {
                      log.warn("Invalid value for 'docena' bet: {} or error calculating dozen for {}", valor, numeroGanador, e);
                      return null; 
                 }
             case "columna":
                 try {
                     if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 is not in any column
                     int colApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int colGanadora = (numeroGanador % 3 == 0) ? 3 : numeroGanador % 3;
                     if (colApostada == colGanadora) { return apuesta.getCantidad() * 2;}
                        else{return -apuesta.getCantidad();} // Losing bet
                 } catch (NumberFormatException e) {
                      log.warn("Invalid value for 'columna' bet: {}", valor, e);
                      return null;
                 }
             case "mitad": // Expecting "bajo" (1-18) or "alto" (19-36)
                 if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 is neither high nor low
                 boolean esBajoGanador = numeroGanador >= 1 && numeroGanador <= 18;
                 boolean esBajoApuesta = valor.equals("bajo");
                 return (esBajoGanador == esBajoApuesta) ? apuesta.getCantidad() : -apuesta.getCantidad(); // Winning bet

            default:
                 log.warn("Unknown bet type encountered: {}", tipo);
                return null; // Unknown bet type
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
        // Standard American roulette coloring
        int[] rojos = {
            1, 3, 5, 7, 9, 12, 14, 16, 18,
            19, 21, 23, 25, 27, 30, 32, 34, 36
        };        
        for (int rojo : rojos) {
            if (numero == rojo) return "rojo";
        }
        return "negro";
} 
}