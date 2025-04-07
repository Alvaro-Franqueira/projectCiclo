package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UsuarioNoEncontradoException;
import udaw.casino.model.Rol;
import udaw.casino.model.Usuario;
import udaw.casino.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; // Inject PasswordEncoder

    @Autowired
    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user.
     * Encodes the password before saving.
     * Sets the default role to USER.
     * Checks for existing username and email.
     *
     * @param usuario The user object containing registration details.
     * @return The saved Usuario object.
     * @throws UsuarioNoEncontradoException if username or email already exists.
     */
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
        // Ensure default balance and registration date are set (usually handled by model constructor)

        return usuarioRepository.save(usuario);
    }

    /**
     * Finds a user by their ID.
     *
     * @param id The ID of the user.
     * @return The found Usuario.
     * @throws ResourceNotFoundException if user with the ID is not found.
     */
    public Usuario obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
    }

    /**
     * Finds a user by their username.
     *
     * @param username The username to search for.
     * @return The found Usuario.
     * @throws ResourceNotFoundException if user with the username is not found.
     */
    public Usuario obtenerUsuarioPorUsername(String username) {
        return usuarioRepository.findByUsername(username) // Now returns Optional
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
    }

     /**
     * Finds a user by their email.
     *
     * @param email The email to search for.
     * @return The found Usuario.
     * @throws ResourceNotFoundException if user with the email is not found.
     */
    public Usuario obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email) // Use Optional-returning method
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }


    /**
     * Retrieves all users.
     * Use with caution in production - consider pagination for large numbers of users.
     *
     * @return A list of all Usuario objects.
     */
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
    public Usuario actualizarUsuario(Long id, Usuario usuarioDetails) {
        Usuario usuario = obtenerUsuarioPorId(id); // Reuse existing method to find or throw exception

        // Update fields - be careful about which fields are allowed to be updated
        // Consider creating specific DTOs (Data Transfer Objects) for updates
        usuario.setUsername(usuarioDetails.getUsername()); // Consider username uniqueness check if changed
        usuario.setEmail(usuarioDetails.getEmail());     // Consider email uniqueness check if changed
        usuario.setBalance(usuarioDetails.getBalance());
        usuario.setRol(usuarioDetails.getRol()); // Update role

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