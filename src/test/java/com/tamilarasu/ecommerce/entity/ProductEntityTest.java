package com.tamilarasu.ecommerce.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Unit tests for Product, Category, and ProductImage JPA entities
 * Validates entity creation, relationships, and basic functionality
 */
class ProductEntityTest {

    private Category category;
    private Product product;
    private ProductImage productImage;

    @BeforeEach
    void setUp() {
        // Create test category
        category = Category.builder()
                .id(1L)
                .name("Electronics")
                .slug("electronics")
                .build();

        // Create test product
        product = Product.builder()
                .id(1L)
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category(category)
                .active(true)
                .build();

        // Create test product image
        productImage = ProductImage.builder()
                .id(1L)
                .product(product)
                .url("https://example.com/image.jpg")
                .sortOrder(1)
                .build();
    }

    @Test
    void testCategoryCreation() {
        assertNotNull(category);
        assertEquals("Electronics", category.getName());
        assertEquals("electronics", category.getSlug());
        assertEquals(1L, category.getId());
    }

    @Test
    void testProductCreation() {
        assertNotNull(product);
        assertEquals("Test Product", product.getName());
        assertEquals("Test Description", product.getDescription());
        assertEquals(new BigDecimal("99.99"), product.getPrice());
        assertEquals(category, product.getCategory());
        assertTrue(product.isActive());
        assertEquals(1L, product.getId());
    }

    @Test
    void testProductImageCreation() {
        assertNotNull(productImage);
        assertEquals(product, productImage.getProduct());
        assertEquals("https://example.com/image.jpg", productImage.getUrl());
        assertEquals(1, productImage.getSortOrder());
        assertEquals(1L, productImage.getId());
    }

    @Test
    void testProductDefaultValues() {
        Product newProduct = Product.builder()
                .name("New Product")
                .description("New Description")
                .price(new BigDecimal("50.00"))
                .category(category)
                .build();

        assertTrue(newProduct.isActive()); // Should default to true
    }

    @Test
    void testProductImageDefaultSortOrder() {
        ProductImage newImage = ProductImage.builder()
                .product(product)
                .url("https://example.com/new-image.jpg")
                .build();

        assertEquals(0, newImage.getSortOrder()); // Should default to 0
    }

    @Test
    void testProductCategoryRelationship() {
        assertNotNull(product.getCategory());
        assertEquals("Electronics", product.getCategory().getName());
        assertEquals("electronics", product.getCategory().getSlug());
    }

    @Test
    void testProductImageProductRelationship() {
        assertNotNull(productImage.getProduct());
        assertEquals("Test Product", productImage.getProduct().getName());
        assertEquals(new BigDecimal("99.99"), productImage.getProduct().getPrice());
    }
}