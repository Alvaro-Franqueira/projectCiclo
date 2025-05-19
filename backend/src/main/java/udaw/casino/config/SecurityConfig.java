package udaw.casino.config; // Make sure this package matches your project structure

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Important for specifying HTTP methods
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import udaw.casino.security.JwtAuthenticationFilter; // Make sure this path is correct

/**
 * Configuration class for Spring Security in the casino system.
 * This class sets up security rules, authentication mechanisms, and access control for the application.
 * It uses JWT for stateless authentication and defines endpoints accessible to different user roles.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize, @PostAuthorize, @Secured
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructs a new SecurityConfig with the required JwtAuthenticationFilter, UserDetailsService, and PasswordEncoder.
     *
     * @param jwtAuthenticationFilter The filter for handling JWT authentication.
     * @param userDetailsService The service for loading user details.
     * @param passwordEncoder The encoder for handling password operations.
     */
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          UserDetailsService userDetailsService,
                          PasswordEncoder passwordEncoder) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Configures the AuthenticationManager to use the UserDetailsService and PasswordEncoder.
     *
     * @return An AuthenticationManager configured for the application.
     */
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authProvider);
    }

    /**
     * Configures the SecurityFilterChain to define security rules and authentication mechanisms.
     * This method sets up CORS, CSRF, session management, and endpoint access control.
     *
     * @param http The HttpSecurity object to configure.
     * @return A SecurityFilterChain configured for the application.
     * @throws Exception If an error occurs during configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults()) // Enable CORS with default configuration
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF as we are using JWT (stateless)
            .authorizeHttpRequests(auth -> auth
                // --- PUBLICLY ACCESSIBLE ENDPOINTS (Unauthenticated access) ---
                .requestMatchers(
                    "/api/users/login",          // User login
                    "/api/users/register",       // User registration
                    "/api/users/me",             // Get current user
                    "/api/payments/webhook"      // Payment webhook
                ).permitAll()

                // --- AUTHENTICATED USER ENDPOINTS (Any logged-in user: USER or ADMIN) ---
                // Logged-in users can GET game information
                .requestMatchers(HttpMethod.GET, "/api/games", "/api/games/**").authenticated()
                // Logged-in users can GET their own or other users' (public) details
                .requestMatchers(HttpMethod.GET, "/api/users/username/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/users/id/**").authenticated()
                
                // Allow access to rankings endpoints for authenticated users
                // Explicitly list all ranking endpoints to ensure all ranking types are accessible
                .requestMatchers(HttpMethod.GET, 
                    "/api/rankings/v2",
                    "/api/rankings/v2/type/*", 
                    "/api/rankings/v2/game/*/type/*",
                    "/api/rankings/v2/user/*").authenticated()
                
                // Allow access to betting endpoints for authenticated users
                .requestMatchers(HttpMethod.GET, "/api/bets/**").authenticated()
                // Allow authenticated users to POST to betting endpoints
                .requestMatchers(HttpMethod.POST, "/api/bets/**").authenticated()

                // Add other endpoints here that any authenticated user can access
                // Example: .requestMatchers("/api/user/profile").authenticated()

                // --- ADMIN ONLY ENDPOINTS ---
                // For user management operations restricted to ADMINs
                .requestMatchers("/api/users/admin/**").hasRole("ADMIN")
                // Only ADMINS can create, update, or delete games
                .requestMatchers(HttpMethod.POST, "/api/games").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/games/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/games/**").hasRole("ADMIN")
                // Add other endpoints here that only ADMINs can access
                // Example: .requestMatchers("/api/reports/**").hasRole("ADMIN")

                // --- ALL OTHER REQUESTS MUST BE AUTHENTICATED (Default fallback) ---
                // This will cover any other endpoints not explicitly defined above.
                .anyRequest().authenticated()
            )
            // Configure session management to be stateless, as we are using JWTs
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Disable HTTP Basic authentication
            .httpBasic(AbstractHttpConfigurer::disable)
            // Disable form login
            .formLogin(AbstractHttpConfigurer::disable)
            // Add our custom JWT authentication filter before the standard Spring Security username/password filter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}