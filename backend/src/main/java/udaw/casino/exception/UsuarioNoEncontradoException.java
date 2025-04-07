package udaw.casino.exception;

public class UsuarioNoEncontradoException extends RuntimeException {
    public UsuarioNoEncontradoException(String message) {
        super(message);
    }

    public UsuarioNoEncontradoException(String message, Throwable cause) {
        super(message, cause);
    }

    public UsuarioNoEncontradoException() {
        super("Usuario no encontrado.");
    }
    
}
