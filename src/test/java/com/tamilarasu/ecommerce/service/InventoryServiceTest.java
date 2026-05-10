package com.tamilarasu.ecommerce.service;

import com.tamilarasu.ecommerce.entity.Category;
import com.tamilarasu.ecommerce.entity.Inventory;
import com.tamilarasu.ecommerce.entity.Product;
import com.tamilarasu.ecommerce.exception.InsufficientStockException;
import com.tamilarasu.ecommerce.repository.CategoryRepository;
import com.tamilarasu.ecommerce.repository.InventoryRepository;
import com.tamilarasu.ecommerce.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@Import(InventoryService.class)
class InventoryServiceTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Product testProduct;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        // Create test category
        Category category = Category.builder()
                .name("Test Category")
                .slug("test-category")
                .build();
        category = categoryRepository.save(category);

        // Create test product
        testProduct = Product.builder()
                .name("Test Product")
                .description("Test product description")
                .price(new BigDecimal("99.99"))
                .category(category)
                .build();
        testProduct = productRepository.save(testProduct);

        // Create test inventory
        testInventory = Inventory.builder()
                .product(testProduct)
                .quantity(50)
                .outOfStock(false)
                .build();
        testInventory = inventoryRepository.save(testInventory);
    }

    @Test
    void getStock_ShouldReturnCorrectQuantity() {
        // When
        int stock = inventoryService.getStock(testProduct.getId());

        // Then
        assertThat(stock).isEqualTo(50);
    }

    @Test
    void getStock_ShouldReturnZeroForNonExistentProduct() {
        // When
        int stock = inventoryService.getStock(999L);

        // Then
        assertThat(stock).isEqualTo(0);
    }

    @Test
    void decrement_ShouldReduceQuantityCorrectly() {
        // When
        inventoryService.decrement(testProduct.getId(), 10);

        // Then
        Optional<Inventory> updated = inventoryRepository.findByProductId(testProduct.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getQuantity()).isEqualTo(40);
        assertThat(updated.get().isOutOfStock()).isFalse();
    }

    @Test
    void decrement_ShouldMarkOutOfStockWhenQuantityReachesZero() {
        // When
        inventoryService.decrement(testProduct.getId(), 50);

        // Then
        Optional<Inventory> updated = inventoryRepository.findByProductId(testProduct.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getQuantity()).isEqualTo(0);
        assertThat(updated.get().isOutOfStock()).isTrue();
    }

    @Test
    void decrement_ShouldThrowExceptionForInsufficientStock() {
        // When & Then
        assertThatThrownBy(() -> inventoryService.decrement(testProduct.getId(), 60))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void decrement_ShouldThrowExceptionForNonPositiveQuantity() {
        // When & Then
        assertThatThrownBy(() -> inventoryService.decrement(testProduct.getId(), 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Quantity must be positive");

        assertThatThrownBy(() -> inventoryService.decrement(testProduct.getId(), -5))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Quantity must be positive");
    }

    @Test
    void decrement_ShouldThrowExceptionForNonExistentProduct() {
        // When & Then
        assertThatThrownBy(() -> inventoryService.decrement(999L, 10))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("No inventory record found");
    }

    @Test
    void restore_ShouldIncreaseQuantityCorrectly() {
        // Given - first decrement some stock
        inventoryService.decrement(testProduct.getId(), 20);

        // When
        inventoryService.restore(testProduct.getId(), 15);

        // Then
        Optional<Inventory> updated = inventoryRepository.findByProductId(testProduct.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getQuantity()).isEqualTo(45); // 50 - 20 + 15
        assertThat(updated.get().isOutOfStock()).isFalse();
    }

    @Test
    void restore_ShouldRemoveOutOfStockFlag() {
        // Given - make product out of stock
        inventoryService.decrement(testProduct.getId(), 50);

        // When
        inventoryService.restore(testProduct.getId(), 10);

        // Then
        Optional<Inventory> updated = inventoryRepository.findByProductId(testProduct.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getQuantity()).isEqualTo(10);
        assertThat(updated.get().isOutOfStock()).isFalse();
    }

    @Test
    void restore_ShouldCreateInventoryRecordForNonExistentProduct() {
        // Given - create a product without inventory
        Category category = categoryRepository.findAll().get(0);
        Product newProduct = Product.builder()
                .name("New Product")
                .description("New product description")
                .price(new BigDecimal("49.99"))
                .category(category)
                .build();
        newProduct = productRepository.save(newProduct);

        // When
        inventoryService.restore(newProduct.getId(), 25);

        // Then
        Optional<Inventory> created = inventoryRepository.findByProductId(newProduct.getId());
        assertThat(created).isPresent();
        assertThat(created.get().getQuantity()).isEqualTo(25);
        assertThat(created.get().isOutOfStock()).isFalse();
    }

    @Test
    void restore_ShouldThrowExceptionForNonPositiveQuantity() {
        // When & Then
        assertThatThrownBy(() -> inventoryService.restore(testProduct.getId(), 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Quantity must be positive");

        assertThatThrownBy(() -> inventoryService.restore(testProduct.getId(), -5))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Quantity must be positive");
    }

    @Test
    void updateStock_ShouldSetNewQuantityCorrectly() {
        // When
        inventoryService.updateStock(testProduct.getId(), 100);

        // Then
        Optional<Inventory> updated = inventoryRepository.findByProductId(testProduct.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getQuantity()).isEqualTo(100);
        assertThat(updated.get().isOutOfStock()).isFalse();
    }

    @Test
    void updateStock_ShouldMarkOutOfStockWhenQuantityIsZero() {
        // When
        inventoryService.updateStock(testProduct.getId(), 0);

        // Then
        Optional<Inventory> updated = inventoryRepository.findByProductId(testProduct.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getQuantity()).isEqualTo(0);
        assertThat(updated.get().isOutOfStock()).isTrue();
    }

    @Test
    void updateStock_ShouldCreateInventoryRecordForNonExistentProduct() {
        // Given - create a product without inventory
        Category category = categoryRepository.findAll().get(0);
        Product newProduct = Product.builder()
                .name("Another Product")
                .description("Another product description")
                .price(new BigDecimal("29.99"))
                .category(category)
                .build();
        newProduct = productRepository.save(newProduct);

        // When
        inventoryService.updateStock(newProduct.getId(), 75);

        // Then
        Optional<Inventory> created = inventoryRepository.findByProductId(newProduct.getId());
        assertThat(created).isPresent();
        assertThat(created.get().getQuantity()).isEqualTo(75);
        assertThat(created.get().isOutOfStock()).isFalse();
    }

    @Test
    void updateStock_ShouldThrowExceptionForNegativeQuantity() {
        // When & Then
        assertThatThrownBy(() -> inventoryService.updateStock(testProduct.getId(), -10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stock quantity cannot be negative");
    }

    @Test
    void getLowStockProducts_ShouldReturnProductsWithQuantityLessThan10() {
        // Given - create products with different stock levels
        Category category = categoryRepository.findAll().get(0);
        
        Product lowStock1 = Product.builder()
                .name("Low Stock 1")
                .description("Product with low stock")
                .price(new BigDecimal("19.99"))
                .category(category)
                .build();
        lowStock1 = productRepository.save(lowStock1);
        
        Product lowStock2 = Product.builder()
                .name("Low Stock 2")
                .description("Another product with low stock")
                .price(new BigDecimal("39.99"))
                .category(category)
                .build();
        lowStock2 = productRepository.save(lowStock2);
        
        Product highStock = Product.builder()
                .name("High Stock")
                .description("Product with high stock")
                .price(new BigDecimal("59.99"))
                .category(category)
                .build();
        highStock = productRepository.save(highStock);

        // Create inventory records
        inventoryRepository.save(Inventory.builder()
                .product(lowStock1)
                .quantity(5)
                .outOfStock(false)
                .build());
        
        inventoryRepository.save(Inventory.builder()
                .product(lowStock2)
                .quantity(2)
                .outOfStock(false)
                .build());
        
        inventoryRepository.save(Inventory.builder()
                .product(highStock)
                .quantity(50)
                .outOfStock(false)
                .build());

        // When
        List<Product> lowStockProducts = inventoryService.getLowStockProducts();

        // Then
        assertThat(lowStockProducts).hasSize(2);
        assertThat(lowStockProducts)
                .extracting(Product::getName)
                .containsExactlyInAnyOrder("Low Stock 1", "Low Stock 2");
    }

    @Test
    void isOutOfStock_ShouldReturnCorrectStatus() {
        // Given - mark product as out of stock
        testInventory.setOutOfStock(true);
        inventoryRepository.save(testInventory);

        // When & Then
        assertThat(inventoryService.isOutOfStock(testProduct.getId())).isTrue();

        // Given - restore stock
        testInventory.setOutOfStock(false);
        inventoryRepository.save(testInventory);

        // When & Then
        assertThat(inventoryService.isOutOfStock(testProduct.getId())).isFalse();
    }

    @Test
    void isOutOfStock_ShouldReturnTrueForNonExistentProduct() {
        // When & Then
        assertThat(inventoryService.isOutOfStock(999L)).isTrue();
    }

    @Test
    void getInventory_ShouldReturnInventoryRecord() {
        // When
        Optional<Inventory> inventory = inventoryService.getInventory(testProduct.getId());

        // Then
        assertThat(inventory).isPresent();
        assertThat(inventory.get().getQuantity()).isEqualTo(50);
        assertThat(inventory.get().getProduct().getId()).isEqualTo(testProduct.getId());
    }

    @Test
    void getInventory_ShouldReturnEmptyForNonExistentProduct() {
        // When
        Optional<Inventory> inventory = inventoryService.getInventory(999L);

        // Then
        assertThat(inventory).isEmpty();
    }
}