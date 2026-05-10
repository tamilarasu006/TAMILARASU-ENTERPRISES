package com.tamilarasu.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {

    private Long id;
    private String orderNumber;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private String deliveryAddress;
    private String contactPhone;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
}
