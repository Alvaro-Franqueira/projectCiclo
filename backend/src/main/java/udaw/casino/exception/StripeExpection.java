package udaw.casino.exception;

public class StripeExpection extends RuntimeException {
    public StripeExpection(String message) {
        super(message);
    }

    public StripeExpection(String message, Throwable cause) {
        super(message, cause);
    }
    
}
