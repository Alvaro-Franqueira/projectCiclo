package udaw.casino.model;

import lombok.Data;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
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
}