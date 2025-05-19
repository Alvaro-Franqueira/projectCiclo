package udaw.casino.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import udaw.casino.dto.BetDTO;
import udaw.casino.dto.PlaceBetRequestDTO;
import udaw.casino.dto.DiceGameResponseDTO;
import udaw.casino.model.Bet;
import udaw.casino.service.DiceService;
import udaw.casino.service.UserService;
import udaw.casino.service.GameService;

import java.util.Random;
import java.util.Arrays;
import java.util.List;

/**
 * Controller for managing dice game operations in the casino system.
 * Provides endpoints for placing bets and playing rounds of dice.
 */
@RestController
@RequestMapping("/api/dice") // Base path for dice game endpoints
@RequiredArgsConstructor
public class DiceController {
    @Autowired
    private final DiceService diceService;
    private final UserService userService;
    private final GameService gameService;
    
    /**
     * Endpoint to play a round of dice and place a bet.
     * 
     * @param betRequest The bet request containing user ID, amount, bet type, and bet value.
     * @return ResponseEntity containing the dice results and the resolved bet.
     */
    @PostMapping("/play")
    public ResponseEntity<DiceGameResponseDTO> playDice(@RequestBody PlaceBetRequestDTO betRequest) {
        // Validate the request body
        if (betRequest.getUserId() == null || betRequest.getAmount() <= 0 || 
            betRequest.getType() == null || betRequest.getBetValue() == null) {
            return ResponseEntity.badRequest().body(null);
        }
        
        // Generate random dice values (1-6 for each die)
        Random random = new Random();
        List<Integer> diceValues = Arrays.asList(
            random.nextInt(6) + 1, // First die (1-6)
            random.nextInt(6) + 1  // Second die (1-6)
        );
        
        // Calculate the sum of dice
        int diceSum = diceValues.get(0) + diceValues.get(1);
        
        // Create the bet object
        Bet bet = new Bet();
        bet.setUser(userService.getUserById(betRequest.getUserId()));
        bet.setAmount(betRequest.getAmount());
        bet.setBetType(betRequest.getType());
        bet.setBetValue(betRequest.getBetValue());
        bet.setGame(gameService.getGameById(betRequest.getGameId()));
        
        // Process the bet with the generated dice sum
        Bet resolvedBet = diceService.playDice(bet, diceSum);
        
        // Create and return the response DTO with BetDTO to prevent circular references
        DiceGameResponseDTO response = new DiceGameResponseDTO();
        response.setDiceResults(diceValues);
        response.setResolvedBet(new BetDTO(resolvedBet));
        
        return ResponseEntity.ok(response);
    }
}
