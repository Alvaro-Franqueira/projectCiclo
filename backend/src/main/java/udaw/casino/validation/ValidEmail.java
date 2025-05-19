package udaw.casino.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom annotation for email validation in the casino system.
 * This annotation is used to validate email addresses using the EmailConstraintValidator.
 * It ensures that email addresses are properly formatted, not too long, and not from disposable domains.
 * 
 * Usage example:
 * {@code
 * public class User {
 *     @ValidEmail(message = "Please provide a valid email address")
 *     private String email;
 * }
 * }
 */
@Documented
@Constraint(validatedBy = EmailConstraintValidator.class)
@Target({ ElementType.FIELD, ElementType.ANNOTATION_TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEmail {
    
    /**
     * The error message to be displayed when validation fails.
     * Can be overridden when using the annotation.
     *
     * @return The default error message
     */
    String message() default "Invalid email format";
    
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
}
