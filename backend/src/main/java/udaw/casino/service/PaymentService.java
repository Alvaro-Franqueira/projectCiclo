package udaw.casino.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import udaw.casino.dto.PaymentIntentDTO;
import udaw.casino.dto.PaymentIntentResponseDTO;
import udaw.casino.dto.ProcessPaymentDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.User;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Service class for handling payment operations in the casino.
 * Integrates with Stripe for payment processing and provides both
 * Stripe-based and direct payment methods. Handles payment intents,
 * webhook events, and balance updates for users.
 */
@Service
public class PaymentService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${stripe.currency}")
    private String currency;

    @Value("${stripe.credit.multiplier}")
    private int creditMultiplier;

    private final UserService userService;

    @Autowired
    public PaymentService(UserService userService) {
        this.userService = userService;
    }

    /**
     * Initializes the Stripe API with the configured API key.
     * Called automatically after dependency injection.
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        System.out.println("Stripe API Key Initialized.");
    }

    /**
     * Creates a new payment intent in Stripe for processing a payment.
     * Supports both card and PayPal payment methods.
     * 
     * @param paymentIntentDTO Payment details including user ID and amount
     * @return PaymentIntentResponseDTO containing client secret and payment details
     * @throws StripeException if there's an error with Stripe API
     * @throws RuntimeException if user not found or other unexpected errors occur
     */
    public PaymentIntentResponseDTO createPaymentIntent(PaymentIntentDTO paymentIntentDTO) throws StripeException {
        try {
            // Validate user existence
            User user = userService.getUserById(paymentIntentDTO.getUserId());
            
            System.out.println("Creating payment intent for user: " + user.getUsername() + 
                              ", amount: " + paymentIntentDTO.getAmount() + 
                              ", currency: " + paymentIntentDTO.getCurrency());
            
            // Configure payment intent parameters
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(paymentIntentDTO.getAmount())
                    .setCurrency(paymentIntentDTO.getCurrency())
                    .addAllPaymentMethodType(Arrays.asList("card", "paypal"))
                    .putMetadata("userId", user.getId().toString())
                    .build();
            
            // Create and return payment intent
            PaymentIntent paymentIntent = PaymentIntent.create(params);
            System.out.println("Payment intent created with ID: " + paymentIntent.getId());
            
            return new PaymentIntentResponseDTO(
                    paymentIntent.getClientSecret(),
                    paymentIntent.getId(),
                    paymentIntent.getAmount(),
                    paymentIntent.getCurrency()
            );
        } catch (ResourceNotFoundException e) {
            System.err.println("User not found: " + e.getMessage());
            throw new RuntimeException("Unexpected error", e);
        } catch (StripeException e) {
            System.err.println("Stripe error: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            throw new RuntimeException("Unexpected error", e);
        }
    }

    /**
     * Processes incoming Stripe webhook events.
     * Currently handles payment_intent.succeeded events to update user balances.
     * 
     * @param payload The raw webhook payload from Stripe
     * @param sigHeader The Stripe signature header for verification
     * @return A message indicating the processing result
     * @throws StripeException if webhook signature verification fails
     */
    @Transactional
    public String handleWebhookEvent(String payload, String sigHeader) throws StripeException {
        Event event;
        
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            throw new RuntimeException("Webhook signature verification failed", e);
        }
        
        // Process payment success events
        if ("payment_intent.succeeded".equals(event.getType())) {
            EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
            StripeObject stripeObject = dataObjectDeserializer.getObject().orElse(null);
            
            if (stripeObject instanceof PaymentIntent) {
                PaymentIntent paymentIntent = (PaymentIntent) stripeObject;
                return processSuccessfulPayment(paymentIntent);
            }
        }
        
        return "Unhandled event type: " + event.getType();
    }
    
    /**
     * Processes a successful payment by updating the user's balance.
     * Converts the payment amount to casino credits using the configured multiplier.
     * 
     * @param paymentIntent The successful payment intent from Stripe
     * @return A message indicating the processing result
     */
    @Transactional
    public String processSuccessfulPayment(PaymentIntent paymentIntent) {
        try {
            // Extract user ID from payment metadata
            String userIdStr = paymentIntent.getMetadata().get("userId");
            if (userIdStr == null) {
                return "User ID not found in payment metadata";
            }
            
            // Update user balance with converted credits
            Long userId = Long.parseLong(userIdStr);
            User user = userService.getUserById(userId);
            
            long amountPaid = paymentIntent.getAmount();
            double realAmount = amountPaid / 100.0; // Convert from cents to dollars/euros
            double creditsToAdd = realAmount * creditMultiplier;
            
            double newBalance = user.getBalance() + creditsToAdd;
            userService.updateBalance(userId, newBalance);
            
            return "Payment processed successfully. Added " + creditsToAdd + " credits to user " + userId;
        } catch (ResourceNotFoundException e) {
            return "User not found: " + e.getMessage();
        } catch (Exception e) {
            return "Error processing payment: " + e.getMessage();
        }
    }
    
    /**
     * Processes a payment directly without using Stripe.
     * This is a simplified version for testing and development purposes.
     * Converts payment amount to casino credits using the configured multiplier.
     * 
     * @param paymentDTO Payment details including user ID, amount, and card number
     * @return Map containing success status, credits added, new balance, and message
     */
    @Transactional
    public Map<String, Object> processDirectPayment(ProcessPaymentDTO paymentDTO) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Validate user and process payment
            User user = userService.getUserById(paymentDTO.getUserId());
            
            System.out.println("Processing direct payment for user: " + user.getUsername() + 
                              ", amount: " + paymentDTO.getAmount() + 
                              ", card: **** **** **** " + paymentDTO.getCardNumber());
            
            // Calculate and add credits
            double creditsToAdd = paymentDTO.getAmount() * creditMultiplier;
            double newBalance = user.getBalance() + creditsToAdd;
            userService.updateBalance(paymentDTO.getUserId(), newBalance);
            
            // Prepare success response
            result.put("success", true);
            result.put("creditsAdded", creditsToAdd);
            result.put("newBalance", newBalance);
            result.put("message", "Payment processed successfully");
            
            return result;
        } catch (ResourceNotFoundException e) {
            System.err.println("User not found: " + e.getMessage());
            result.put("success", false);
            result.put("message", "User not found: " + e.getMessage());
            return result;
        } catch (Exception e) {
            System.err.println("Error processing payment: " + e.getMessage());
            result.put("success", false);
            result.put("message", "Error processing payment: " + e.getMessage());
            return result;
        }
    }
}
