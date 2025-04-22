package udaw.casino.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import udaw.casino.dto.PaymentIntentDTO;
import udaw.casino.dto.PaymentIntentResponseDTO;
import udaw.casino.dto.ProcessPaymentDTO;
import udaw.casino.exception.ResourceNotFoundException;
import udaw.casino.model.Usuario;

import java.util.HashMap;
import java.util.Map;

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

    private final UsuarioService usuarioService;

    @Autowired
    public PaymentService(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    /**
     * Creates a payment intent in Stripe
     * 
     * @param paymentIntentDTO Payment intent data
     * @return PaymentIntentResponseDTO with client secret and other details
     * @throws StripeException If there's an error with Stripe
     */
    public PaymentIntentResponseDTO createPaymentIntent(PaymentIntentDTO paymentIntentDTO) throws StripeException {
        try {
            // Validate user exists
            Usuario usuario = usuarioService.obtenerUsuarioPorId(paymentIntentDTO.getUserId());
            
            System.out.println("Creating payment intent for user: " + usuario.getUsername() + 
                              ", amount: " + paymentIntentDTO.getAmount() + 
                              ", currency: " + paymentIntentDTO.getCurrency());
            
            // Create payment intent
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(paymentIntentDTO.getAmount())
                    .setCurrency(paymentIntentDTO.getCurrency())
                    .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                            .setEnabled(true)
                            .build()
                    )
                    .putMetadata("userId", usuario.getId().toString())
                    .build();
            
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
     * Handles Stripe webhook events
     * 
     * @param payload The webhook payload
     * @param sigHeader The Stripe signature header
     * @return A message indicating the result
     * @throws StripeException If there's an error with Stripe
     */
    @Transactional
    public String handleWebhookEvent(String payload, String sigHeader) throws StripeException {
        Event event;
        
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            throw new RuntimeException("Webhook signature verification failed", e);
        }
        
        // Handle the event
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
     * Process a successful payment by updating the user's balance
     * 
     * @param paymentIntent The successful payment intent
     * @return A message indicating the result
     */
    @Transactional
    public String processSuccessfulPayment(PaymentIntent paymentIntent) {
        try {
            // Get user ID from metadata
            String userIdStr = paymentIntent.getMetadata().get("userId");
            if (userIdStr == null) {
                return "User ID not found in payment metadata";
            }
            
            Long userId = Long.parseLong(userIdStr);
            Usuario usuario = usuarioService.obtenerUsuarioPorId(userId);
            
            // Calculate credits to add (1000 credits per EUR/USD)
            long amountPaid = paymentIntent.getAmount();
            double realAmount = amountPaid / 100.0; // Convert from cents to dollars/euros
            double creditsToAdd = realAmount * creditMultiplier;
            
            // Update user balance
            double newBalance = usuario.getBalance() + creditsToAdd;
            usuarioService.actualizarBalance(userId, newBalance);
            
            return "Payment processed successfully. Added " + creditsToAdd + " credits to user " + userId;
        } catch (ResourceNotFoundException e) {
            return "User not found: " + e.getMessage();
        } catch (Exception e) {
            return "Error processing payment: " + e.getMessage();
        }
    }
    
    /**
     * Process a payment directly without using Stripe
     * This is a simplified version for demo purposes
     * 
     * @param paymentDTO Payment data including user ID and amount
     * @return Map containing the updated balance and credits added
     */
    @Transactional
    public Map<String, Object> processDirectPayment(ProcessPaymentDTO paymentDTO) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Validate user exists
            Usuario usuario = usuarioService.obtenerUsuarioPorId(paymentDTO.getUserId());
            
            System.out.println("Processing direct payment for user: " + usuario.getUsername() + 
                              ", amount: " + paymentDTO.getAmount() + 
                              ", card: **** **** **** " + paymentDTO.getCardNumber());
            
            // Calculate credits to add (1000 credits per EUR/USD)
            double creditsToAdd = paymentDTO.getAmount() * creditMultiplier;
            
            // Update user balance in the database
            double newBalance = usuario.getBalance() + creditsToAdd;
            usuarioService.actualizarBalance(paymentDTO.getUserId(), newBalance);
            
            // Return the result
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
