package udaw.casino.model;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/**
 * Entity representing a game in the casino system.
 * Stores game details and maintains a relationship to bets placed in the game.
 */
@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Game {

    /** Unique identifier for the game (auto-generated). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique name of the game. Must not be blank. */
    @NotBlank(message = "Game name cannot be blank")
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    /** Description of the game. */
    @Column(length = 500)
    private String description;

    /** List of bets placed in the game. */
    @OneToMany(mappedBy = "game", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY)
    private List<Bet> bets;

    // --- Constructors ---

    /**
     * Convenience constructor for creating a new game.
     * @param name The name of the game
     * @param description The description of the game
     */
    public Game(String name, String description) {
        this.name = name;
        this.description = description;
    }
    
    @Override
    public String toString() {
        return "Game{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", description='" + description + '\'' +
               '}';
    }
}
