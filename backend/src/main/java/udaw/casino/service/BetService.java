package udaw.casino.service;

import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.exception.InsufficientBalanceException;
import udaw.casino.model.Bet;
import udaw.casino.model.User;
import udaw.casino.repository.BetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BetService {

    private static final Logger log = LoggerFactory.getLogger(BetService.class);

    private final BetRepository betRepository;
    private final UserService userService;
    private final GameService gameService;
    public BetService(BetRepository betRepository, UserService userService, GameService gameService) {
        this.gameService = gameService; 
        this.betRepository = betRepository;
        this.userService = userService;
    }


    @Transactional
    public Bet createBet(Bet bet) {
        // Ensure user and game objects are valid and attached
        if (bet.getUser() == null || bet.getUser().getId() == null) {
            throw new IllegalArgumentException("Bet must have a valid User.");
        }
         if (bet.getGame() == null || bet.getGame().getId() == null) {
            throw new IllegalArgumentException("Bet must have a valid Game.");
        }
        // Fetch the latest user state to ensure balance is current
        User user = userService.getUserById(bet.getUser().getId());
        // Check balance
        if (user.getBalance() < bet.getAmount()) {
            throw new InsufficientBalanceException("Insufficient balance to place this bet. Current balance: " + user.getBalance());
        }
        
        // development only
        log.info("Creating bet for user {} with amount {}", user.getUsername(), bet.getAmount());

        // Set initial bet state
        bet.setBetDate(LocalDateTime.now());
        bet.setStatus("PENDING"); // Initial state
        bet.setWinloss(0.0); // No win/loss yet
        bet.setUser(user);

        return betRepository.save(bet);
    }


    @Transactional
    public Bet resolveBet(Bet bet) {
        Long betId = bet.getId();
        if (!"PENDING".equals(bet.getStatus())) {
             log.warn("Attempted to resolve an already resolved bet (ID: {}, Status: {})", betId, bet.getStatus());
             return bet; 
        }
        // Set the status based on winloss
        if (bet.getWinloss() > 0) {
            bet.setStatus("WON");
        } else {
            bet.setStatus("LOST");
        }
        // Save the updated bet status
        Bet resolvedBet = betRepository.save(bet);
        log.info("Bet {} resolved. Status: {}, Win/Loss: {}", betId, resolvedBet.getStatus(), resolvedBet.getWinloss());
        return resolvedBet;
    }
    
    public Bet getBetById(Long id) {
        return betRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bet", "id", id));
    }

    public List<Bet> getBetsByUser(Long userId) {
        try {
            userService.getUserById(userId);
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        return betRepository.findByUserIdOrderByBetDateDesc(userId); // Example ordering
    }

     public List<Bet> getBetsByGame(Long gameId) {
        try {
             gameService.getGameById(gameId); 
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException("Game", "id", gameId);
        }
        return betRepository.findByGameIdOrderByBetDateDesc(gameId); // Example ordering
    }

    public List<Bet> getBetsByUserAndGame(Long userId, Long gameId) {
        try {
            userService.getUserById(userId);
            gameService.getGameById(gameId);
        } catch (ResourceNotFoundException e) {
            throw e; // Re-throw the exception with the original message
        }
        
        return betRepository.findByUserIdAndGameIdOrderByBetDateDesc(userId, gameId);
    }

    public List<Bet> getAllBets() {
        return betRepository.findAll();
    }

    @Transactional
    public Bet saveBet(Bet bet) {
        try {
            log.info("Saving bet with details: User ID: {}, Game ID: {}, Amount: {}, Status: {}, Type: {}", 
                    bet.getUser().getId(), bet.getGame().getId(), bet.getAmount(), 
                    bet.getStatus(), bet.getBetType());
            
            // Print even more details for debugging
            System.out.println("SAVE BET DETAILS:");
            System.out.println("- User ID: " + bet.getUser().getId());
            System.out.println("- Game ID: " + bet.getGame().getId());
            System.out.println("- Amount: " + bet.getAmount());
            System.out.println("- Status: " + bet.getStatus());
            System.out.println("- Type: " + bet.getBetType());
            System.out.println("- BetValue: " + bet.getBetValue());
            System.out.println("- WinningValue: " + bet.getWinningValue());
            System.out.println("- WinLoss: " + bet.getWinloss());
            System.out.println("- BetDate: " + bet.getBetDate());
            
            Bet savedBet = betRepository.save(bet);
            log.info("Successfully saved bet with ID: {}", savedBet.getId());
            
            // Verify the bet was saved by retrieving it
            try {
                Bet verifiedBet = betRepository.findById(savedBet.getId()).orElse(null);
                if (verifiedBet != null) {
                    System.out.println("VERIFIED BET EXISTS WITH ID: " + verifiedBet.getId());
                } else {
                    System.err.println("ERROR: Bet could not be verified after save! ID: " + savedBet.getId());
                }
            } catch (Exception e) {
                System.err.println("ERROR verifying bet: " + e.getMessage());
            }
            
            return savedBet;
        } catch (Exception e) {
            System.err.println("ERROR saving bet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
