package udaw.casino.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentDTO {
    private Long userId;
    private Double amount;
    private String cardNumber; // Last 4 digits only for reference
    private String cardholderName;
}
