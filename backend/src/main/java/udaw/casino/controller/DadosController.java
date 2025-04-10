package udaw.casino.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import udaw.casino.dto.PlaceBetRequestDTO;
import udaw.casino.model.Apuesta;
import udaw.casino.service.DadosService;
import udaw.casino.service.UsuarioService;

@RestController
@RequestMapping("/api/dados") // Base path for dice game endpoints
@RequiredArgsConstructor

public class DadosController {
    @Autowired
    private final DadosService dadosService;
    private final UsuarioService usuarioService;
    @PostMapping("/jugar")
    public ResponseEntity<Apuesta> jugarDados(@RequestBody PlaceBetRequestDTO betRequest) {
        // Consider adding validation for the request body here

        String dados = betRequest.getValorGanador();
        Apuesta apuesta = new Apuesta();
        apuesta.setUsuario(usuarioService.obtenerUsuarioPorId(betRequest.getUsuarioId()));
        apuesta.setCantidad(betRequest.getCantidad());
        apuesta.setTipoApuesta(betRequest.getTipo());
        apuesta.setValorApostado(betRequest.getValorApostado());
        int sumaDados = Integer.parseInt(dados);
    
        Apuesta response = dadosService.jugarDados(apuesta, sumaDados);
        return ResponseEntity.ok(response);
    }

}
