package udaw.casino.config;

import com.stripe.Stripe;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Configuration class for Stripe integration in the casino system.
 * This class initializes the Stripe API key and provides access to the webhook secret.
 * It ensures that the Stripe API is properly configured for payment processing.
 */
@Configuration
public class StripeConfig {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    /**
     * Initializes the Stripe API with the configured API key.
     * This method is called after the bean is constructed to ensure the API key is set.
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    /**
     * Provides the Stripe API key as a bean for use in other parts of the application.
     *
     * @return The Stripe API key.
     */
    @Bean
    public String stripeApiKey() {
        return stripeApiKey;
    }

    /**
     * Provides the Stripe webhook secret as a bean for use in other parts of the application.
     *
     * @return The Stripe webhook secret.
     */
    @Bean
    public String webhookSecret() {
        return webhookSecret;
    }
}
