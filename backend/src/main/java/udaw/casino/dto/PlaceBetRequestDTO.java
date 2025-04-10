package udaw.casino.dto;

import lombok.Data;

@Data // Lombok annotation for getters, setters, toString, etc.
public class PlaceBetRequestDTO {
    private Long usuarioId;
    private Long juegoId;
    private double cantidad;
    private String tipo; // e.g., "parimpar", "numero"
    private String valorApostado; // e.g., "par", "impar", "7"
    private String valorGanador;
}
