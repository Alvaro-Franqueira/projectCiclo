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


@Service
public class RouletteService {

    // NAME OF THE GAME
    private static final String ROULETTE_GAME_NAME = "Roulette"; // Define game name constant

    private static final Logger log = LoggerFactory.getLogger(RouletteService.class);

    private final BetService betService;
    private final UserService userService;
    private final GameService gameService; 
    private final UserRepository userRepository; 
    
    // Constructor remains the same
    public RouletteService(UserRepository userRepository, BetService betService, UserService userService, GameService gameService) {
        this.betService = betService;
        this.userService = userService;
        this.gameService = gameService;
        this.userRepository = userRepository; // Initialize the user repository
    }

    // For single bets    
    @Transactional
    public Bet playRoulette(Long userId, double amount, String betType, String betValue, String winningNumberController) {
        // --- Validation ---
        
        User user = userService.getUserById(userId);
        Game rouletteGame = gameService.getGameByName(ROULETTE_GAME_NAME);

        log.info("User {} playing Roulette (Game ID: {}) with bet type: {}, value: {}, amount: {}. Frontend winning number: {}",
                 user.getUsername(), rouletteGame.getId(), betType, betValue, amount, winningNumberController);

        // Create the bet object (BetService handles balance check)
        Bet bet = new Bet();
        bet.setUser(user);
        bet.setGame(rouletteGame); // Set the fetched game object
        bet.setAmount(amount);
        bet.setBetType(betType); // Consider using an Enum for bet types too
        bet.setBetValue(betValue);

        // Create the bet via BetService (checks balance, saves initial bet)
        Bet createdBet = betService.createBet(bet);
        
        // Determine if the bet won using the frontend's number
        createdBet.setWinningValue(winningNumberController);
        Double winnings = determineRouletteResult(createdBet, winningNumberController);
        if (winnings == null) {
            log.error("Invalid bet type or value: type={}, value={}", betType, betValue);
            throw new IllegalArgumentException("Invalid bet type or value: " + betType + ", " + betValue);
        }

        // Update the bet with the result
        createdBet.setWinloss(winnings);
        
        // Update user balance based on bet result
        double newBalance = user.getBalance() + winnings;
        user.setBalance(newBalance);
        userRepository.save(user);
        
        // Save the updated bet
        Bet finalizedBet = betService.resolveBet(createdBet);
        
        log.info("Bet completed for user {}. Result: {}, New balance: {}", 
                 user.getUsername(), winnings, newBalance);
        
        return finalizedBet;
    }

    // Determine the result of a bet based on the winning number
    private Double determineRouletteResult(Bet bet, String winningNumberStr) {
        String type = bet.getBetType();
        String value = bet.getBetValue();
        
        // Log the bet and winning number for debugging, development only    
        log.info("Determining result for bet: type={}, value={}, winning number={}", 
                type, value, winningNumberStr);

        int winningNumber = 0;
        try {
            if (!winningNumberStr.equals("00")) {
                winningNumber = Integer.parseInt(winningNumberStr); // for calculations
            }
        } catch (NumberFormatException e) {
            log.error("Error parsing winning number: {}", winningNumberStr);
            return null;
        }
        
        String winningColor = getNumberColor(winningNumberStr);
        
        // Process the bet based on its type
        switch (type.toLowerCase()) {
            case "number":// Direct number bet (pays 35:1)
                if (value.equals(winningNumberStr)) { // checks 0 and 00
                    // development only
                    log.info("Number bet win: bet value '{}' matches winning number '{}'", value, winningNumberStr);
                    return bet.getAmount() * 35; 
                } else {
                    log.info("Number bet loss: bet value '{}' does not match winning number '{}'", value, winningNumberStr);
                    return -bet.getAmount(); 
                }
                
            case "color": // expects 1 for red and 2 for black
                if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); // 0 and 00 are not red or black
                if ((winningColor.equals("red") && value.equals("1")) || 
                    (winningColor.equals("black") && value.equals("2"))) {
                    return bet.getAmount(); // Winning bet
                } else {
                    return -bet.getAmount(); // Losing bet
                }
            
                 
            case "parity": // Assuming "even" or "odd" from frontend
                if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); 
                String winningParity;
                winningParity = (winningNumber % 2 == 0) ? "even" : "odd";

                if (value.equals(winningParity)){
                    return bet.getAmount();
                } else {
                    return -bet.getAmount();
                }
            // Ensure frontend bet values match expected values here (e.g., 'red', 'even', '1', 'low')
            case "dozen": // Winning dozen pays 2:1
                 try {
                     if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); 
                     int betDozen = Integer.parseInt(value); // Expecting "1", "2", or "3"
                     int winningDozen = (int) Math.ceil((double) winningNumber / 12.0);
                     return betDozen == winningDozen ? bet.getAmount() * 2 : -bet.getAmount();
                 } catch (NumberFormatException | ArithmeticException e) {
                      log.warn("Invalid value for 'dozen' bet: {} or error calculating dozen for {}", value, winningNumber, e);
                      return null; 
                 }
             case "column":
                 try {
                     if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); 
                     int betColumn = Integer.parseInt(value); // Expecting "1", "2", or "3"
                     int winningColumn = (winningNumber % 3 == 0) ? 3 : winningNumber % 3;
                     return betColumn == winningColumn ? bet.getAmount() * 2 : -bet.getAmount();
                 } catch (NumberFormatException e) {
                      log.warn("Invalid value for 'column' bet: {}", value, e);
                      return null;
                 }
             case "half": // Expecting "low" (1-18) or "high" (19-36)
                 if (winningNumberStr.equals("0") || winningNumberStr.equals("00")) return -bet.getAmount(); // 0 and 00 are neither high nor low
                 boolean isWinningLow = winningNumber >= 1 && winningNumber <= 18;
                 boolean isBetLow = value.equals("low");
                 return (isWinningLow == isBetLow) ? bet.getAmount() : -bet.getAmount(); 

            default:
                 log.warn("Unknown bet type encountered: {}", type);
                return null;
        }
    }

    /**
     * Gets the color corresponding to a roulette number.
     *
     * @param numberStr The number (0-36 or "00").
     * @return "red", "black", or "green".
     */
    private String getNumberColor(String numberStr) {
        if (numberStr.equals("0") || numberStr.equals("00")) return "green";
        
        try {
            // Standard American roulette coloring
            ArrayList<String> redNumbers = new ArrayList<>(java.util.Arrays.asList("1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"));
            if (redNumbers.contains(numberStr)) return "red";
            return "black";
        } catch (NumberFormatException e) {
            log.error("Invalid number format for color determination: {}", numberStr);
            return "green"; // Default to green for invalid numbers
        }
    } 
}
