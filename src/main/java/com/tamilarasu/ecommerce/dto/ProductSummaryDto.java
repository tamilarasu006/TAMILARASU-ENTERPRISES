package com.tamilarasu.ecommerce.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSummaryDto {

    private Long id;
    private String name;
    private BigDecimal price;
    private String categoryName;
    private String imageUrl;
    private boolean outOfStock;
}
