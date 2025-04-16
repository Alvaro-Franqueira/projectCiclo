package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UsuarioNoEncontradoException;
import udaw.casino.model.Usuario;
import udaw.casino.security.JwtUtils;
import udaw.casino.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios") // Consistent base path
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Autowired
    public UsuarioController(UsuarioService usuarioService, 
                            AuthenticationManager authenticationManager,
                            JwtUtils jwtUtils) {
        this.usuarioService = usuarioService;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
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
            
            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            
            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Generate JWT token
            String token = jwtUtils.generateToken(username);
            
            // Get user details
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(username);
            
            // Create response with token and user data
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            
            // Don't return the password
            usuario.setPassword(null);
            response.put("user", usuario);
            
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
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
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoUsuario);
        } catch (UsuarioNoEncontradoException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An error occurred during registration"));
        }
    }

    /**
     * Gets a user by their ID.
     *
     * @param id The ID of the user.
     * @return ResponseEntity with the user details or 404 Not Found.
     */
    @GetMapping("/id/{id}")
    public ResponseEntity<?> obtenerUsuarioPorId(@PathVariable Long id) {
        try {
            Usuario usuario = usuarioService.obtenerUsuarioPorId(id);
            usuario.setPassword(null); // Don't return the password
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
    public ResponseEntity<?> obtenerUsuarioPorUsername(@PathVariable String username) {
        try {
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(username);
            usuario.setPassword(null); // Don't return the password
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/balance/{id}")
    public ResponseEntity<?> obtenerBalancePorId(@PathVariable Long id) {
        try {
            Usuario usuario = usuarioService.obtenerUsuarioPorId(id);
            return ResponseEntity.ok(usuario.getBalance());
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
    @GetMapping("/admin/users")
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
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @Valid @RequestBody Usuario usuarioDetails) {
        try {
            // Check if the authenticated user is allowed to update this user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = authentication.getName();
            
            Usuario currentUser = usuarioService.obtenerUsuarioPorUsername(currentUsername);
            
            // Only allow admins or the user themselves to update their profile
            boolean isAdmin = currentUser.getRol().name().equals("ADMIN");
            boolean isSameUser = currentUser.getId().equals(id);
            
            if (!isAdmin && !isSameUser) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You are not authorized to update this user"));
            }
            
            // Ensure password isn't accidentally updated to null or an unencoded value
            // Fetch existing user to preserve password if not explicitly changed
            Usuario existingUser = usuarioService.obtenerUsuarioPorId(id);
            usuarioDetails.setPassword(existingUser.getPassword()); // Keep existing password
            
            // Set the ID to ensure we're updating the correct user
            usuarioDetails.setId(id);
            
            // Only admins can update roles
            if (!isAdmin) {
                usuarioDetails.setRol(existingUser.getRol());
            }

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
    @DeleteMapping("/admin/{id}")
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
    
    /**
     * Gets the currently authenticated user's information.
     * 
     * @return ResponseEntity with the user details or 401 Unauthorized.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            Usuario usuario = usuarioService.obtenerUsuarioPorUsername(username);
            usuario.setPassword(null); // Don't return the password
            
            return ResponseEntity.ok(usuario);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Not authenticated"));
        }
    }
}