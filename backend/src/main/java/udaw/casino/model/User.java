package udaw.casino.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.AccessLevel;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import udaw.casino.validation.ValidEmail;
import udaw.casino.validation.ValidPassword;

/**
 * Entity representing a user in the casino system.
 * Stores authentication, profile, and account information.
 * Includes validation for username, password, and email.
 * Maintains a relationship to bets placed by the user.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {

    /** Unique identifier for the user (auto-generated). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique username for the user.
     * Must be 3-50 characters, not blank.
     */
    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    /**
     * Hashed password for the user.
     * Must meet complexity requirements (see @ValidPassword).
     */
    @NotBlank(message = "Password cannot be blank")
    @ValidPassword(message = "Password must be 8-30 characters and include uppercase, lowercase and digit", groups = ValidPassword.ManualValidationOnly.class)
    @Column(nullable = false)
    private String password;

    /**
     * Unique email address for the user.
     * Must be valid and not blank.
     */
    @ValidEmail(message = "Please provide a valid email address")
    @NotBlank(message = "Email cannot be blank")
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    /**
     * Current balance of the user (casino credits).
     * Defaults to 1000.0 on registration.
     */
    @Column(nullable = false)
    private Double balance = 1000.0; // Default starting balance

    /**
     * Date and time when the user registered.
     * Set automatically and not updatable.
     */
    @Column(name = "registration_date", nullable = false, updatable = false)
    private LocalDateTime registrationDate = LocalDateTime.now(); // Set registration time automatically

    /**
     * Role of the user (USER or ADMIN).
     * Stored as a string in the database.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER; // Default role is USER

    /**
     * List of bets placed by the user.
     * Cascade and orphan removal enabled.
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Bet> bets;

    // --- Constructors ---

    /**
     * Convenience constructor for creating a new user with default values.
     * @param username The username
     * @param password The hashed password
     * @param email The email address
     */
    public User(String username, String password, String email) {
        this.username = username;
        this.password = password; // Password should be encoded before saving!
        this.email = email;
        this.registrationDate = LocalDateTime.now(); // Set registration time
        this.balance = 1000.0; // Ensure default balance
        this.role = Role.USER; // Default role is USER
    }
    
    @Override
    public String toString() {
        return "User{" +
               "id=" + id +
               ", username='" + username + '\'' +
               ", email='" + email + '\'' +
               ", balance=" + balance +
               ", registrationDate=" + registrationDate +
               ", role=" + role +
               '}';
    }
}
