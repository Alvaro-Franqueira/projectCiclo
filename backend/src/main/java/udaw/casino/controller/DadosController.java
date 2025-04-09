package udaw.casino.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import udaw.casino.dto.DiceGameResponseDTO;
import udaw.casino.dto.PlaceBetRequestDTO;
import udaw.casino.service.DadosService;

@RestController
@RequestMapping("/api/dados") // Base path for dice game endpoints
@RequiredArgsConstructor
public class DadosController {

    private final DadosService dadosService;

    @PostMapping("/jugar")
    public ResponseEntity<DiceGameResponseDTO> jugarDados(@RequestBody PlaceBetRequestDTO betRequest) {
        // Consider adding validation for the request body here
        DiceGameResponseDTO response = dadosService.jugar(betRequest);
        return ResponseEntity.ok(response);
    }

    // Add other endpoints if needed (e.g., get game info)
}
