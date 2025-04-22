package udaw.casino.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentResponseDTO {
    private String clientSecret;
    private String paymentIntentId;
    private Long amount;
    private String currency;
}
