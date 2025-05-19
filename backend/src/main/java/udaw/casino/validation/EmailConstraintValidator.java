package udaw.casino.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.apache.commons.validator.routines.EmailValidator;
import java.util.Arrays;
import java.util.List;

/**
 * Custom validator for email format in the casino system.
 * This validator implements the validation logic for the @ValidEmail annotation.
 * It uses Apache Commons Validator for robust email format validation and adds
 * additional checks for length and disposable email domains.
 * 
 * Validation rules:
 * - Email must be properly formatted (using Apache Commons Validator)
 * - Maximum length: 100 characters
 * - Must not be from a known disposable email domain
 */
public class EmailConstraintValidator implements ConstraintValidator<ValidEmail, String> {

    /** Apache Commons EmailValidator instance for robust email format validation */
    private static final EmailValidator EMAIL_VALIDATOR = EmailValidator.getInstance(true);
    
    /** List of known disposable email domains that are blocked */
    private static final List<String> DISPOSABLE_DOMAINS = Arrays.asList(
            "mailinator.com", "yopmail.com", "tempmail.com", "guerrillamail.com", 
            "throwawaymail.com", "10minutemail.com", "trashmail.com", "sharklasers.com",
            "temp-mail.org", "fakeinbox.com");

    /**
     * Initializes the validator.
     * No initialization is needed as we use static validators.
     *
     * @param constraintAnnotation The constraint annotation
     */
    @Override
    public void initialize(ValidEmail constraintAnnotation) {
        // No initialization needed
    }

    /**
     * Validates the email address.
     * Performs multiple validation checks:
     * 1. Length check (max 100 characters)
     * 2. Format validation using Apache Commons Validator
     * 3. Disposable domain check
     *
     * @param email The email address to validate
     * @param context The validation context
     * @return true if the email is valid, false otherwise
     */
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
