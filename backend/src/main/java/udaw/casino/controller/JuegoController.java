package udaw.casino.controller;

import udaw.casino.model.Juego;
import udaw.casino.service.JuegoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class JuegoController {

    @Autowired
    private JuegoService juegoService;

    @PostMapping("/juegos")
    public Juego crearJuego(@RequestBody Juego juego) {
        return juegoService.crearJuego(juego);
    }

    // Otros endpoints para gestionar juegos
}