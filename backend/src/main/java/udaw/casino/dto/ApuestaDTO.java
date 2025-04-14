package udaw.casino.dto;

import java.time.LocalDateTime;

import lombok.Data;
import udaw.casino.model.Apuesta;

@Data
public class ApuestaDTO {
    private Long id;
    private double cantidad;
    private LocalDateTime fechaApuesta;
    private String estado;
    private double winloss;
    private String tipo;
    private String valorApostado;
    private Long juegoId;
    private Long usuarioId;
    private String juegoNombre;
    private Double userBalance; // Added to store the user's current balance
    
    public ApuestaDTO() {
    }
    
    public ApuestaDTO(Apuesta apuesta) {
        this.id = apuesta.getId();
        this.cantidad = apuesta.getCantidad();
        this.fechaApuesta = apuesta.getFechaApuesta();
        this.estado = apuesta.getEstado();
        this.winloss = apuesta.getWinloss();
        this.tipo = apuesta.getTipoApuesta();
        this.valorApostado = apuesta.getValorApostado();
        if (apuesta.getUsuario() != null) {
            this.usuarioId = apuesta.getUsuario().getId();
            this.userBalance = apuesta.getUsuario().getBalance(); // Set the user's balance
        }
        
        if (apuesta.getJuego() != null) {
            this.juegoId = apuesta.getJuego().getId();
            this.juegoNombre = apuesta.getJuego().getNombre();
        }
    }

   
}
