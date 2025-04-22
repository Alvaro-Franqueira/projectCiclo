package udaw.casino.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "usuarios") // Use plural for table names generally
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @NotBlank(message = "Password cannot be blank")
    // Size validation might be applied after encoding, consider constraints carefully
    @Column(nullable = false)
    private String password;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email cannot be blank")
    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private Double balance = 1000.0; // Default starting balance

    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now(); // Set registration time automatically

    // Use Enum for roles
    @Enumerated(EnumType.STRING) // Store role name as String in DB
    @Column(nullable = false)
    private Rol rol = Rol.USER; // Default role is USER

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Apuesta> apuestas;

    // Rankings are now calculated on-demand and not stored in the database

    // --- Constructors ---

    public Usuario() {
        this.fechaRegistro = LocalDateTime.now(); // Ensure it's set even with default constructor
        this.balance = 1000.0; // Ensure default balance
        this.rol = Rol.USER; // Ensure default role
    }

    public Usuario(String username, String password, String email) {
        this(); // Call default constructor to set defaults
        this.username = username;
        this.password = password; // Password should be encoded before saving!
        this.email = email;
    }
}