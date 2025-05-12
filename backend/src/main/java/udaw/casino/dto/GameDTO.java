package udaw.casino.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import udaw.casino.model.Game;

@Data
@NoArgsConstructor
public class GameDTO {
    private Long id;
    private String name;
    private String description;

    public GameDTO(Game game) {
        this.id = game.getId();
        this.name = game.getName();
        this.description = game.getDescription();
    }
}
