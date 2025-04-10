package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UsuarioNoEncontradoException;
import udaw.casino.model.Usuario;
import udaw.casino.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }


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
     * Registration endpoint.
     * 
     * @param usuario User details for registration
     * @return Created user if registration is successful
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody Usuario usuario) {
        try {
            Usuario nuevoUsuario = usuarioService.registrarUsuario(usuario);
            nuevoUsuario.setPassword(null); // Don't return the password
            
            return new ResponseEntity<>(nuevoUsuario, HttpStatus.CREATED);
        } catch (UsuarioNoEncontradoException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "An error occurred during registration"));
        }
    }

    /**
     * Get current user information.
     * In a real implementation, this would use the JWT token to identify the user.
     * 
     * @return Current user information
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam Long userId) {
        // In a real implementation, you would extract the user ID from the JWT token
        try {
            Usuario usuario = usuarioService.obtenerUsuarioPorId(userId);
            usuario.setPassword(null); // Don't return the password
            return ResponseEntity.ok(usuario);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "User not found"));
        }
    }
}
