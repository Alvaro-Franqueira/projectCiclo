package udaw.casino.dto;

import lombok.Data;
import udaw.casino.model.Juego;

@Data
public class JuegoDTO {
    private Long id;
    private String nombre;
    private String descripcion;

    public JuegoDTO(Juego juego) {
        this.id = juego.getId();
        this.nombre = juego.getNombre();
        this.descripcion = juego.getDescripcion();
    }


    
}
 