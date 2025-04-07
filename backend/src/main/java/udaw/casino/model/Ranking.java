package udaw.casino.model;

import lombok.Data;

import jakarta.persistence.*;


import jakarta.validation.constraints.NotNull;


@Entity
@Data
@Table(name = "rankings", uniqueConstraints = {
    // Ensure a user has only one entry per ranking type (and potentially per game if applicable)
    @UniqueConstraint(columnNames = {"usuario_id", "tipo", "juego_id"})
})
public class Ranking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Ranking must be associated with a user")
    @ManyToOne(fetch = FetchType.LAZY) // Lazy fetch is often good here
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Use the RankingType Enum
    @NotNull(message = "Ranking type cannot be null")
    @Enumerated(EnumType.STRING) // Store enum name as String
    @Column(nullable = false)
    private RankingType tipo;

    // A ranking entry might be specific to a game (e.g., highest wins in Roulette)
    // Make this nullable if the ranking is global (e.g., total profit across all games)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "juego_id", nullable = true) // Nullable for global rankings
    private Juego juego;

    @NotNull(message = "Score cannot be null")
    @Column(nullable = false)
    private Double score = 0.0; // Represents the value used for ranking (e.g., profit, total bets)

    // --- Constructors ---
    public Ranking() {}

    public Ranking(Usuario usuario, RankingType tipo, Double score) {
        this.usuario = usuario;
        this.tipo = tipo;
        this.score = score;
    }

    public Ranking(Usuario usuario, RankingType tipo, Juego juego, Double score) {
        this.usuario = usuario;
        this.tipo = tipo;
        this.juego = juego; // Assign the specific game if relevant
        this.score = score;
    }   
}