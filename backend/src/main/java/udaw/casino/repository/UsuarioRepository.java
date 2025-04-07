package udaw.casino.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import udaw.casino.model.Usuario;


@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Finds a user by their username.
     * Uses Optional to handle cases where the user might not exist.
     *
     * @param username The username to search for.
     * @return An Optional containing the Usuario if found, otherwise an empty Optional.
     */
    Optional<Usuario> findByUsername(String username); // Return Optional<Usuario>

    /**
     * Finds a user by their email.
     * Uses Optional to handle cases where the user might not exist.
     *
     * @param email The email to search for.
     * @return An Optional containing the Usuario if found, otherwise an empty Optional.
     */
    Optional<Usuario> findByEmail(String email); // Also good practice for email

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
