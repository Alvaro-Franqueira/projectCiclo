package udaw.casino.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import udaw.casino.dto.ApuestaDTO;
import udaw.casino.dto.PlaceBetRequestDTO;
import udaw.casino.dto.DiceGameResponseDTO;
import udaw.casino.model.Apuesta;
import udaw.casino.service.DadosService;
import udaw.casino.service.UsuarioService;
import udaw.casino.service.JuegoService;

import java.util.Random;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/dados") // Base path for dice game endpoints
@RequiredArgsConstructor
public class DadosController {
    @Autowired
    private final DadosService dadosService;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService;
    
    private static final String DICE_GAME_NAME = "Dice";
    @PostMapping("/jugar")
    public ResponseEntity<DiceGameResponseDTO> jugarDados(@RequestBody PlaceBetRequestDTO betRequest) {
        // Validate the request body
        if (betRequest.getUsuarioId() == null || betRequest.getCantidad() <= 0 || 
            betRequest.getTipo() == null || betRequest.getValorApostado() == null) {
            return ResponseEntity.badRequest().body(null);
        }
        
        // Generate random dice values (1-6 for each die)
        Random random = new Random();
        List<Integer> diceValues = Arrays.asList(
            random.nextInt(6) + 1, // First die (1-6)
            random.nextInt(6) + 1  // Second die (1-6)
        );
        
        // Calculate the sum of dice
        int sumaDados = diceValues.get(0) + diceValues.get(1);
        
        // Create the apuesta object
        Apuesta apuesta = new Apuesta();
        apuesta.setUsuario(usuarioService.obtenerUsuarioPorId(betRequest.getUsuarioId()));
        apuesta.setCantidad(betRequest.getCantidad());
        apuesta.setTipoApuesta(betRequest.getTipo());
        apuesta.setValorApostado(betRequest.getValorApostado());
        apuesta.setJuego(juegoService.obtenerJuegoPorNombre(DICE_GAME_NAME));
        
        // Process the bet with the generated dice sum
        Apuesta resolvedBet = dadosService.jugarDados(apuesta, sumaDados);
        
        // Create and return the response DTO with ApuestaDTO to prevent circular references
        DiceGameResponseDTO response = new DiceGameResponseDTO();
        response.setDiceResults(diceValues);
        response.setResolvedBet(new ApuestaDTO(resolvedBet));
        
        return ResponseEntity.ok(response);
    }

}
