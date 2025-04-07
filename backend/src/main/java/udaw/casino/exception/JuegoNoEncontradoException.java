package udaw.casino.exception;


public class JuegoNoEncontradoException extends RuntimeException {
    public JuegoNoEncontradoException(String message) {
        super(message);
    }
    public JuegoNoEncontradoException(String message, Throwable cause) {
        super(message, cause);
    }
    public JuegoNoEncontradoException() {
        super("Juego no encontrado.");
    }
        
}
