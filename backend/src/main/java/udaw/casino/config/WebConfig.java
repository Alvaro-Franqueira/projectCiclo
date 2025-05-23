package udaw.casino.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

/**
 * Configuration class for web-related settings in the casino system.
 * This class configures CORS (Cross-Origin Resource Sharing) to allow requests from specified origins,
 * enabling the frontend to communicate with the backend securely.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configures CORS mappings to allow requests from specified origins.
     * This method sets up allowed origins, methods, headers, and credentials for CORS requests.
     *
     * @param registry The CorsRegistry to configure.
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173", "http://casinovirtual.com:5173", "http://virtualcasino.com:5173", "http://virtualcasino:5173") // Frontend URL
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization")
                .allowCredentials(true);
    }
}
