package udaw.casino.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import udaw.casino.model.User;
import udaw.casino.repository.UserRepository;

import java.util.Collections;

/**
 * Implementation of Spring Security's UserDetailsService interface.
 * This service is responsible for loading user-specific data during authentication.
 * It converts our application's User entity into Spring Security's UserDetails object.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Constructs a new UserDetailsServiceImpl with the required UserRepository.
     *
     * @param userRepository The repository for accessing user data.
     */
    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads a user by their username.
     * This method is called by Spring Security during the authentication process.
     * It retrieves the user from the database and converts it into a UserDetails object.
     *
     * @param username The username of the user to load.
     * @return A UserDetails object containing the user's authentication and authorization information.
     * @throws UsernameNotFoundException If the user is not found in the database.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Create Spring Security UserDetails from our User entity
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }
}
