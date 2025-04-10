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
        // Deduct bet amount
        usuarioService.actualizarSaldoUsuario(usuario.getId(), usuario.getBalance() - apuesta.getCantidad());
        log.info("Deducted {} from user {} balance for bet. New balance: {}", apuesta.getCantidad(), usuario.getUsername(), usuario.getBalance() - apuesta.getCantidad());

        // Set initial bet state
        apuesta.setFechaApuesta(LocalDateTime.now());
        apuesta.setEstado("PENDIENTE"); // Initial state
        apuesta.setWinloss(0.0); // No win/loss yet
        // Fetching it again ensures we have the state after balance update if not using the returned object from updateUserBalance.
        apuesta.setUsuario(usuarioService.obtenerUsuarioPorId(usuario.getId()));

        return apuestaRepository.save(apuesta);
    }


    @Transactional
    public Apuesta resolverApuesta(Apuesta apuesta) {
        Long apuestaId = apuesta.getId();
        if (!"PENDIENTE".equals(apuesta.getEstado())) {
             log.warn("Attempted to resolve an already resolved bet (ID: {}, Status: {})", apuestaId, apuesta.getEstado());
             return apuesta; 
        }

        Usuario usuario = apuesta.getUsuario();
        double gananciaTotal = apuesta.getWinloss();
    

        if (gananciaTotal > 0) {
            apuesta.setEstado("GANADA");
        double nuevoBalance = usuario.getBalance() + gananciaTotal + apuesta.getCantidad();
        usuario.setBalance(nuevoBalance);
        } else {
            apuesta.setEstado("PERDIDA");// ya restamos la apuesta al hacerla
        }
        // Save the updated bet status and win/loss amount
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