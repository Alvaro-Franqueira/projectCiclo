package udaw.casino;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class CasinoApplication {

	public static void main(String[] args) {
		SpringApplication.run(CasinoApplication.class, args);
	}

	@Bean // Add this method
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
