package udaw.casino.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import udaw.casino.dto.DiceGameResponseDTO;
import udaw.casino.dto.PlaceBetRequestDTO;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.model.Juego;
import udaw.casino.model.Usuario;
import udaw.casino.repository.ApuestaRepository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class DadosService {

    private final ApuestaService apuestaService;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService;
    private final ApuestaRepository apuestaRepository;
    private final Random random = new Random();

    @Transactional
    public DiceGameResponseDTO jugar(PlaceBetRequestDTO betRequest) {
        log.info("Received dice game request: {}", betRequest);

        // 1. Fetch User and Game
        Usuario usuario = usuarioService.obtenerUsuarioPorId(betRequest.getUsuarioId());
        Juego juego = juegoService.obtenerJuegoPorId(betRequest.getJuegoId()); // Assuming game ID 2 is Dice

        // 2. Validate Balance
        if (usuario.getBalance() < betRequest.getCantidad()) {
            throw new SaldoInsuficienteException("Insufficient balance to place bet.");
        }

        // 3. Create Pending Bet
        Apuesta apuesta = new Apuesta();
        apuesta.setUsuario(usuario);
        apuesta.setJuego(juego);
        apuesta.setCantidad(betRequest.getCantidad());
        apuesta.setTipo(betRequest.getTipo());
        apuesta.setValorApostado(betRequest.getValorApostado());
        apuesta.setFechaApuesta(LocalDateTime.now());
        apuesta.setEstado("PENDIENTE");
        apuesta.setWinloss(0.0); // Initialize winloss

        // Deduct bet amount *before* rolling
        usuarioService.actualizarSaldoUsuario(usuario.getId(), usuario.getBalance() - betRequest.getCantidad());
        log.info("Deducted {} from user {} balance. New balance approx: {}", betRequest.getCantidad(), usuario.getUsername(), usuario.getBalance() - betRequest.getCantidad());


        Apuesta pendingApuesta = apuestaRepository.save(apuesta);
        log.info("Created pending bet with ID: {}", pendingApuesta.getId());


        // 4. Roll Dice
        int die1 = random.nextInt(6) + 1; // 1-6
        int die2 = random.nextInt(6) + 1; // 1-6
        int totalSum = die1 + die2;
        log.info("Dice roll results: {} + {} = {}", die1, die2, totalSum);

        // 5. Determine Win/Loss
        boolean gano = determinarResultadoApuesta(pendingApuesta, totalSum);
        log.info("Bet {} result: {}", pendingApuesta.getId(), gano ? "WON" : "LOST");


        // 6. Resolve Bet (updates state, winloss, and user balance if won)
        Apuesta resolvedApuesta = apuestaService.resolverApuesta(pendingApuesta.getId(), gano);
        log.info("Resolved bet {}: State={}, WinLoss={}", resolvedApuesta.getId(), resolvedApuesta.getEstado(), resolvedApuesta.getWinloss());


        // 7. Construct and Return Response
        List<Integer> diceResults = Arrays.asList(die1, die2);
        return new DiceGameResponseDTO(diceResults, resolvedApuesta);
    }

    private boolean determinarResultadoApuesta(Apuesta apuesta, int totalSum) {
        String tipo = apuesta.getTipo();
        String valorApostado = apuesta.getValorApostado();

        switch (tipo.toLowerCase()) {
            case "parimpar":
                boolean esPar = totalSum % 2 == 0;
                return ("par".equalsIgnoreCase(valorApostado) && esPar) ||
                       ("impar".equalsIgnoreCase(valorApostado) && !esPar);
            case "numero":
                try {
                    int numeroApostado = Integer.parseInt(valorApostado);
                    return totalSum == numeroApostado;
                } catch (NumberFormatException e) {
                    log.error("Invalid number format for 'numero' bet type: {}", valorApostado);
                    return false; // Invalid bet value
                }
            // Add other dice bet types here if needed (e.g., specific combo, higher/lower than 7)
            default:
                log.warn("Unknown dice bet type: {}", tipo);
                return false; // Unknown bet type always loses
        }
    }
}
