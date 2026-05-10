package com.tamilarasu.ecommerce.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
        message = "Password must contain both letters and numbers"
    )
    private String password;

    @NotBlank(message = "Name is required")
    private String name;

    private String phone;
}
