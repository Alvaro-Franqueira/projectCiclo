package udaw.casino.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import udaw.casino.model.User;

/**
 * Repository interface for managing User entities in the casino system.
 * Provides methods for finding users by username or email, and checking
 * the existence of users with specific credentials.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their username.
     * Uses Optional to handle cases where the user might not exist.
     *
     * @param username The username to search for.
     * @return An Optional containing the User if found, otherwise an empty Optional.
     */
    Optional<User> findByUsername(String username);

    /**
     * Finds a user by their email.
     * Uses Optional to handle cases where the user might not exist.
     *
     * @param email The email to search for.
     * @return An Optional containing the User if found, otherwise an empty Optional.
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user exists with the given username.
     * More efficient than fetching the whole user if you only need to check existence.
     *
     * @param username The username to check.
     * @return true if a user with the username exists, false otherwise.
     */
    boolean existsByUsername(String username);

    /**
     * Checks if a user exists with the given email.
     * More efficient than fetching the whole user if you only need to check existence.
     *
     * @param email The email to check.
     * @return true if a user with the email exists, false otherwise.
     */
    boolean existsByEmail(String email);
}
