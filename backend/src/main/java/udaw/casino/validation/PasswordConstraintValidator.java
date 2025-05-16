package udaw.casino.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Custom validator for password complexity
 */
public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        // No initialization needed
    }

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
        
        // Check for at least one special character
        if (!containsSpecialChar(password)) {
            validationErrors.add("Password must contain at least one special character");
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
    
    private boolean containsUpperCase(String str) {
        return Pattern.compile("[A-Z]").matcher(str).find();
    }
    
    private boolean containsLowerCase(String str) {
        return Pattern.compile("[a-z]").matcher(str).find();
    }
    
    private boolean containsDigit(String str) {
        return Pattern.compile("\\d").matcher(str).find();
    }
    
    private boolean containsSpecialChar(String str) {
        Pattern special = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':'\\\\|,.<>/?]");
        return special.matcher(str).find();
    }
    
    private boolean containsWhitespace(String str) {
        return Pattern.compile("\\s").matcher(str).find();
    }
}
