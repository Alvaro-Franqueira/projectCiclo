package udaw.casino.service;

import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import udaw.casino.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

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
    public Apuesta jugarRuleta(Long usuarioId, double cantidad, String tipoApuesta, String valorApuesta, String numeroGanadorController) {
        // --- Validation ---

        
        Usuario usuario = usuarioService.obtenerUsuarioPorId(usuarioId);
        Juego juegoRuleta = juegoService.obtenerJuegoPorNombre(ROULETTE_GAME_NAME);

        log.info("User {} playing Roulette (Game ID: {}) with bet type: {}, value: {}, amount: {}. Frontend winning number: {}",
                 usuario.getUsername(), juegoRuleta.getId(), tipoApuesta, valorApuesta, cantidad, numeroGanadorController);

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
        apuestaCreada.setValorGanador(numeroGanadorController);
        Double ganancia = determinarResultadoRuleta(apuestaCreada, numeroGanadorController);
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
    private Double determinarResultadoRuleta(Apuesta apuesta, String numeroGanadorStr) {
        String tipo = apuesta.getTipoApuesta();
        String valor = apuesta.getValorApostado();
        
        // Log the bet and winning number for debugging, development only    
        log.info("Determining result for bet: type={}, value={}, winning number={}", 
                tipo, valor, numeroGanadorStr);

        int numeroGanador = Integer.parseInt(numeroGanadorStr); // for calculations
        String colorGanador = obtenerColorNumero(numeroGanadorStr);
        

        
        // Process the bet based on its type
        switch (tipo.toLowerCase()) {
            case "numero":// Direct number bet (pays 35:1)
                if (valor.equals(numeroGanadorStr)) { // checks 0 and 00
                    // development only
                    log.info("Number bet win: bet value '{}' matches winning number '{}'", valor, numeroGanadorStr);
                    return apuesta.getCantidad() * 35; 
                } else {
                    log.info("Number bet loss: bet value '{}' does not match winning number '{}'", valor, numeroGanadorStr);
                    return -apuesta.getCantidad(); 
                }
                
            case "color": // expects 1 for red and 2 for black
                if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are not red or black
                if ((colorGanador.equals("rojo") && valor.equals("1")) || 
                    (colorGanador.equals("negro") && valor.equals("2"))) {
                    return apuesta.getCantidad(); // Winning bet
                } else {
                    return -apuesta.getCantidad(); // Losing bet
                }
            
                 
            case "paridad": // Assuming "par" or "impar" from frontend
            if (numeroGanador == 0) return -apuesta.getCantidad(); 
                String paridadGanadora;
                paridadGanadora = (numeroGanador % 2 == 0) ? "par" : "impar";

                if (valor.equals(paridadGanadora)){
                    return apuesta.getCantidad();
                } else {
                    return -apuesta.getCantidad();
                }
            // Ensure frontend bet values match expected values here (e.g., 'rojo', 'par', '1', 'bajo')
            case "docena": // Winning dozen pays 2:1
                 try {
                     if (numeroGanador == 0) return -apuesta.getCantidad(); 
                     int docenaApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int docenaGanadora = (int) Math.ceil((double) numeroGanador / 12.0);
                     return docenaApostada == docenaGanadora ? apuesta.getCantidad() * 2 : -apuesta.getCantidad();
                 } catch (NumberFormatException | ArithmeticException e) {
                      log.warn("Invalid value for 'docena' bet: {} or error calculating dozen for {}", valor, numeroGanador, e);
                      return null; 
                 }
             case "columna":
                 try {
                     if (numeroGanador == 0) return -apuesta.getCantidad(); 
                     int colApostada = Integer.parseInt(valor); // Expecting "1", "2", or "3"
                     int colGanadora = (numeroGanador % 3 == 0) ? 3 : numeroGanador % 3;
                     return colApostada == colGanadora ?  apuesta.getCantidad() * 2 : -apuesta.getCantidad();
                 } catch (NumberFormatException e) {
                      log.warn("Invalid value for 'columna' bet: {}", valor, e);
                      return null;
                 }
             case "mitad": // Expecting "bajo" (1-18) or "alto" (19-36)
                 if (numeroGanador == 0) return -apuesta.getCantidad(); // 0 and 00 are neither high nor low
                 boolean esBajoGanador = numeroGanador >= 1 && numeroGanador <= 18;
                 boolean esBajoApuesta = valor.equals("bajo");
                 return (esBajoGanador == esBajoApuesta) ? apuesta.getCantidad() : -apuesta.getCantidad(); 

            default:
                 log.warn("Unknown bet type encountered: {}", tipo);
                return null;
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
            // Standard American roulette coloring
            ArrayList<String> rojos = new ArrayList<>(java.util.Arrays.asList("1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"));
            if (rojos.contains(numeroStr)) return "rojo";
            return "negro";
        } catch (NumberFormatException e) {
            log.error("Invalid number format for color determination: {}", numeroStr);
            return "verde"; // Default to green for invalid numbers
        }
    } 
}