package udaw.casino.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.apache.commons.validator.routines.EmailValidator;
import java.util.Arrays;
import java.util.List;

/**
 * Custom validator for email format using Apache Commons Validator
 */
public class EmailConstraintValidator implements ConstraintValidator<ValidEmail, String> {

    private static final EmailValidator EMAIL_VALIDATOR = EmailValidator.getInstance(true);
    private static final List<String> DISPOSABLE_DOMAINS = Arrays.asList(
            "mailinator.com", "yopmail.com", "tempmail.com", "guerrillamail.com", 
            "throwawaymail.com", "10minutemail.com", "trashmail.com", "sharklasers.com",
            "temp-mail.org", "fakeinbox.com");

    @Override
    public void initialize(ValidEmail constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        // Skip validation if email is null (handled by @NotBlank)
        if (email == null) {
            return true;
        }
        
        // Check length first
        if (email.length() > 100) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Email cannot be longer than 100 characters")
                   .addConstraintViolation();
            return false;
        }
        
        // Use Apache Commons EmailValidator for robust validation
        if (!EMAIL_VALIDATOR.isValid(email)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Invalid email format")
                   .addConstraintViolation();
            return false;
        }
        
        // Check for common disposable email domains
        String domain = email.substring(email.indexOf('@') + 1).toLowerCase();
        
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Disposable email addresses are not allowed")
                   .addConstraintViolation();
            return false;
        }
        
        return true;
    }
}
