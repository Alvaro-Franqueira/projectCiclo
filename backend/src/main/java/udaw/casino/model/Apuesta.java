package udaw.casino.model;

import lombok.Data;
import lombok.ToString;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@ToString(exclude = {"usuario", "juego"})
public class Apuesta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double cantidad;
    private String tipoApuesta; // docenas, color, par/impar, etc.
    private String valorApostado;
    private String valorGanador; // resultado de la apuesta, puede ser un número o un color 

    private LocalDateTime fechaApuesta;
    private String estado; //  no se si tiene sentido
    private double winloss;
    
    @JsonIgnore
    @ManyToOne // una apuesta pertenece a un usuario y un usuario puede tener muchas apuestas
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
    
    @JsonIgnore
    @ManyToOne // una apuesta pertenece a un juego y un juego puede tener muchas apuestas
    @JoinColumn(name = "juego_id")
    private Juego juego;
    
    // Override toString to prevent circular references
    @Override
    public String toString() {
        return "Apuesta{" +
                "id=" + id +
                ", cantidad=" + cantidad +
                ", tipoApuesta='" + tipoApuesta + '\'' +
                ", valorApostado='" + valorApostado + '\'' +
                ", valorGanador='" + valorGanador + '\'' +
                ", fechaApuesta=" + fechaApuesta +
                ", estado='" + estado + '\'' +
                ", winloss=" + winloss +
                ", usuarioId=" + (usuario != null ? usuario.getId() : null) +
                ", juegoId=" + (juego != null ? juego.getId() : null) +
                '}';
    }
}