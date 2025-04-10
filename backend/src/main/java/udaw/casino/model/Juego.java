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
    @Column(nullable = false, unique = true)
    @UniqueElements // Ensure game names are unique
    private String nombre; // e.g., "Roulette", "Dice"

    @Column(length = 500) // Allow for a longer description
    private String descripcion;

    // A game can have many bets placed on it
    @OneToMany(mappedBy = "juego", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY) // Bets are linked to a game
    private List<Apuesta> apuestas;

    // Removed the incorrect ManyToMany relationship with Ranking
    // A Ranking entry might relate to a Juego (via ManyToOne in Ranking),
    // but a Juego doesn't inherently own Ranking entries.

    // --- Constructors ---
    public Juego() {}

    public Juego(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }}