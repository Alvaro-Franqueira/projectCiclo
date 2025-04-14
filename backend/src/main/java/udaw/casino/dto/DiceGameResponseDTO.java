package udaw.casino.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiceGameResponseDTO {
    private List<Integer> diceResults; // [die1Result, die2Result]
    private ApuestaDTO resolvedBet; // The final state of the bet (GANADA/PERDIDA, winloss, etc.)
}
