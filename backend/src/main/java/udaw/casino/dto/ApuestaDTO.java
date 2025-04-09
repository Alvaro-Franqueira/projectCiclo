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
    private String juegoNombre;
    
    public ApuestaDTO() {
    }
    
    public ApuestaDTO(Apuesta apuesta) {
        this.id = apuesta.getId();
        this.cantidad = apuesta.getCantidad();
        this.fechaApuesta = apuesta.getFechaApuesta();
        this.estado = apuesta.getEstado();
        this.winloss = apuesta.getWinloss();
        this.tipo = apuesta.getTipo();
        this.valorApostado = apuesta.getValorApostado();
        
        if (apuesta.getJuego() != null) {
            this.juegoId = apuesta.getJuego().getId();
            this.juegoNombre = apuesta.getJuego().getNombre();
        }
    }

   
}
