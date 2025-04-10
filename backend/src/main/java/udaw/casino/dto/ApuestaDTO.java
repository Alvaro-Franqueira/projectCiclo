package udaw.casino.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import udaw.casino.model.Apuesta;
import lombok.Setter;

@Getter
@Setter
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
        this.usuarioId = apuesta.getUsuario() != null ? apuesta.getUsuario().getId() : null;
        this.juegoId = apuesta.getJuego() != null ? apuesta.getJuego().getId() : null;
        
        if (apuesta.getJuego() != null) {
            this.juegoId = apuesta.getJuego().getId();
            this.juegoNombre = apuesta.getJuego().getNombre();
        }
    }

   
}
