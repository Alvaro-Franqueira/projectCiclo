package udaw.casino.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DadosService {

    private final ApuestaService apuestaService;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService;

    @Transactional
    public Apuesta jugarDados(Apuesta apuesta, int sumDados) {
        log.info("Processing dice game with bet: {}", apuesta);
        log.info("Received dice game request: {}", apuesta);

        // Validation
        if (apuesta.getCantidad() <= 0) {
            log.error("Invalid bet amount: {}. Must be greater than 0.", apuesta.getCantidad());
            throw new IllegalArgumentException("Cantidad de apuesta inválida: " + apuesta.getCantidad() + ". Debe ser mayor que 0.");
        }
        if (apuesta.getTipoApuesta() == null || apuesta.getValorApostado() == null) {
            log.error("Bet type or value is null.");
            throw new IllegalArgumentException("Tipo de apuesta o valor apostado no pueden ser nulos.");
        }
        // Fetch user and game
        Usuario usuario = usuarioService.obtenerUsuarioPorId(apuesta.getUsuario().getId());
        Juego juego = juegoService.obtenerJuegoPorId(apuesta.getJuego().getId());
        if (usuario == null || juego == null) {
            log.error("User or game not found. User ID: {}, Game ID: {}", apuesta.getUsuario().getId(), apuesta.getJuego().getId());
            throw new ResourceNotFoundException("Usuario o juego no encontrado.");
        }
        // Check user balance
        if (usuario.getBalance() < apuesta.getCantidad()) {
            log.error("Insufficient balance for user ID: {}. Required: {}, Available: {}", usuario.getId(), apuesta.getCantidad(), usuario.getBalance());
            throw new SaldoInsuficienteException("Saldo insuficiente para realizar la apuesta.");
        }
        
        // Get the current balance before any changes
        double startingBalance = usuario.getBalance();
        log.info("User balance before bet: {}", startingBalance);
        
        // First, deduct the bet amount from the user's balance
        double balanceAfterBet = startingBalance - apuesta.getCantidad();
        usuario.setBalance(balanceAfterBet);
        log.info("Balance after deducting bet: {}", balanceAfterBet);
        
        // Create the bet (ApuestaService no longer modifies the balance)
        Apuesta apuestaCreada = apuestaService.crearApuesta(apuesta);
        log.info("Processing bet based on dice roll result: Number={}", sumDados);

        // Set the winning number and calculate win/loss amount
        apuestaCreada.setValorGanador(String.valueOf(sumDados));
        
        // Calculate the win/loss amount
        // For wins: determinarResultadoApuesta returns a positive amount (the winnings)
        // For losses: determinarResultadoApuesta returns -cantidad (the negative bet amount)
        double winAmount = determinarResultadoApuesta(apuestaCreada, sumDados);
        
        // Store the winloss value in the bet
        // For wins: this is the net profit (not including the original bet)
        // For losses: this is the negative bet amount
        apuestaCreada.setWinloss(winAmount);
        
        // Calculate final balance
        double finalBalance;
        if (winAmount > 0) {
            // If player won, add the winnings AND return the original bet
            finalBalance = balanceAfterBet + winAmount + apuesta.getCantidad();
            log.info("User won {}. Returning bet {} plus winnings. New balance: {}", 
                     winAmount, apuesta.getCantidad(), finalBalance);
            apuestaCreada.setEstado("GANADA");
        } else {
            // If player lost, the bet amount was already deducted
            finalBalance = balanceAfterBet;
            log.info("User lost {}. New balance: {}", Math.abs(winAmount), finalBalance);
            apuestaCreada.setEstado("PERDIDA");
        }
        
        // Update the user's balance
        usuario.setBalance(finalBalance);
        usuarioService.actualizarSaldoUsuario(usuario.getId(), finalBalance);
        
        // Resolve the bet using the ApuestaService
        return apuestaService.resolverApuesta(apuestaCreada);


    }

    private static final Map<Integer, Double> NUMERO_ODDS = Map.ofEntries(
        Map.entry(2, 30.0),
        Map.entry(3, 15.0),
        Map.entry(4, 10.0),
        Map.entry(5, 8.0),
        Map.entry(6, 6.0),
        Map.entry(7, 5.0),
        Map.entry(8, 6.0),
        Map.entry(9, 8.0),
        Map.entry(10, 10.0),
        Map.entry(11, 15.0),
        Map.entry(12, 30.0)
    );
    
    
    private Double determinarResultadoApuesta(Apuesta apuesta, int totalSum) {
        String tipo = apuesta.getTipoApuesta().toLowerCase();
        String valorApostado = apuesta.getValorApostado().toLowerCase();
        double cantidad = apuesta.getCantidad();
    
        switch (tipo) {
            case "numero":
                int numeroApostado = Integer.parseInt(valorApostado);
                if (numeroApostado == totalSum) {
                    double payout = NUMERO_ODDS.getOrDefault(numeroApostado, 0.0);
                    return cantidad * payout;
                } else {
                    return -cantidad;
                }
    
            case "mitad":
                // mitad 1: 2–6, mitad 2: 7–12
                int mitad = totalSum <= 6 ? 1 : 2;
                return valorApostado.equals(String.valueOf(mitad)) ? cantidad * 0.95 : -cantidad;
    
            case "parimpar":
                boolean esPar = totalSum % 2 == 0;
                boolean eligioPar = valorApostado.equals("par");
                return (esPar == eligioPar) ? cantidad * 0.95 : -cantidad;
    
            default:
            log.warn("Unknown bet type encountered: {}", tipo);
                return null; // apuesta inválida
        }
    }
    

}
    
