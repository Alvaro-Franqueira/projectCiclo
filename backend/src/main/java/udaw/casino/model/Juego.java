package udaw.casino.model;

import lombok.Data;

import java.util.List;

import org.hibernate.validator.constraints.UniqueElements;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Data
@Table(name = "juegos") // Use plural for table names
public class Juego {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Game name cannot be blank")
    @Column(name = "nombre", nullable = false, unique = true)
    private String nombre; // e.g., "Roulette", "Dice"

    @Column(length = 500) // Allow for a longer description
    private String descripcion;

    // A game can have many bets placed on it
    @OneToMany(mappedBy = "juego", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY) // Bets are linked to a game
    private List<Apuesta> apuestas;


    // --- Constructors ---
    public Juego() {}

    public Juego(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }}