package udaw.casino;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Main application class for the Casino backend service.
 * This class serves as the entry point for the Spring Boot application
 * and provides essential configuration beans.
 */
@SpringBootApplication
public class CasinoApplication {

	/**
	 * Main method that bootstraps the Spring Boot application.
	 * @param args Command line arguments passed to the application
	 */
	public static void main(String[] args) {
		SpringApplication.run(CasinoApplication.class, args);
	}

	/**
	 * Configures and provides a BCrypt password encoder bean.
	 * This encoder is used throughout the application for secure password hashing.
	 * BCrypt is used because it automatically handles salt generation and storage.
	 * 
	 * @return A configured BCryptPasswordEncoder instance
	 */
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
