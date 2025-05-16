package udaw.casino.model;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Game name cannot be blank")
    @Column(name = "name", nullable = false, unique = true)
    private String name; 

    @Column(length = 500)
    private String description;

    @OneToMany(mappedBy = "game", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY) // Bets are linked to a game
    private List<Bet> bets;

    // --- Constructors ---
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
