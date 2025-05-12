package udaw.casino.exception;

public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(String message) {
        super(message);
    }

    public InsufficientBalanceException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public InsufficientBalanceException() {
        super("Insufficient balance to place the bet.");
    }
}
