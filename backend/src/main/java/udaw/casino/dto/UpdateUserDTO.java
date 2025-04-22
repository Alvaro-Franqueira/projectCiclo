package udaw.casino.dto;

import lombok.Data;
import udaw.casino.model.Rol;

@Data
public class UpdateUserDTO {
    private String username;
    private String email;
    private Rol rol;
}
