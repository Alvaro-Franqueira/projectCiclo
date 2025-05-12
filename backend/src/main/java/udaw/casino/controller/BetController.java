package udaw.casino.controller;

import udaw.casino.dto.BetDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Bet;
import udaw.casino.service.BetService;
import udaw.casino.service.GameService;
import udaw.casino.service.UserService;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bets") // Base path for bets
public class BetController {

    @Autowired
    private final BetService betService;
    private final UserService userService;
    private final GameService gameService;
    public BetController(BetService betService, UserService userService, GameService gameService) {
        this.betService = betService;
        this.userService = userService;
        this.gameService = gameService;
    }

    // GET /api/bets/{id} - Get a specific bet by ID
    @GetMapping("/{id}")
    public ResponseEntity<BetDTO> getBetById(@PathVariable Long id) {
        try {
            Bet bet = betService.getBetById(id);
            return ResponseEntity.ok(new BetDTO(bet));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/bets/user/{userId} - Get all bets for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BetDTO>> getBetsByUser(@PathVariable Long userId) {
        try {
            // Service already checks if user exists
            List<Bet> bets = betService.getBetsByUser(userId);
            List<BetDTO> betsDTO = new ArrayList<>();
            for (Bet bet : bets) {
                betsDTO.add(new BetDTO(bet));
            }
            return ResponseEntity.ok(betsDTO);
        } catch (ResourceNotFoundException e) {
             // This happens if the user specified by userId doesn't exist
             return ResponseEntity.notFound().build();
        }
    }

    // GET /api/bets/game/{gameId} - Get all bets for a game
    @GetMapping("/game/{gameId}")
    public ResponseEntity<List<Bet>> getBetsByGame(@PathVariable Long gameId) {
        // Consider adding check if game exists via GameService first
        List<Bet> bets = betService.getBetsByGame(gameId);
        return ResponseEntity.ok(bets);
    }

    // GET /api/bets/user/{userId}/game/{gameId} - Get all bets for a user in a specific game
    @GetMapping("/user/{userId}/game/{gameId}")
    public ResponseEntity<List<Bet>> getBetsByUserAndGame(
            @PathVariable Long userId, 
            @PathVariable Long gameId) {
        try {
            List<Bet> bets = betService.getBetsByUserAndGame(userId, gameId);
            return ResponseEntity.ok(bets);
        } catch (ResourceNotFoundException e) {
            // This happens if the user specified by userId doesn't exist
            return ResponseEntity.notFound().build();
        }
    }
    // GET /api/bets - Get all bets (Admin only)
    @GetMapping
    public ResponseEntity<List<Bet>> getAllBets() {
        List<Bet> bets = betService.getAllBets();
        return ResponseEntity.ok(bets);
    }

    // GET /api/bets/blackjack - Get all blackjack bets (for debugging)
    @GetMapping("/blackjack")
    public ResponseEntity<List<Bet>> getAllBlackjackBets() {
        try {
            // Game ID 9 is blackjack
            List<Bet> bets = betService.getBetsByGame(9L);
            System.out.println("Retrieved " + bets.size() + " blackjack bets");
            for (Bet bet : bets) {
                System.out.println("Bet ID: " + bet.getId() + 
                                   ", User ID: " + bet.getUser().getId() + 
                                   ", Amount: " + bet.getAmount() + 
                                   ", Status: " + bet.getStatus() + 
                                   ", Type: " + bet.getBetType() + 
                                   ", Date: " + bet.getBetDate());
            }
            return ResponseEntity.ok(bets);
        } catch (Exception e) {
            System.err.println("Error retrieving blackjack bets: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // POST /api/bets - Create a new bet with improved transaction handling
    @PostMapping
    public ResponseEntity<BetDTO> createBet(@RequestBody BetDTO betDTO) {
        try {
            System.out.println("Received bet data: " + betDTO);
            
            Bet bet = new Bet();
            bet.setUser(userService.getUserById(betDTO.getUserId()));
            bet.setGame(gameService.getGameById(betDTO.getGameId()));
            bet.setAmount(betDTO.getAmount());
            // Always use server time for consistency with other game controllers
            bet.setBetDate(java.time.LocalDateTime.now());
            bet.setStatus(betDTO.getStatus()); // Set the status from the DTO
            bet.setWinloss(betDTO.getWinloss());
            bet.setBetType(betDTO.getType());
            bet.setBetValue(betDTO.getBetValue());
            bet.setWinningValue(betDTO.getWinningValue());
            
            System.out.println("About to save bet: " + bet);
            
            // First check if blackjack game exists
            try {
                System.out.println("Verifying game ID: " + betDTO.getGameId());
                gameService.getGameById(betDTO.getGameId());
                System.out.println("Game ID " + betDTO.getGameId() + " exists");
            } catch (Exception e) {
                System.err.println("Game ID " + betDTO.getGameId() + " does not exist: " + e.getMessage());
            }
            
            // Use saveBet directly instead of createBet to avoid overriding the status
            Bet savedBet = betService.saveBet(bet);
            
            System.out.println("Bet saved successfully with ID: " + savedBet.getId());
            
            // Now verify the bet was actually saved
            try {
                Bet testBet = betService.getBetById(savedBet.getId());
                System.out.println("Verified bet exists with ID: " + testBet.getId());
                System.out.println("Stored bet: Game ID=" + testBet.getGame().getId() + 
                                   ", Amount=" + testBet.getAmount() + 
                                   ", Status=" + testBet.getStatus());
            } catch (Exception e) {
                System.err.println("Could not verify bet was saved: " + e.getMessage());
            }
            
            BetDTO responseDTO = new BetDTO(savedBet);
            System.out.println("Returning response: " + responseDTO);
            
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error creating bet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // POST /api/bets/test-blackjack - Create a test blackjack bet (for debugging)
    @PostMapping("/test-blackjack")
    public ResponseEntity<Bet> createTestBlackjackBet() {
        try {
            System.out.println("Creating test blackjack bet");
            
            // Create a simple blackjack bet for testing
            Bet bet = new Bet();
            bet.setUser(userService.getUserById(4L)); // Assuming user ID 4 exists
            bet.setGame(gameService.getGameById(9L)); // Blackjack game ID
            bet.setAmount(5.0);
            bet.setBetDate(java.time.LocalDateTime.now());
            bet.setStatus("TEST");
            bet.setWinloss(-5.0);
            bet.setBetType("BLACKJACK_TEST");
            bet.setBetValue("21");
            bet.setWinningValue("17");
            
            System.out.println("About to save test bet: " + bet);
            
            // Save directly to the repository
            Bet savedBet = betService.saveBet(bet);
            
            System.out.println("Test bet saved successfully with ID: " + savedBet.getId());
            
            return ResponseEntity.ok(savedBet);
        } catch (Exception e) {
            System.err.println("Error creating test bet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
