package udaw.casino.service;

import udaw.casino.model.Bet;
import udaw.casino.model.Game;
import udaw.casino.model.User;
import udaw.casino.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.transaction.Transactional;

/**
 * Service class for managing American Roulette game operations.
 * Handles bet processing, win/loss calculations, and balance updates for roulette games.
 * Implements standard American roulette rules including:
 * - Single number bets (35:1)
 * - Color bets (1:1)
 * - Even/Odd bets (1:1)
 * - Dozen bets (2:1)
 * - Column bets (2:1)
 * - High/Low bets (1:1)
 * 
 * The service ensures proper validation of bets, accurate payout calculations,
 * and maintains game integrity through transaction management.
 */
@Service
public class RouletteService {

    /** Name of the roulette game in the database */
    private static final String ROULETTE_GAME_NAME = "Roulette";

    /** Logger for tracking game operations and debugging */
    private static final Logger log = LoggerFactory.getLogger(RouletteService.class);

    /** Required service dependencies */
    private final BetService betService;
    private final UserService userService;
    private final GameService gameService; 
    private final UserRepository userRepository; 
    
    /**
     * Constructs a new RouletteService with required dependencies.
     * 
     * @param userRepository Repository for user data persistence
     * @param betService Service for managing bet operations
     * @param userService Service for user-related operations
     * @param gameService Service for game-related operations
     */
    public RouletteService(UserRepository userRepository, BetService betService, UserService userService, GameService gameService) {
        this.betService = betService;
        this.userService = userService;
        this.gameService = gameService;
        this.userRepository = userRepository;
    }

    /**
     * Processes a single roulette bet and determines the outcome.
     * Handles bet creation, validation, result calculation, and balance updates.
     * The method is transactional to ensure data consistency.
     * 
     * @param userId ID of the user placing the bet
     * @param amount Bet amount
     * @param betType Type of bet (number, color, parity, dozen, column, half)
     * @param betValue Value of the bet (e.g., "red", "even", "1", "low")
     * @param winningNumberController The winning number from the frontend
     * @return The resolved bet with outcome
     * @throws IllegalArgumentException if bet type or value is invalid
     * @throws ResourceNotFoundException if user or game is not found
     * @throws InsufficientBalanceException if user has insufficient balance
     */
    @Transactional
    public Bet playRoulette(Long userId, double amount, String betType, String betValue, String winningNumberController) {
        // Validate user and game
        User user = userService.getUserById(userId);
        Game rouletteGame = gameService.getGameByName(ROULETTE_GAME_NAME);

        log.info("User {} playing Roulette (Game ID: {}) with bet type: {}, value: {}, amount: {}. Frontend winning number: {}",
                 user.getUsername(), rouletteGame.getId(), betType, betValue, amount, winningNumberController);

        // Create and initialize bet
        Bet bet = new Bet();
        bet.setUser(user);
        bet.setGame(rouletteGame);
        bet.setAmount(amount);
        bet.setBetType(betType);
        bet.setBetValue(betValue);

        // Process bet through BetService
        Bet createdBet = betService.createBet(bet);
        
        // Calculate bet result
        createdBet.setWinningValue(winningNumberController);
        Double winnings = determineRouletteResult(createdBet, winningNumberController);
        if (winnings == null) {
            log.error("Invalid bet type or value: type={}, value={}", betType, betValue);
            throw new IllegalArgumentException("Invalid bet type or value: " + betType + ", " + betValue);
        }

        // Update bet and user balance
        createdBet.setWinloss(winnings);
        double newBalance = user.getBalance() + winnings;
        user.setBalance(newBalance);
        userRepository.save(user);
        
        // Finalize bet
        Bet finalizedBet = betService.resolveBet(createdBet);
        
        log.info("Bet completed for user {}. Result: {}, New balance: {}", 
                 user.getUsername(), winnings, newBalance);
        
        return finalizedBet;
    }

    /**
     * Determines the result of a roulette bet based on the winning number.
     * Implements payout rules for different bet types:
     * - Number bets: 35:1
     * - Color bets: 1:1
     * - Even/Odd bets: 1:1
     * - Dozen bets: 2:1
     * - Column bets: 2:1
     * - High/Low bets: 1:1
     * 
     * @param bet The bet to evaluate
     * @param winningNumberStr The winning number as a string
     * @return The amount won (positive) or lost (negative), or null if bet is invalid
     */
    private Double determineRouletteResult(Bet bet, String winningNumberStr) {
        String type = bet.getBetType();
        String value = bet.getBetValue();
        
        log.info("Determining result for bet: type={}, value={}, winning number={}", 
                type, value, winningNumberStr);

        // Parse winning number
        int winningNumber = 0;
        try {
            if (!winningNumberStr.equals("00")) {
                winningNumber = Integer.parseInt(winningNumberStr);
            }
        } catch (NumberFormatException e) {
            log.error("Error parsing winning number: {}", winningNumberStr);
            return null;
        }
        
        String winningColor = getNumberColor(winningNumberStr);
        
        // Process bet based on type
        switch (type.toLowerCase()) {
            case "number": // Direct number bet (35:1)
                if (value.equals(winningNumberStr)) {
                    log.info("Number bet win: bet value '{}' matches winning number '{}'", value, winningNumberStr);
                    return bet.getAmount() * 35; 
                } else {
                    log.info("Number bet loss: bet value '{}' does not match winning number '{}'", value, winningNumberStr);
                    return -bet.getAmount(); 
                }
                
            case "color": // Color bet (1:1)
                if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount();
                if ((winningColor.equals("red") && value.equals("1")) || 
                    (winningColor.equals("black") && value.equals("2"))) {
                    return bet.getAmount();
                } else {
                    return -bet.getAmount();
                }
            
            case "parity": // Even/Odd bet (1:1)
                if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); 
                String winningParity = (winningNumber % 2 == 0) ? "even" : "odd";
                return value.equals(winningParity) ? bet.getAmount() : -bet.getAmount();

            case "dozen": // Dozen bet (2:1)
                try {
                    if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); 
                    int betDozen = Integer.parseInt(value);
                    int winningDozen = (int) Math.ceil((double) winningNumber / 12.0);
                    return betDozen == winningDozen ? bet.getAmount() * 2 : -bet.getAmount();
                } catch (NumberFormatException | ArithmeticException e) {
                    log.warn("Invalid value for 'dozen' bet: {} or error calculating dozen for {}", value, winningNumber, e);
                    return null; 
                }

            case "column": // Column bet (2:1)
                try {
                    if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); 
                    int betColumn = Integer.parseInt(value);
                    int winningColumn = (winningNumber % 3 == 0) ? 3 : winningNumber % 3;
                    return betColumn == winningColumn ? bet.getAmount() * 2 : -bet.getAmount();
                } catch (NumberFormatException e) {
                    log.warn("Invalid value for 'column' bet: {}", value, e);
                    return null;
                }

            case "half": // High/Low bet (1:1)
                if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount();
                boolean isWinningLow = winningNumber >= 1 && winningNumber <= 18;
                boolean isBetLow = value.equals("low");
                return (isWinningLow == isBetLow) ? bet.getAmount() : -bet.getAmount(); 

            default:
                log.warn("Unknown bet type encountered: {}", type);
                return null;
        }
    }

    /**
     * Determines the color of a roulette number according to American roulette rules.
     * 
     * @param numberStr The number as a string (0-36 or "00")
     * @return "red", "black", or "green" for 0/00
     */
    private String getNumberColor(String numberStr) {
        if (numberStr.equals("0") || numberStr.equals("00")) return "green";
        
        try {
            // American roulette red numbers
            ArrayList<String> redNumbers = new ArrayList<>(java.util.Arrays.asList(
                "1", "3", "5", "7", "9", "12", "14", "16", "18", 
                "19", "21", "23", "25", "27", "30", "32", "34", "36"
            ));
            return redNumbers.contains(numberStr) ? "red" : "black";
        } catch (NumberFormatException e) {
            log.error("Invalid number format for color determination: {}", numberStr);
            return "green";
        }
    } 
}
