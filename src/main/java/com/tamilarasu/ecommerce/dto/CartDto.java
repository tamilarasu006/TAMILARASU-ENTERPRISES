package com.tamilarasu.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {

    private Long cartId;
    private List<CartItemDto> items;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
}
