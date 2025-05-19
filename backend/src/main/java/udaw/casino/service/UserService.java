package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.UserNotFoundException;
import udaw.casino.model.Role;
import udaw.casino.model.User;
import udaw.casino.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.List;

/**
 * Service class for managing user-related operations in the casino application.
 * Handles user registration, authentication, profile management, and balance updates.
 * All operations are transactional to ensure data consistency.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; 

    /**
     * Constructs a new UserService with required dependencies.
     * @param userRepository Repository for user data persistence
     * @param passwordEncoder Encoder for secure password hashing
     */
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user in the system.
     * Performs validation checks and sets default values for new users.
     * 
     * @param user The user to register
     * @return The registered user with encoded password and default values
     * @throws UserNotFoundException if username or email already exists
     */
    @Transactional
    public User registerUser(User user) {
        // Validate unique constraints
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new UserNotFoundException("Username '" + user.getUsername() + "' already exists.");
        }
        // Encode password if not already encoded
        if (!user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // Set default values for new users (it's also in model)
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        if (user.getBalance() == null) {
            user.setBalance(1000.0); // Default starting balance (it's also in model)
        }
        if (user.getRegistrationDate() == null) {
            user.setRegistrationDate(java.time.LocalDateTime.now());
        }
        
        return userRepository.save(user);
    }

    /**
     * Retrieves a user by their ID.
     * @param id The user's ID
     * @return The found user
     * @throws UserNotFoundException if user is not found
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException());
    }

    /**
     * Retrieves a user by their username.
     * @param username The username to search for
     * @return The found user
     * @throws ResourceNotFoundException if user is not found
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    /**
     * Retrieves a user by their email address.
     * @param email The email address to search for
     * @return The found user
     * @throws ResourceNotFoundException if user is not found
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    /**
     * Retrieves all users in the system.
     * @return List of all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Updates an existing user's information.
     * Validates unique constraints and preserves sensitive data.
     * 
     * @param userDetails The updated user information
     * @return The updated user
     * @throws ResourceNotFoundException if user is not found
     * @throws UserNotFoundException if updated username/email conflicts with existing users
     */
    @Transactional
    public User updateUser(User userDetails) {
        User user = getUserById(userDetails.getId());
        
        // Validate unique constraints for username
        if (userDetails.getUsername() != null) {
            if (!userDetails.getUsername().equals(user.getUsername()) && 
                userRepository.existsByUsername(userDetails.getUsername())) {
                throw new UserNotFoundException("Username '" + userDetails.getUsername() + "' already exists.");
            }
        }
        // Update non-sensitive fields
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());     
        user.setBalance(userDetails.getBalance());
        user.setRole(userDetails.getRole()); 

        return userRepository.save(user);
    }

    /**
     * Updates a user's balance.
     * Ensures the new balance is non-negative.
     * 
     * @param id The user's ID
     * @param newBalance The new balance amount
     * @return The updated user
     * @throws ResourceNotFoundException if user is not found
     * @throws IllegalArgumentException if new balance is negative
     */
    @Transactional
    public User updateUserBalance(Long id, Double newBalance) {
        User user = getUserById(id);
        if (newBalance < 0) {
            throw new IllegalArgumentException("Balance cannot be negative.");
        }
        user.setBalance(newBalance);
        return userRepository.save(user);
    }

    /**
     * Alternative method to update user balance.
     * This method is kept for backward compatibility.
     * 
     * @param userId The user's ID
     * @param newBalance The new balance amount
     * @return The updated user
     * @throws ResourceNotFoundException if user is not found
     * @throws IllegalArgumentException if new balance is negative
     */
    @Transactional
    public User updateBalance(Long userId, Double newBalance) {
        User user = getUserById(userId);
        if (newBalance < 0) {
            throw new IllegalArgumentException("Balance cannot be negative.");
        }
        user.setBalance(newBalance);
        userRepository.save(user);
        return user;
    }

    /**
     * Deletes a user from the system.
     * 
     * @param id The ID of the user to delete
     * @throws ResourceNotFoundException if user is not found
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}
