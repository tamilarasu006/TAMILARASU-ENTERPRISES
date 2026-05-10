package com.tamilarasu.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    @NotBlank(message = "Payment token is required")
    private String paymentToken;
}
