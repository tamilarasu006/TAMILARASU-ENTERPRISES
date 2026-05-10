package com.tamilarasu.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailDto {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Long categoryId;
    private String categoryName;
    private List<String> images;
    private boolean outOfStock;
    private int quantity;
    private LocalDateTime createdAt;
}
