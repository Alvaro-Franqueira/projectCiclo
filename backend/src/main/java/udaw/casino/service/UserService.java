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

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; 

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new UserNotFoundException("Username '" + user.getUsername() + "' already exists.");
        }
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new UserNotFoundException("Email '" + user.getEmail() + "' already exists.");
        }
        
        // Log the password before encoding
        System.out.println("Password before encoding: '" + user.getPassword() + "', length: " + user.getPassword().length());

        // Encode password before saving (only if not already encoded)
        if (!user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // Set default role if not specified (though default is set in model too)
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        
        if (user.getBalance() == null) {
            user.setBalance(1000.0); // Default balance
        }
        if (user.getRegistrationDate() == null) {
            user.setRegistrationDate(java.time.LocalDateTime.now()); // Default registration date
        }
        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException());
    }


    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username) // Now returns Optional
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }


    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email) // Use Optional-returning method
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }


    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Updates an existing user.
     * Ensures the user exists before attempting update.
     * Note: Password updates should be handled carefully, potentially in a separate method.
     * This basic update method might overwrite the encoded password if not handled correctly in the input.
     *
     * @param userDetails The User object containing updated details.
     * @return The updated User object.
     * @throws ResourceNotFoundException if user with the ID is not found.
     */
    @Transactional
    public User updateUser(User userDetails) {
        User user = getUserById(userDetails.getId()); // throw exception if not exists
        // Check if username or email already exists (if they are being updated)
        if (userDetails.getUsername() != null) {
            if (!userDetails.getUsername().equals(user.getUsername()) && userRepository.existsByUsername(userDetails.getUsername())) {
                throw new UserNotFoundException("Username '" + userDetails.getUsername() + "' already exists.");
            }
        }
        if (userDetails.getEmail() != null) {
            if (!userDetails.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(userDetails.getEmail())) {
                throw new UserNotFoundException("Email '" + userDetails.getEmail() + "' already exists.");
            }
        }
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());     
        user.setBalance(userDetails.getBalance());
        user.setRole(userDetails.getRole()); 

        // Avoid updating password here unless explicitly intended and handled securely
        // if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
        //     user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        // }

        return userRepository.save(user);
    }

     /**
     * Updates only the balance of a user.
     * More specific and potentially safer than a general update.
     *
     * @param id The ID of the user.
     * @param newBalance The new balance amount.
     * @return The updated User object.
     * @throws ResourceNotFoundException if user with the ID is not found.
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
     * Deletes a user by their ID.
     *
     * @param id The ID of the user to delete.
     * @throws ResourceNotFoundException if user with the ID is not found.
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id); // Check if user exists before deleting
        userRepository.delete(user);
    }
}
