package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UsuarioNoEncontradoException;
import udaw.casino.model.Usuario;
import udaw.casino.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios") // Consistent base path
public class UsuarioController {

    private final UsuarioService usuarioService;

    @Autowired
    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    /**
     * Login endpoint.
     * 
     * @param loginRequest Login credentials
     * @return JWT token and user data if authentication is successful
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");
            
            // In a real implementation, you would validate credentials and generate a JWT token
            // For now, we'll just fetch the user and return it
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(username);
            
            // Simple password check (in a real app, you'd use a password encoder)
            if (!usuario.getPassword().equals(password)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
            }
            
            // Create response with token and user data
            Map<String, Object> response = new HashMap<>();
            response.put("token", "mock-jwt-token-" + System.currentTimeMillis()); // Replace with real JWT
            
            System.out.println("Intentando login con usuario: " + username);
            System.out.println("Contraseña enviada: " + password);

            Usuario usuario2 = usuarioService.obtenerUsuarioPorUsername(username);

            System.out.println("Contraseña guardada: " + usuario2.getPassword());
            // Don't return the password
            usuario.setPassword(null);
            response.put("user", usuario);
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid credentials"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An error occurred during login"));
        }
    }



    /**
     * Registers a new user.
     * Expects user details in the request body.
     * Uses @Valid to trigger bean validation defined in the Usuario model.
     *
     * @param usuario User details from the request body.
     * @return ResponseEntity with the created user (excluding sensitive data ideally) or an error.
     */
    @PostMapping("/registrar")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody Usuario usuario) {
        // Consider using a DTO here to avoid exposing/requiring fields like balance, role, id
        try {
            Usuario nuevoUsuario = usuarioService.registrarUsuario(usuario);
            // Avoid returning the password hash in the response
            nuevoUsuario.setPassword(null); // Or use a DTO
            return new ResponseEntity<>(nuevoUsuario, HttpStatus.CREATED);
        } catch (UsuarioNoEncontradoException e) { // Catch specific exception for existing user/email
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) { // Catch other potential errors
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during registration.");
        }
    }

    /**
     * Gets a user by their ID.
     *
     * @param id The ID of the user.
     * @return ResponseEntity with the user details or 404 Not Found.
     */
    @GetMapping("/id/{id}")
    public ResponseEntity<Usuario> obtenerUsuarioPorId(@PathVariable Long id) {
        try {
            Usuario usuario = usuarioService.obtenerUsuarioPorId(id);
            usuario.setPassword(null); // Avoid returning password hash
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Gets a user by their username.
     *
     * @param username The username of the user.
     * @return ResponseEntity with the user details or 404 Not Found.
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<Usuario> obtenerUsuarioPorUsername(@PathVariable String username) {
         try {
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(username);
            usuario.setPassword(null); // Avoid returning password hash
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Gets all users.
     * Requires ADMIN role (to be enforced by Spring Security later).
     *
     * @return ResponseEntity with a list of all users.
     */
    @GetMapping("/")
    // @PreAuthorize("hasRole('ADMIN')") // Add this once Spring Security is configured
    public ResponseEntity<List<Usuario>> obtenerTodosLosUsuarios() {
        List<Usuario> usuarios = usuarioService.obtenerTodosLosUsuarios();
        // Avoid returning password hashes
        usuarios.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(usuarios);
    }

    /**
     * Updates a user.
     * Requires ADMIN role or the user updating their own profile (to be enforced by Security).
     *
     * @param id            The ID of the user to update.
     * @param usuarioDetails Updated user details.
     * @return ResponseEntity with the updated user or an error.
     */
    @PutMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id") // Example Security
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @Valid @RequestBody Usuario usuarioDetails) {
        // Important: This currently allows updating any field, including role and balance.
        // Use DTOs and specific service methods for controlled updates (e.g., separate endpoint for balance/role changes by admin).
        // Also, handle password updates separately and securely.
        try {
             // Ensure password isn't accidentally updated to null or an unencoded value
             // Fetch existing user to preserve password if not explicitly changed
             Usuario currentUser = usuarioService.obtenerUsuarioPorId(id);
             usuarioDetails.setPassword(currentUser.getPassword()); // Keep existing password unless changed via a dedicated mechanism

            Usuario usuarioActualizado = usuarioService.actualizarUsuario(usuarioDetails);
            usuarioActualizado.setPassword(null); // Avoid returning hash
            return ResponseEntity.ok(usuarioActualizado);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (UsuarioNoEncontradoException e) { // Catch potential username/email conflicts on update
             return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during update.");
        }
    }

    /**
     * Deletes a user.
     * Requires ADMIN role (to be enforced by Spring Security).
     *
     * @param id The ID of the user to delete.
     * @return ResponseEntity with status NO_CONTENT or an error.
     */
    @DeleteMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')") // Add this once Spring Security is configured
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
         try {
            usuarioService.eliminarUsuario(id);
            return ResponseEntity.noContent().build(); // Standard response for successful DELETE
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
             // Log the exception
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}