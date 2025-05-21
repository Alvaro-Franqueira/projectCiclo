package udaw.casino.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.InsufficientBalanceException;
import udaw.casino.model.Bet;
import udaw.casino.model.Game;
import udaw.casino.model.User;

import java.util.Map;

/**
 * Service class for managing dice game operations.
 * Implements a dice game where players can bet on:
 * - Specific numbers (2-12) with varying payouts
 * - High/Low (1:1 payout, 95% return)
 * - Even/Odd (1:1 payout, 95% return)
 * 
 * The game uses two dice, and payouts are based on the sum of the dice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DiceService {

    private final BetService betService;
    private final UserService userService;
    private final GameService gameService;

    /**
     * Processes a dice game bet and determines the outcome.
     * Handles bet validation, result calculation, and balance updates.
     * 
     * @param bet The bet to process
     * @param diceSum The sum of the two dice (2-12)
     * @return The resolved bet with outcome
     * @throws IllegalArgumentException if bet amount is invalid or bet type/value is null
     * @throws ResourceNotFoundException if user or game is not found
     * @throws InsufficientBalanceException if user has insufficient balance
     */
    @Transactional
    public Bet playDice(Bet bet, int diceSum) {

        // Validate bet parameters
        if (bet.getAmount() <= 0) {
             throw new IllegalArgumentException("Invalid bet amount: " + bet.getAmount() + ". Must be greater than 0.");
        }
        if (bet.getBetType() == null || bet.getBetValue() == null) {
            throw new IllegalArgumentException("Bet type or value cannot be null.");
        }

        // Validate user and game existence
        User user = userService.getUserById(bet.getUser().getId());
        Game game = gameService.getGameById(bet.getGame().getId());
        if (user == null || game == null) {
            throw new ResourceNotFoundException("User or game not found.");
        }

        // Validate user balance
        if (user.getBalance() < bet.getAmount()) {
            throw new InsufficientBalanceException("Insufficient balance to place this bet.");
        }
        
        // Create and process bet
        Bet createdBet = betService.createBet(bet);
        createdBet.setWinningValue(String.valueOf(diceSum));
        
        // Calculate and apply win/loss
        double winAmount = determineDiceResult(createdBet, diceSum);
        createdBet.setWinloss(winAmount);

        // Update user balance
        user.setBalance(user.getBalance() + winAmount);
        userService.updateUserBalance(user.getId(), user.getBalance());
        
        return betService.resolveBet(createdBet);
    }

    /**
     * Payout multipliers for specific number bets.
     * Higher payouts for less likely outcomes (2 and 12 pay 30:1).
     */
    private static final Map<Integer, Double> NUMBER_ODDS = Map.ofEntries(
        Map.entry(2, 30.0),  // Snake eyes
        Map.entry(3, 15.0),  // Ace-deuce
        Map.entry(4, 10.0),  // Easy four
        Map.entry(5, 8.0),   // Five
        Map.entry(6, 6.0),   // Easy six
        Map.entry(7, 5.0),   // Natural
        Map.entry(8, 6.0),   // Easy eight
        Map.entry(9, 8.0),   // Nine
        Map.entry(10, 10.0), // Easy ten
        Map.entry(11, 15.0), // Yo-leven
        Map.entry(12, 30.0)  // Boxcars
    );
    
    /**
     * Determines the result of a dice bet based on the dice sum.
     * Implements payout rules for different bet types:
     * - Number bets: Variable payouts based on NUMBER_ODDS
     * - High/Low bets: 0.95:1 payout (95% return)
     * - Even/Odd bets: 0.95:1 payout (95% return)
     * 
     * @param bet The bet to evaluate
     * @param totalSum The sum of the two dice (2-12)
     * @return The amount won (positive) or lost (negative), or null if bet is invalid
     */
    private Double determineDiceResult(Bet bet, int totalSum) {
        String type = bet.getBetType().toLowerCase();
        String betValue = bet.getBetValue().toLowerCase();
        double amount = bet.getAmount();
    
        switch (type) {
            case "number":
                // Direct number bet with variable payouts
                int bettedNumber = Integer.parseInt(betValue);
                if (bettedNumber == totalSum) {
                    double payout = NUMBER_ODDS.getOrDefault(bettedNumber, 0.0);
                    return amount * payout;
                } else {
                    return -amount;
                }
    
            case "highlow":
                // High/Low bet (1:1 payout, 95% return)
                // half 1: 2–6, half 2: 7–12
                int half = totalSum <= 6 ? 1 : 2;
                return betValue.equals(String.valueOf(half)) ? amount * 0.95 : -amount;
    
            case "evenodd":
                // Even/Odd bet (1:1 payout, 95% return)
                boolean isEven = totalSum % 2 == 0;
                boolean choseEven = betValue.equals("even");
                return (isEven == choseEven) ? amount * 0.95 : -amount;

            default:
                return null;
        }
    }
}
