package udaw.casino.model;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Entity representing a bet placed by a user in a game.
 * Stores bet details, outcome, and relationships to User and Game.
 */
@Entity
@Table(name = "bets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bet {

    /** Unique identifier for the bet (auto-generated). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Amount wagered in the bet. */
    @Column(name = "amount")
    private double amount;
    
    /** Type of bet (e.g., dozens, color, even/odd). */
    @Column(name = "bet_type")
    private String betType;
    
    /** Value of the bet (e.g., "red", "even", "1", "low"). */
    @Column(name = "bet_value")
    private String betValue;
    
    /** Result of the bet (e.g., winning number, color). */
    @Column(name = "winning_value")
    private String winningValue;
    
    /** Date and time when the bet was placed. */
    @Column(name = "bet_date")
    private LocalDateTime betDate;
    
    /** Status of the bet (e.g., PENDING, WON, LOST). */
    @Column(name = "status")
    private String status;
    
    /** Amount won (positive) or lost (negative) from the bet. */
    @Column(name = "winloss")
    private double winloss;
    
    /** User who placed the bet. */
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    /** Game in which the bet was placed. */
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "game_id")
    private Game game;
    
    @Override
    public String toString() {
        return "Bet{" +
               "id=" + id +
               ", amount=" + amount +
               ", betType='" + betType + '\'' +
               ", betValue='" + betValue + '\'' +
               ", winningValue='" + winningValue + '\'' +
               ", betDate=" + betDate +
               ", status='" + status + '\'' +
               ", winloss=" + winloss +
               ", userId=" + (user != null ? user.getId() : null) +
               ", gameId=" + (game != null ? game.getId() : null) +
               '}';
    }
}
