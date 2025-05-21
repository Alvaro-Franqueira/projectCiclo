package udaw.casino.controller;

import udaw.casino.dto.UserDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UserNotFoundException;
import udaw.casino.model.Role;
import udaw.casino.model.User;
import udaw.casino.security.JwtUtils;
import udaw.casino.service.UserService;

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
import java.util.Set;

/**
 * Controller for managing user operations in the casino system.
 * Provides endpoints for user registration, login, retrieval, updates, and deletion.
 */
@RestController
@RequestMapping("/api/users") 
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    public UserController(UserService userService, 
                            AuthenticationManager authenticationManager,
                            JwtUtils jwtUtils) {
        this.userService = userService;
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
            User user = userService.getUserByUsername(username);
            
            // Create response with token and user data
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            
            // Don't return the password
            user.setPassword(null);
            response.put("user", user);
            
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
     * Uses @Valid to trigger bean validation defined in the User model.
     *
     * @param user User details from the request body.
     * @return ResponseEntity with the created user (excluding sensitive data ideally) or an error.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        // Consider using a DTO here to avoid exposing/requiring fields like balance, role, id
        try {
            // Manually validate the user before passing to service layer
            jakarta.validation.Validator validator = jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();
            Set<jakarta.validation.ConstraintViolation<User>> violations = validator.validate(user, udaw.casino.validation.ValidPassword.ManualValidationOnly.class);
            
            if (!violations.isEmpty()) {
                Map<String, String> errors = new HashMap<>();
                for (jakarta.validation.ConstraintViolation<User> violation : violations) {
                    String propertyPath = violation.getPropertyPath().toString();
                    String message = violation.getMessage();
                    errors.put(propertyPath, message);
                }
                return ResponseEntity.badRequest().body(Map.of("message", "Validation failed", "errors", errors));
            }
            
            User newUser = userService.registerUser(user);
            // Avoid returning the password hash in the response
            newUser.setPassword(null); // Or use a DTO
            return new ResponseEntity<>(newUser, HttpStatus.CREATED);
        } catch (UserNotFoundException e) { // Catch specific exception for existing user/email
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) { // Catch other potential errors

            // Return a more detailed error message
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "message", "An error occurred during registration", 
                    "error", e.getMessage() != null ? e.getMessage() : "Unknown error"
                ));
        }
    }

    /**
     * Gets a user by their ID.
     *
     * @param id The ID of the user.
     * @return ResponseEntity with the user details or 404 Not Found.
     */
    @GetMapping("/id/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            user.setPassword(null); // Avoid returning password hash
            return ResponseEntity.ok(user);
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
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        try {
            User user = userService.getUserByUsername(username);
            user.setPassword(null); // Avoid returning password hash
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Gets the balance of a user by their ID.
     *
     * @param id The ID of the user.
     * @return ResponseEntity with the user's balance or 404 Not Found.
     */
    @GetMapping("/balance/{id}")
    public ResponseEntity<Double> getBalanceById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(user.getBalance());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // This method was removed to avoid duplication with the other /me endpoint
    // that uses SecurityContextHolder to get the current user

    /**
     * Gets all users.
     * Requires ADMIN role (to be enforced by Spring Security later).
     *
     * @return ResponseEntity with a list of all users.
     */
    @GetMapping("/admin/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        // Avoid returning password hashes
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    /**
     * Updates a user.
     * Requires ADMIN role or the user updating their own profile (to be enforced by Security).
     *
     * @param id            The ID of the user to update.
     * @param userDetails Updated user details.
     * @return ResponseEntity with the updated user or an error.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserDTO userDetails) {
        // Important: This currently allows updating any field, including role and balance.
        // Use DTOs and specific service methods for controlled updates (e.g., separate endpoint for balance/role changes by admin).
        // Also, handle password updates separately and securely.
        try {
            User existingUser = userService.getUserById(id);
            if (existingUser == null) {
                return ResponseEntity.notFound().build();
            }
            existingUser.setUsername(userDetails.getUsername());
            existingUser.setEmail(userDetails.getEmail());
            existingUser.setRole(Role.valueOf(userDetails.getRole()));

            User updatedUser = userService.updateUser(existingUser);
            return ResponseEntity.ok(updatedUser);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (UserNotFoundException e) { // Catch potential username/email conflicts on update
             return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during update.");
        }
    }

    /**
     * Updates the balance of a user by their ID.
     *
     * @param id The ID of the user.
     * @param newBalance The new balance to set.
     * @return ResponseEntity with the updated user or an error.
     */
    @PutMapping("/balance/{id}")
    public ResponseEntity<?> updateBalance(@PathVariable Long id, @RequestParam double newBalance) {
        try {
            User user = userService.updateBalance(id, newBalance);
            return ResponseEntity.ok(user);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during balance update.");
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
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
         try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build(); // Standard response for successful DELETE
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
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
            
            User user = userService.getUserByUsername(username);
            user.setPassword(null); // Don't return the password
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Not authenticated"));
        }
    }
}
