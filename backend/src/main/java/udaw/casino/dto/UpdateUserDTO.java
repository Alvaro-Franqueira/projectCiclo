package udaw.casino.dto;

import lombok.Data;
import udaw.casino.model.Role;

@Data
public class UpdateUserDTO {
    private String username;
    private String email;
    private Role role;
}
