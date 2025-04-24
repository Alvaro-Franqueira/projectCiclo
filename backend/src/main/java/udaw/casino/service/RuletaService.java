package udaw.casino.service;

import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import udaw.casino.repository.UsuarioRepository;
import udaw.casino.exception.ResourceNotFoundException; 
import udaw.casino.exception.SaldoInsuficienteException;
import org.springframework.stereotype.Service;

import java.util.List;

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



//For lonely bets    
    @Transactional
    public Apuesta jugarRuleta(Long usuarioId, double cantidad, String tipoApuesta, String valorApuesta, String numeroGanadorFrontend) {
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
        
        // Validate the winning number
        if (!numeroGanadorFrontend.equals("0") && !numeroGanadorFrontend.equals("00")) {
            try {
                int num = Integer.parseInt(numeroGanadorFrontend);
                if (num < 0 || num > 36) {
                    log.error("Invalid winning number received from client: {}. Must be between 0 and 36, or '00'.", numeroGanadorFrontend);
                    throw new IllegalArgumentException("Número ganador inválido: " + numeroGanadorFrontend + ". Debe estar entre 0 y 36, o ser '00'.");
                }
            } catch (NumberFormatException e) {
                log.error("Invalid winning number format received from client: {}. Must be a number between 0 and 36, or '00'.", numeroGanadorFrontend);
                throw new IllegalArgumentException("Formato de número ganador inválido: " + numeroGanadorFrontend + ". Debe ser un número entre 0 y 36, o '00'.");
            }
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
          // Determine if the bet won using the frontend's number
        apuestaCreada.setValorGanador(numeroGanadorFrontend);
        Double ganancia = determinarResultadoApuesta(apuestaCreada, numeroGanadorFrontend);
        if (ganancia == null) {
            log.error("Invalid bet type or value: type={}, value={}", tipoApuesta, valorApuesta);
            throw new IllegalArgumentException("Tipo o valor de apuesta inválido: " + tipoApuesta + ", " + valorApuesta);
        }

        // Update the bet with the result
        apuestaCreada.setWinloss(ganancia);
        
        // Update user balance based on bet result
        double nuevoSaldo = usuario.getBalance() + ganancia;
        usuario.setBalance(nuevoSaldo);
        userRepository.save(usuario);
        
        // Save the updated bet
        Apuesta apuestaFinalizada = apuestaService.resolverApuesta(apuestaCreada);
        
        log.info("Bet completed for user {}. Result: {}, New balance: {}", 
                 usuario.getUsername(), ganancia, nuevoSaldo);
        
        return apuestaFinalizada;
    }

    // Determine the result of a bet based on the winning number
    private Double determinarResultadoApuesta(Apuesta apuesta, String numeroGanadorStr) {
        String tipo = apuesta.getTipoApuesta();
        String valor = apuesta.getValorApostado();
        
        // Log the bet and winning number for debugging
        log.info("Determining result for bet: type={}, value={}, winning number={}", 
                tipo, valor, numeroGanadorStr);
        
        // Convert the winning number to an integer for calculations
        // Handle "00" as a special case
        int numeroGanador = 0;
        boolean isDoubleZero = false;
        
        if (numeroGanadorStr.equals("00")) {
            isDoubleZero = true;
            numeroGanador = -1; // Use -1 to represent "00" internally
        } else {
            try {
                numeroGanador = Integer.parseInt(numeroGanadorStr);
            } catch (NumberFormatException e) {
                log.error("Invalid winning number format: {}", numeroGanadorStr);
                return null;
            }
        }
        
        // Get the color of the winning number
        String colorGanador = obtenerColorNumero(numeroGanadorStr);
        
        // Determine the parity of the winning number
        String paridadGanadora = "ninguno"; // Default for 0 and 00
        if (!isDoubleZero && numeroGanador != 0) {
            paridadGanadora = (numeroGanador % 2 == 0) ? "par" : "impar";
        }
        
        // Process the bet based on its type
        switch (tipo.toLowerCase()) {
            case "numero":
                // Direct number bet (pays 35:1)
                // IMPORTANT: Use exact string comparison to avoid "00" matching with "0"
                if (valor.equals(numeroGanadorStr)) {
                    log.info("Number bet win: bet value '{}' matches winning number '{}'", valor, numeroGanadorStr);
                    return apuesta.getCantidad() * 35; // Winning bet
                } else {
                    log.info("Number bet loss: bet value '{}' does not match winning number '{}'", valor, numeroGanadorStr);
                    return -apuesta.getCantidad(); // Losing bet
                }
                
            case "color": // expects 1 for red and 2 for black
                if (isDoubleZero || numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are not red or black
                if ((colorGanador.equals("rojo") && valor.equals("1")) || 
                    (colorGanador.equals("negro") && valor.equals("2"))) {
                    return apuesta.getCantidad(); // Winning bet
                } else {
                    return -apuesta.getCantidad(); // Losing bet
                }
            
                 
            case "paridad": // Assuming "par" or "impar" from frontend too
                if (isDoubleZero || numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are neither even nor odd
                if (valor.equals(paridadGanadora)){
                    return apuesta.getCantidad(); // Winning bet
                } else {
                    return -apuesta.getCantidad(); // Losing bet
                }
            // Ensure frontend bet values match expected values here (e.g., 'rojo', 'par', '1', 'bajo')
            case "docena":
                 try {
                     if (isDoubleZero || numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are not in any dozen
                     int docenaApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int docenaGanadora = (int) Math.ceil((double) numeroGanador / 12.0);
                     return docenaApostada == docenaGanadora ? apuesta.getCantidad() * 2 : -apuesta.getCantidad(); // Winning dozen pays 2:1
                 } catch (NumberFormatException | ArithmeticException e) {
                      log.warn("Invalid value for 'docena' bet: {} or error calculating dozen for {}", valor, numeroGanador, e);
                      return null; 
                 }
             case "columna":
                 try {
                     if (isDoubleZero || numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are not in any column
                     int colApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int colGanadora = (numeroGanador % 3 == 0) ? 3 : numeroGanador % 3;
                     if (colApostada == colGanadora) { return apuesta.getCantidad() * 2;}
                        else{return -apuesta.getCantidad();} // Losing bet
                 } catch (NumberFormatException e) {
                      log.warn("Invalid value for 'columna' bet: {}", valor, e);
                      return null;
                 }
             case "mitad": // Expecting "bajo" (1-18) or "alto" (19-36)
                 if (isDoubleZero || numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are neither high nor low
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
     *
     * @param numeroStr The number (0-36 or "00").
     * @return "rojo", "negro", or "verde".
     */
    private String obtenerColorNumero(String numeroStr) {
        if (numeroStr.equals("0") || numeroStr.equals("00")) return "verde";
        
        try {
            int numero = Integer.parseInt(numeroStr);
            // Standard American roulette coloring
            int[] rojos = {
                1, 3, 5, 7, 9, 12, 14, 16, 18,
                19, 21, 23, 25, 27, 30, 32, 34, 36
            };        
            for (int rojo : rojos) {
                if (numero == rojo) return "rojo";
            }
            return "negro";
        } catch (NumberFormatException e) {
            log.error("Invalid number format for color determination: {}", numeroStr);
            return "verde"; // Default to green for invalid numbers
        }
    } 
}