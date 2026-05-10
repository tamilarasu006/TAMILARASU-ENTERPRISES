package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.entity.Category;
import com.tamilarasu.ecommerce.entity.Inventory;
import com.tamilarasu.ecommerce.entity.Product;
import com.tamilarasu.ecommerce.exception.InsufficientStockException;
import com.tamilarasu.ecommerce.repository.CategoryRepository;
import com.tamilarasu.ecommerce.repository.InventoryRepository;
import com.tamilarasu.ecommerce.repository.ProductRepository;
import net.jqwik.api.*;
import net.jqwik.api.lifecycle.BeforeTry;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

// Feature: tamilarasu-enterprises-ecommerce, Property 19: Inventory decrements match order quantities
class InventoryServiceProperties {

    private InventoryService inventoryService;
    private InventoryRepository inventoryRepository;
    private ProductRepository productRepository;
    private CategoryRepository categoryRepository;
    private Category testCategory;

    @BeforeTry
    void setUp() {
        // Create mocks
        inventoryRepository = mock(InventoryRepository.class);
        productRepository = mock(ProductRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        
        // Create service with mocked dependencies
        inventoryService = new InventoryService(inventoryRepository, productRepository);

        // Create test category
        testCategory = Category.builder()
                .id(1L)
                .name("Test Category")
                .slug("test-category")
                .build();
    }

    @Property(tries = 100)
    @Label("Property 19: Inventory decrements match order quantities")
    void inventoryDecrementsMatchOrderQuantities(
            @ForAll("positiveStock") int initialStock,
            @ForAll("validOrderQuantity") int orderQuantity) {
        
        // Given: A product with initial stock
        Product product = createTestProduct("Test Product " + System.nanoTime(), 1L);
        Inventory inventory = createInventoryForProduct(product, initialStock);

        // Mock repository behavior
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Assume: Order quantity is valid (not exceeding stock)
        Assume.that(orderQuantity <= initialStock);

        // When: We decrement inventory for an order
        inventoryService.decrement(product.getId(), orderQuantity);

        // Then: The inventory should be decremented by exactly the order quantity
        int expectedQuantity = initialStock - orderQuantity;
        assertThat(inventory.getQuantity()).isEqualTo(expectedQuantity);
        
        // And: Out of stock flag should be set correctly
        boolean expectedOutOfStock = (expectedQuantity == 0);
        assertThat(inventory.isOutOfStock()).isEqualTo(expectedOutOfStock);
        
        // Verify save was called
        verify(inventoryRepository).save(inventory);
    }

    @Property(tries = 100)
    @Label("Property 24: Out-of-stock products are hidden from add-to-cart")
    void outOfStockProductsAreHiddenFromAddToCart(@ForAll("positiveStock") int initialStock) {
        
        // Given: A product with stock
        Product product = createTestProduct("Test Product " + System.nanoTime(), 1L);
        Inventory inventory = createInventoryForProduct(product, initialStock);

        // Mock repository behavior
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When: We decrement all stock to make it out of stock
        inventoryService.decrement(product.getId(), initialStock);

        // Then: The product should be marked as out of stock
        assertThat(inventory.isOutOfStock()).isTrue();
        
        // And: The inventory quantity should be zero
        assertThat(inventory.getQuantity()).isEqualTo(0);
    }

    @Property(tries = 100)
    @Label("Property 25: Low stock report contains only qualifying products")
    void lowStockReportContainsOnlyQualifyingProducts(
            @ForAll("lowStockQuantity") int lowStock,
            @ForAll("highStockQuantity") int highStock) {
        
        // Given: Products with different stock levels
        Product lowStockProduct = createTestProduct("Low Stock Product " + System.nanoTime(), 1L);
        Product highStockProduct = createTestProduct("High Stock Product " + System.nanoTime(), 2L);
        
        Inventory lowStockInventory = createInventoryForProduct(lowStockProduct, lowStock);
        Inventory highStockInventory = createInventoryForProduct(highStockProduct, highStock);

        // Mock repository behavior
        List<Inventory> mockInventories = List.of();
        if (lowStock < 10 && highStock < 10) {
            mockInventories = List.of(lowStockInventory, highStockInventory);
        } else if (lowStock < 10) {
            mockInventories = List.of(lowStockInventory);
        } else if (highStock < 10) {
            mockInventories = List.of(highStockInventory);
        }
        
        when(inventoryRepository.findByQuantityLessThan(10)).thenReturn(mockInventories);

        // When: We get low stock products
        List<Product> lowStockProducts = inventoryService.getLowStockProducts();

        // Then: Only products with quantity < 10 should be included
        boolean lowStockProductShouldBeIncluded = lowStock < 10;
        boolean highStockProductShouldBeIncluded = highStock < 10;
        
        if (lowStockProductShouldBeIncluded) {
            assertThat(lowStockProducts).extracting(Product::getId).contains(lowStockProduct.getId());
        } else {
            assertThat(lowStockProducts).extracting(Product::getId).doesNotContain(lowStockProduct.getId());
        }
        
        if (highStockProductShouldBeIncluded) {
            assertThat(lowStockProducts).extracting(Product::getId).contains(highStockProduct.getId());
        } else {
            assertThat(lowStockProducts).extracting(Product::getId).doesNotContain(highStockProduct.getId());
        }
    }

    @Property(tries = 100)
    @Label("Property 26: Order cancellation restores inventory")
    void orderCancellationRestoresInventory(
            @ForAll("positiveStock") int initialStock,
            @ForAll("validOrderQuantity") int orderQuantity,
            @ForAll("validRestoreQuantity") int restoreQuantity) {
        
        // Given: A product with initial stock
        Product product = createTestProduct("Test Product " + System.nanoTime(), 1L);
        Inventory inventory = createInventoryForProduct(product, initialStock);

        // Assume: Order quantity is valid
        Assume.that(orderQuantity <= initialStock);

        // Mock repository behavior for decrement
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.findByProductId(1L)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When: We first decrement for an order, then restore on cancellation
        inventoryService.decrement(product.getId(), orderQuantity);
        int stockAfterOrder = initialStock - orderQuantity;
        
        // Update inventory state for restore operation
        inventory.setQuantity(stockAfterOrder);
        
        inventoryService.restore(product.getId(), restoreQuantity);

        // Then: The inventory should be restored correctly
        int expectedQuantity = stockAfterOrder + restoreQuantity;
        assertThat(inventory.getQuantity()).isEqualTo(expectedQuantity);
        
        // And: Out of stock flag should be cleared if quantity > 0
        if (expectedQuantity > 0) {
            assertThat(inventory.isOutOfStock()).isFalse();
        }
    }

    @Property(tries = 100)
    @Label("Property: Insufficient stock throws exception")
    void insufficientStockThrowsException(
            @ForAll("positiveStock") int initialStock,
            @ForAll("excessiveOrderQuantity") int orderQuantity) {
        
        // Given: A product with limited stock
        Product product = createTestProduct("Test Product " + System.nanoTime(), 1L);
        Inventory inventory = createInventoryForProduct(product, initialStock);

        // Assume: Order quantity exceeds available stock
        Assume.that(orderQuantity > initialStock);

        // Mock repository behavior
        when(inventoryRepository.findByProductIdWithLock(1L)).thenReturn(Optional.of(inventory));

        // When & Then: Attempting to decrement more than available should throw exception
        assertThatThrownBy(() -> inventoryService.decrement(product.getId(), orderQuantity))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock");
        
        // And: Inventory should remain unchanged
        assertThat(inventory.getQuantity()).isEqualTo(initialStock);
        
        // Verify save was never called since operation failed
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    // Helper methods
    private Product createTestProduct(String name, Long id) {
        return Product.builder()
                .id(id)
                .name(name)
                .description("Test product description")
                .price(new BigDecimal("99.99"))
                .category(testCategory)
                .build();
    }

    private Inventory createInventoryForProduct(Product product, int quantity) {
        return Inventory.builder()
                .id(product.getId())
                .product(product)
                .quantity(quantity)
                .outOfStock(quantity == 0)
                .build();
    }

    // Generators
    @Provide
    Arbitrary<Integer> positiveStock() {
        return Arbitraries.integers().between(1, 100);
    }

    @Provide
    Arbitrary<Integer> validOrderQuantity() {
        return Arbitraries.integers().between(1, 50);
    }

    @Provide
    Arbitrary<Integer> validRestoreQuantity() {
        return Arbitraries.integers().between(1, 30);
    }

    @Provide
    Arbitrary<Integer> lowStockQuantity() {
        return Arbitraries.integers().between(0, 15); // Mix of low and slightly above threshold
    }

    @Provide
    Arbitrary<Integer> highStockQuantity() {
        return Arbitraries.integers().between(5, 50); // Mix of low and high stock
    }

    @Provide
    Arbitrary<Integer> excessiveOrderQuantity() {
        return Arbitraries.integers().between(51, 200); // Always exceeds positiveStock max
    }
}