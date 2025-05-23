package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.InsufficientBalanceException;
import udaw.casino.model.Bet;
import udaw.casino.model.User;
import udaw.casino.repository.BetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.List;

/**
 * Service class for managing betting operations in the casino.
 * Handles bet creation, resolution, and retrieval operations with proper
 * validation and transaction management. Maintains bet history and
 * ensures proper state transitions for bets.
 */
@Service
public class BetService {

    private final BetRepository betRepository;
    private final UserService userService;
    private final GameService gameService;

    public BetService(BetRepository betRepository, UserService userService, GameService gameService) {
        this.gameService = gameService; 
        this.betRepository = betRepository;
        this.userService = userService;
    }

    /**
     * Creates a new bet with proper validation and initial state setup.
     * Validates user and game existence, checks user balance, and sets
     * initial bet state (PENDING status and zero win/loss).
     * 
     * @param bet The bet to create
     * @return The created bet with initial state
     * @throws IllegalArgumentException if user or game is invalid
     * @throws InsufficientBalanceException if user has insufficient balance
     */
    @Transactional
    public Bet createBet(Bet bet) {
        // Validate user and game existence
        if (bet.getUser() == null || bet.getUser().getId() == null) {
            throw new IllegalArgumentException("Bet must have a valid User.");
        }
        if (bet.getGame() == null || bet.getGame().getId() == null) {
            throw new IllegalArgumentException("Bet must have a valid Game.");
        }

        // Validate user balance
        User user = userService.getUserById(bet.getUser().getId());
        if (user.getBalance() < bet.getAmount()) {
            throw new InsufficientBalanceException("Insufficient balance to place this bet. Current balance: " + user.getBalance());
        }
        
        // Initialize bet state
        bet.setBetDate(LocalDateTime.now());
        bet.setStatus("PENDING");
        bet.setWinloss(0.0);
        bet.setUser(user);

        return betRepository.save(bet);
    }

    /**
     * Resolves a pending bet by updating its status based on win/loss amount.
     * Changes status to "WON" for positive win/loss or "LOST" for zero/negative.
     * 
     * @param bet The bet to resolve
     * @return The resolved bet with updated status
     */
    @Transactional
    public Bet resolveBet(Bet bet) {
        if (!"PENDING".equals(bet.getStatus())) {
            return bet;
        }

        if (bet.getWinloss() > 0) {
            bet.setStatus("WON");
        } else if (bet.getWinloss() < 0) { // Changed from == 0 to < 0 for "LOST"
            bet.setStatus("LOST");
        } else if (bet.getWinloss() == 0) {
            bet.setStatus("TIE");
        } else {
            // Handle unexpected winloss values if necessary, e.g., throw an exception
            // Or set a default status like "UNKNOWN"
            bet.setStatus("UNKNOWN"); 
        }
    Bet resolvedBet = betRepository.save(bet);
    return resolvedBet;
}
    
    
    /**
     * Retrieves a bet by its ID.
     * 
     * @param id The bet ID
     * @return The found bet
     * @throws ResourceNotFoundException if bet is not found
     */
    public Bet getBetById(Long id) {
        return betRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bet", "id", id));
    }

    /**
     * Retrieves all bets for a specific user, ordered by bet date descending.
     * 
     * @param userId The user ID
     * @return List of user's bets
     * @throws ResourceNotFoundException if user is not found
     */
    public List<Bet> getBetsByUser(Long userId) {
        try {
            userService.getUserById(userId);
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        return betRepository.findByUserIdOrderByBetDateDesc(userId);
    }

    /**
     * Retrieves all bets for a specific game, ordered by bet date descending.
     * 
     * @param gameId The game ID
     * @return List of game's bets
     * @throws ResourceNotFoundException if game is not found
     */
    public List<Bet> getBetsByGame(Long gameId) {
        try {
            gameService.getGameById(gameId); 
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("Game", "id", gameId);
        }
        return betRepository.findByGameIdOrderByBetDateDesc(gameId);
    }

    /**
     * Retrieves all bets for a specific user and game combination,
     * ordered by bet date descending.
     * 
     * @param userId The user ID
     * @param gameId The game ID
     * @return List of matching bets
     * @throws ResourceNotFoundException if user or game is not found
     */
    public List<Bet> getBetsByUserAndGame(Long userId, Long gameId) {
        try {
            userService.getUserById(userId);
            gameService.getGameById(gameId);
        } catch (ResourceNotFoundException e) {
            throw e;
        }
        
        return betRepository.findByUserIdAndGameIdOrderByBetDateDesc(userId, gameId);
    }

    /**
     * Retrieves all bets in the system.
     * 
     * @return List of all bets
     */
    public List<Bet> getAllBets() {
        return betRepository.findAll();
    }

    /**
     * @param bet The bet to save
     * @return The saved bet
     * @throws Exception if save operation fails
     */
    @Transactional
    public Bet saveBet(Bet bet) {
        try {
            Bet savedBet = betRepository.save(bet);  
                      
            return savedBet;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
