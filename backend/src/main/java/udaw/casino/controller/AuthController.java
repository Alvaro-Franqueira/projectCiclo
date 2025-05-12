package udaw.casino.controller;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UserNotFoundException;
import udaw.casino.model.User;
import udaw.casino.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");
            
            // In a real implementation, you would validate credentials and generate a JWT token
            // For now, we'll just fetch the user and return it
            User user = userService.getUserByUsername(username);
            
            // Simple password check (in a real app, you'd use a password encoder)
            if (!user.getPassword().equals(password)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
            }
            
            // Create response with token and user data
            Map<String, Object> response = new HashMap<>();
            response.put("token", "mock-jwt-token-" + System.currentTimeMillis()); // Replace with real JWT
            
            // Don't return the password
            user.setPassword(null);
            response.put("user", user);
            
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
     * @param user User details for registration
     * @return Created user if registration is successful
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {
            User newUser = userService.registerUser(user);
            newUser.setPassword(null); // Don't return the password
            
            return new ResponseEntity<>(newUser, HttpStatus.CREATED);
        } catch (UserNotFoundException e) {
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
            User user = userService.getUserById(userId);
            user.setPassword(null); // Don't return the password
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "User not found"));
        }
    }
}
