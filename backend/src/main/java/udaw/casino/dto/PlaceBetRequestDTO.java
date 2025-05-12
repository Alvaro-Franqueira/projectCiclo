package udaw.casino.dto;

import lombok.Data;

@Data // Lombok annotation for getters, setters, toString, etc.
public class PlaceBetRequestDTO {
    private Long userId;
    private Long gameId;
    private double amount;
    private String type; // e.g., "evenodd", "number"
    private String betValue; // e.g., "even", "odd", "7"
    private String winningValue;
}
