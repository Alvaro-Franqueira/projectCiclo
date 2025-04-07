package udaw.casino.exception;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
/**
 * Generic exception for cases where a requested resource is not found.
 * Returns HTTP 404 Not Found status.
 */
@ResponseStatus(value = HttpStatus.NOT_FOUND)

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
