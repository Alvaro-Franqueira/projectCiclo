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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity
@Table(name = "users") 
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @NotBlank(message = "Password cannot be blank")
    @ValidPassword(message = "Password must be 8-30 characters and include uppercase, lowercase, digit, and special character", groups = ValidPassword.ManualValidationOnly.class)
    @Column(nullable = false)
    private String password;

    @ValidEmail(message = "Please provide a valid email address")
    @NotBlank(message = "Email cannot be blank")
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    private Double balance = 1000.0; // Default starting balance

    @Column(name = "registration_date", nullable = false, updatable = false)
    private LocalDateTime registrationDate = LocalDateTime.now(); // Set registration time automatically

    // Use Enum for roles
    @Enumerated(EnumType.STRING) // Store role name as String in DB
    @Column(nullable = false)
    private Role role = Role.USER; // Default role is USER

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Bet> bets;

    // --- Constructors ---

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
