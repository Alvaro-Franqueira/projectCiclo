package udaw.casino.exception;

public class SaldoInsuficienteException extends RuntimeException {
    public SaldoInsuficienteException(String message) {
        super(message);
    }

    public SaldoInsuficienteException(String message, Throwable cause) {
        super(message, cause);
    }
    public SaldoInsuficienteException() {
        super("Saldo insuficiente para realizar la apuesta.");
    }
}
