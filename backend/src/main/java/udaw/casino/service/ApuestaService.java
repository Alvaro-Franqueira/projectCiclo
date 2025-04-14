package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.SaldoInsuficienteException;
import udaw.casino.model.Apuesta;
import udaw.casino.model.Usuario;
import udaw.casino.repository.ApuestaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApuestaService {

    private static final Logger log = LoggerFactory.getLogger(ApuestaService.class);

    private final ApuestaRepository apuestaRepository;
    private final UsuarioService usuarioService;
    private final JuegoService juegoService;
    public ApuestaService(ApuestaRepository apuestaRepository, UsuarioService usuarioService, JuegoService juegoService) {
        this.juegoService = juegoService; 
        this.apuestaRepository = apuestaRepository;
        this.usuarioService = usuarioService;
    }


    @Transactional
    public Apuesta crearApuesta(Apuesta apuesta) {
        // Ensure user and game objects are valid and attached
        if (apuesta.getUsuario() == null || apuesta.getUsuario().getId() == null) {
            throw new IllegalArgumentException("Apuesta must have a valid Usuario.");
        }
         if (apuesta.getJuego() == null || apuesta.getJuego().getId() == null) {
            throw new IllegalArgumentException("Apuesta must have a valid Juego.");
        }
        // Fetch the latest user state to ensure balance is current
        Usuario usuario = usuarioService.obtenerUsuarioPorId(apuesta.getUsuario().getId());
        // Check balance
        if (usuario.getBalance() < apuesta.getCantidad()) {
            throw new SaldoInsuficienteException("Saldo insuficiente para realizar la apuesta. Saldo actual: " + usuario.getBalance());
        }
        
        // IMPORTANT: We no longer deduct the bet amount here
        // The balance will be updated in the game service based on the winloss result
        log.info("Creating bet for user {} with amount {}", usuario.getUsername(), apuesta.getCantidad());

        // Set initial bet state
        apuesta.setFechaApuesta(LocalDateTime.now());
        apuesta.setEstado("PENDIENTE"); // Initial state
        apuesta.setWinloss(0.0); // No win/loss yet
        apuesta.setUsuario(usuario);

        return apuestaRepository.save(apuesta);
    }


    @Transactional
    public Apuesta resolverApuesta(Apuesta apuesta) {
        Long apuestaId = apuesta.getId();
        if (!"PENDIENTE".equals(apuesta.getEstado())) {
             log.warn("Attempted to resolve an already resolved bet (ID: {}, Status: {})", apuestaId, apuesta.getEstado());
             return apuesta; 
        }

        // Set the status based on winloss
        if (apuesta.getWinloss() > 0) {
            apuesta.setEstado("GANADA");
        } else {
            apuesta.setEstado("PERDIDA");
        }
        
        // IMPORTANT: We no longer modify the balance here
        // The balance is updated in the game service
        
        // Save the updated bet status
        Apuesta apuestaResuelta = apuestaRepository.save(apuesta);
        log.info("Bet {} resolved. Status: {}, Win/Loss: {}", apuestaId, apuestaResuelta.getEstado(), apuestaResuelta.getWinloss());
 
        return apuestaResuelta;
    }
    public Apuesta obtenerApuestaPorId(Long id) {
        return apuestaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apuesta", "id", id));
    }

    public List<Apuesta> obtenerApuestasPorUsuario(Long usuarioId) {
        try {
            usuarioService.obtenerUsuarioPorId(usuarioId);
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("Usuario", "id", usuarioId);
        }
        return apuestaRepository.findByUsuarioIdOrderByFechaApuestaDesc(usuarioId); // Example ordering
    }

     public List<Apuesta> obtenerApuestasPorJuego(Long juegoId) {
        try {
             juegoService.obtenerJuegoPorId(juegoId); 
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("Juego", "id", juegoId);
        }
        return apuestaRepository.findByJuegoIdOrderByFechaApuestaDesc(juegoId); // Example ordering
    }

    public List<Apuesta> obtenerApuestasPorUsuarioYJuego(Long usuarioId, Long juegoId) {
        try {
            usuarioService.obtenerUsuarioPorId(usuarioId);
            juegoService.obtenerJuegoPorId(juegoId);
        } catch (ResourceNotFoundException e) {
            throw e; // Re-throw the exception with the original message
        }
        
        return apuestaRepository.findByUsuarioIdAndJuegoIdOrderByFechaApuestaDesc(usuarioId, juegoId);
    }

    public List<Apuesta> obtenerTodasLasApuestas() {
        return apuestaRepository.findAll();
    }
}