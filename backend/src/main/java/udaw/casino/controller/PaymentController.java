package udaw.casino.controller;

import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import udaw.casino.dto.PaymentIntentDTO;
import udaw.casino.dto.PaymentIntentResponseDTO;
import udaw.casino.dto.ProcessPaymentDTO;
import udaw.casino.service.PaymentService;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for managing payment operations in the casino system.
 * Provides endpoints for processing payments, handling Stripe integration,
 * and managing payment-related webhooks.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    
    @Value("${stripe.publishable.key}")
    private String publishableKey;

    /**
     * Constructs a new PaymentController with the required PaymentService.
     *
     * @param paymentService The service for handling payment operations.
     */
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
    
    /**
     * Returns the Stripe publishable key for use in the frontend.
     * This key is required for initializing Stripe.js in the client application.
     * 
     * @return ResponseEntity containing the Stripe publishable key configuration.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getPublishableKey() {
        Map<String, String> config = new HashMap<>();
        config.put("publishableKey", publishableKey);
        return ResponseEntity.ok(config);
    }

    /**
     * Creates a payment intent for processing a payment through Stripe.
     * This endpoint is used to initiate a payment transaction and obtain
     * the necessary client secret for completing the payment on the frontend.
     * 
     * @param paymentIntentDTO Payment details including amount and currency.
     * @return ResponseEntity containing the payment intent details or error information.
     */
    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody PaymentIntentDTO paymentIntentDTO) {
        try {
            PaymentIntentResponseDTO response = paymentService.createPaymentIntent(paymentIntentDTO);
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Webhook endpoint for Stripe to notify about payment events.
     * This endpoint receives notifications from Stripe about payment status changes
     * and other relevant events. The signature header is used to verify the authenticity
     * of the webhook payload.
     * 
     * @param payload The webhook payload containing event data from Stripe.
     * @param sigHeader The Stripe signature header for verifying the webhook authenticity.
     * @return ResponseEntity indicating the result of processing the webhook.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            String result = paymentService.handleWebhookEvent(payload, sigHeader);
            return ResponseEntity.ok(result);
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Server error processing webhook: " + e.getMessage());
        }
    }
    
    /**
     * Process a payment directly without using Stripe.
     * This is a simplified version for demo purposes, allowing direct
     * balance updates without going through the Stripe payment flow.
     * 
     * @param paymentDTO Payment data including user ID and amount.
     * @return ResponseEntity containing the updated balance and credits added,
     *         or error information if the payment fails.
     */
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody ProcessPaymentDTO paymentDTO) {
        try {
            Map<String, Object> result = paymentService.processDirectPayment(paymentDTO);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
