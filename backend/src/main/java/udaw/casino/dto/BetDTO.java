package udaw.casino.dto;

import java.time.LocalDateTime;

import lombok.Data;
import udaw.casino.model.Bet;

@Data
public class BetDTO {
    private Long id;
    private double amount;
    private LocalDateTime betDate;
    private String status;
    private double winloss;
    private String type;
    private String betValue;
    private String winningValue;
    private Long gameId;
    private Long userId;
    private String gameName;
    private Double userBalance; // Added to store the user's current balance
    
    public BetDTO() {
    }
    
    public BetDTO(Bet bet) {
        this.id = bet.getId();
        this.amount = bet.getAmount();
        this.betDate = bet.getBetDate();
        this.status = bet.getStatus();
        this.winloss = bet.getWinloss();
        this.type = bet.getBetType();
        this.betValue = bet.getBetValue();
        this.winningValue = bet.getWinningValue();
        if (bet.getUser() != null) {
            this.userId = bet.getUser().getId();
            this.userBalance = bet.getUser().getBalance(); // Set the user's balance
        }
        
        if (bet.getGame() != null) {
            this.gameId = bet.getGame().getId();
            this.gameName = bet.getGame().getName();
        }
    }
}
