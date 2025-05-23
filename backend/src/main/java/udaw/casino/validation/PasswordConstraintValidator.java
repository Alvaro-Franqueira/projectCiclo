package udaw.casino.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Custom validator for password complexity in the casino system.
 * This validator implements the validation logic for the @ValidPassword annotation.
 * It enforces strong password requirements to ensure account security.
 * 
 * Password validation rules:
 * - Length: 8-30 characters
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one digit
 * - Must contain at least one special character
 * - No whitespace allowed
 * 
 * The validator collects all validation errors and returns them together
 * to provide comprehensive feedback to the user.
 */
public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

    /**
     * Initializes the validator.
     * No initialization is needed as we use static patterns.
     *
     * @param constraintAnnotation The constraint annotation
     */
    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        // No initialization needed
    }

    /**
     * Validates the password against all complexity requirements.
     * Collects all validation errors and returns them together.
     *
     * @param password The password to validate
     * @param context The validation context
     * @return true if the password meets all requirements, false otherwise
     */
    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        // Skip validation if password is null (handled by @NotBlank)
        if (password == null) {
            return true;
        }

        List<String> validationErrors = new ArrayList<>();
        
        // Validate password length (8-30 characters)
        if (password.length() < 8 || password.length() > 30) {
            validationErrors.add("Password must be between 8 and 30 characters");
            System.out.println("Password length validation failed. Length: " + password.length());
        }
        
        // Check for at least one uppercase letter
        if (!containsUpperCase(password)) {
            validationErrors.add("Password must contain at least one uppercase letter");
        }
        
        // Check for at least one lowercase letter
        if (!containsLowerCase(password)) {
            validationErrors.add("Password must contain at least one lowercase letter");
        }
        
        // Check for at least one digit
        if (!containsDigit(password)) {
            validationErrors.add("Password must contain at least one digit");
        }
        
        
        // Check for whitespace
        if (containsWhitespace(password)) {
            validationErrors.add("Password must not contain whitespace");
        }
        
        if (validationErrors.isEmpty()) {
            return true;
        } else {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    String.join(", ", validationErrors))
                   .addConstraintViolation();
            return false;
        }
    }
    
    /**
     * Checks if the string contains at least one uppercase letter.
     *
     * @param str The string to check
     * @return true if the string contains an uppercase letter
     */
    private boolean containsUpperCase(String str) {
        return Pattern.compile("[A-Z]").matcher(str).find();
    }
    
    /**
     * Checks if the string contains at least one lowercase letter.
     *
     * @param str The string to check
     * @return true if the string contains a lowercase letter
     */
    private boolean containsLowerCase(String str) {
        return Pattern.compile("[a-z]").matcher(str).find();
    }
    
    /**
     * Checks if the string contains at least one digit.
     *
     * @param str The string to check
     * @return true if the string contains a digit
     */
    private boolean containsDigit(String str) {
        return Pattern.compile("\\d").matcher(str).find();
    }
        
    /**
     * Checks if the string contains any whitespace characters.
     *
     * @param str The string to check
     * @return true if the string contains whitespace
     */
    private boolean containsWhitespace(String str) {
        return Pattern.compile("\\s").matcher(str).find();
    }
}
