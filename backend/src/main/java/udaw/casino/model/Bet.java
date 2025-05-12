package udaw.casino.model;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "bets") // Use plural for table names
public class Bet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "amount")
    private double amount;
    
    @Column(name = "bet_type")
    private String betType; // dozens, color, even/odd, etc.
    
    @Column(name = "bet_value")
    private String betValue;
    
    @Column(name = "winning_value")
    private String winningValue; // result of the bet, can be a number or a color 

    @Column(name = "bet_date")
    private LocalDateTime betDate;
    
    @Column(name = "status")
    private String status; 
    
    @Column(name = "winloss")
    private double winloss;
    
    @JsonIgnore
    @ManyToOne // a bet belongs to a user and a user can have many bets
    @JoinColumn(name = "user_id")
    private User user;
    
    @JsonIgnore
    @ManyToOne // a bet belongs to a game and a game can have many bets
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
