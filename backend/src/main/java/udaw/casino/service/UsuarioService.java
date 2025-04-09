package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UsuarioNoEncontradoException;
import udaw.casino.model.Rol;
import udaw.casino.model.Usuario;
import udaw.casino.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; 

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario registrarUsuario(Usuario usuario) {
        // Check if username already exists
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new UsuarioNoEncontradoException("Username '" + usuario.getUsername() + "' already exists.");
        }
        // Check if email already exists
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new UsuarioNoEncontradoException("Email '" + usuario.getEmail() + "' already exists.");
        }

        // Encode password before saving
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        // Set default role if not specified (though default is set in model too)
        if (usuario.getRol() == null) {
            usuario.setRol(Rol.USER);
        }

        
        if (usuario.getBalance() == null) {
            usuario.setBalance(0.0); // Default balance
        }
        if (usuario.getFechaRegistro() == null) {
            usuario.setFechaRegistro(java.time.LocalDateTime.now()); // Default registration date
        }
        return usuarioRepository.save(usuario);
    }

    public Usuario obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException());
    }


    public Usuario obtenerUsuarioPorUsername(String username) {
        return usuarioRepository.findByUsername(username) // Now returns Optional
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
    }


    public Usuario obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email) // Use Optional-returning method
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }


    public List<Usuario> obtenerTodosLosUsuarios() {
        return usuarioRepository.findAll();
    }

    /**
     * Updates an existing user.
     * Ensures the user exists before attempting update.
     * Note: Password updates should be handled carefully, potentially in a separate method.
     * This basic update method might overwrite the encoded password if not handled correctly in the input.
     *
     * @param id            The ID of the user to update.
     * @param usuarioDetails The Usuario object containing updated details.
     * @return The updated Usuario object.
     * @throws ResourceNotFoundException if user with the ID is not found.
     */
    @Transactional
    public Usuario actualizarUsuario(Usuario usuarioDetails) {
        Usuario usuario = obtenerUsuarioPorId(usuarioDetails.getId()); // throw exception if not exists
        // Check if username or email already exists (if they are being updated)
        if (usuarioDetails.getUsername() != null) {
            if (!usuarioDetails.getUsername().equals(usuario.getUsername()) && usuarioRepository.existsByUsername(usuarioDetails.getUsername())) {
                throw new UsuarioNoEncontradoException("Username '" + usuarioDetails.getUsername() + "' already exists.");
            }
        }
        if (usuarioDetails.getEmail() != null) {
            if (!usuarioDetails.getEmail().equals(usuario.getEmail()) && usuarioRepository.existsByEmail(usuarioDetails.getEmail())) {
                throw new UsuarioNoEncontradoException("Email '" + usuarioDetails.getEmail() + "' already exists.");
            }
        }
        usuario.setUsername(usuarioDetails.getUsername());
        usuario.setEmail(usuarioDetails.getEmail());     
        usuario.setBalance(usuarioDetails.getBalance());
        usuario.setRol(usuarioDetails.getRol()); 

        // Avoid updating password here unless explicitly intended and handled securely
        // if (usuarioDetails.getPassword() != null && !usuarioDetails.getPassword().isEmpty()) {
        //     usuario.setPassword(passwordEncoder.encode(usuarioDetails.getPassword()));
        // }

        return usuarioRepository.save(usuario);
    }

     /**
     * Updates only the balance of a user.
     * More specific and potentially safer than a general update.
     *
     * @param id The ID of the user.
     * @param nuevoBalance The new balance amount.
     * @return The updated Usuario object.
     * @throws ResourceNotFoundException if user with the ID is not found.
     */
    @Transactional
    public Usuario actualizarSaldoUsuario(Long id, Double nuevoBalance) {
        Usuario usuario = obtenerUsuarioPorId(id);
        if (nuevoBalance < 0) {
            throw new IllegalArgumentException("Balance cannot be negative.");
        }
        usuario.setBalance(nuevoBalance);
        return usuarioRepository.save(usuario);
    }


    /**
     * Deletes a user by their ID.
     *
     * @param id The ID of the user to delete.
     * @throws ResourceNotFoundException if user with the ID is not found.
     */
    @Transactional
    public void eliminarUsuario(Long id) {
        Usuario usuario = obtenerUsuarioPorId(id); // Check if user exists before deleting
        usuarioRepository.delete(usuario);
    }
}