package com.tamilarasu.ecommerce.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
}
