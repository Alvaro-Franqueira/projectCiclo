package udaw.casino.dto;

import lombok.Data;

@Data
public class UserDTO {

    private Long id;
    private String username;
    private String email;    
    private Double balance;
    private String password; 
    private String role; 
    
    
}
