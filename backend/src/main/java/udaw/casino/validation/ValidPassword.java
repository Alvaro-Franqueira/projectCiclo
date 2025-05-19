package udaw.casino.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom annotation for password validation in the casino system.
 * This annotation is used to validate passwords using the PasswordConstraintValidator.
 * It ensures that passwords meet security requirements including length, complexity,
 * and character type requirements.
 * 
 * Password requirements:
 * - Length: 8-30 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 * - No whitespace allowed
 * 
 * Usage example:
 * {@code
 * public class User {
 *     @ValidPassword(message = "Password must meet complexity requirements")
 *     private String password;
 * }
 * }
 */
@Documented
@Constraint(validatedBy = PasswordConstraintValidator.class)
@Target({ ElementType.FIELD, ElementType.ANNOTATION_TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    
    /**
     * The error message to be displayed when validation fails.
     * Can be overridden when using the annotation.
     *
     * @return The default error message
     */
    String message() default "Invalid password";
    
    /**
     * Groups for validation.
     * Allows for grouping validation constraints.
     *
     * @return Array of validation groups
     */
    Class<?>[] groups() default {};
    
    /**
     * Payload for validation.
     * Can be used to attach additional metadata to the constraint.
     *
     * @return Array of payload classes
     */
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Interface to define a validation group for manual validation only.
     * This group can be used to trigger validation programmatically
     * rather than automatically during bean validation.
     */
    public interface ManualValidationOnly {}
}
