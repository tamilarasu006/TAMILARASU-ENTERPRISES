package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.Category;
import com.tamilarasu.ecommerce.entity.Inventory;
import com.tamilarasu.ecommerce.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class InventoryRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Test
    void findByProductId_ShouldReturnInventory_WhenProductExists() {
        // Given
        Category category = Category.builder()
                .name("Electronics")
                .slug("electronics")
                .build();
        entityManager.persistAndFlush(category);

        Product product = Product.builder()
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category(category)
                .active(true)
                .build();
        entityManager.persistAndFlush(product);

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(50)
                .outOfStock(false)
                .build();
        entityManager.persistAndFlush(inventory);

        // When
        Optional<Inventory> result = inventoryRepository.findByProductId(product.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getQuantity()).isEqualTo(50);
        assertThat(result.get().isOutOfStock()).isFalse();
        assertThat(result.get().getProduct().getId()).isEqualTo(product.getId());
    }

    @Test
    void findByProductId_ShouldReturnEmpty_WhenProductDoesNotExist() {
        // When
        Optional<Inventory> result = inventoryRepository.findByProductId(999L);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByQuantityLessThan_ShouldReturnLowStockItems() {
        // Given
        Category category = Category.builder()
                .name("Electronics")
                .slug("electronics")
                .build();
        entityManager.persistAndFlush(category);

        // Create products with different stock levels
        Product product1 = Product.builder()
                .name("Low Stock Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category(category)
                .active(true)
                .build();
        entityManager.persistAndFlush(product1);

        Product product2 = Product.builder()
                .name("High Stock Product")
                .description("Test Description")
                .price(new BigDecimal("149.99"))
                .category(category)
                .active(true)
                .build();
        entityManager.persistAndFlush(product2);

        Inventory lowStockInventory = Inventory.builder()
                .product(product1)
                .quantity(5) // Below threshold of 10
                .outOfStock(false)
                .build();
        entityManager.persistAndFlush(lowStockInventory);

        Inventory highStockInventory = Inventory.builder()
                .product(product2)
                .quantity(50) // Above threshold of 10
                .outOfStock(false)
                .build();
        entityManager.persistAndFlush(highStockInventory);

        // When
        List<Inventory> lowStockItems = inventoryRepository.findByQuantityLessThan(10);

        // Then
        assertThat(lowStockItems).hasSize(1);
        assertThat(lowStockItems.get(0).getQuantity()).isEqualTo(5);
        assertThat(lowStockItems.get(0).getProduct().getName()).isEqualTo("Low Stock Product");
    }

    @Test
    void findByProductIdWithLock_ShouldReturnInventory_WhenProductExists() {
        // Given
        Category category = Category.builder()
                .name("Electronics")
                .slug("electronics")
                .build();
        entityManager.persistAndFlush(category);

        Product product = Product.builder()
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category(category)
                .active(true)
                .build();
        entityManager.persistAndFlush(product);

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(25)
                .outOfStock(false)
                .build();
        entityManager.persistAndFlush(inventory);

        // When
        Optional<Inventory> result = inventoryRepository.findByProductIdWithLock(product.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getQuantity()).isEqualTo(25);
        assertThat(result.get().getProduct().getId()).isEqualTo(product.getId());
    }

    @Test
    void save_ShouldPersistInventory() {
        // Given
        Category category = Category.builder()
                .name("Electronics")
                .slug("electronics")
                .build();
        entityManager.persistAndFlush(category);

        Product product = Product.builder()
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category(category)
                .active(true)
                .build();
        entityManager.persistAndFlush(product);

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(100)
                .outOfStock(false)
                .build();

        // When
        Inventory saved = inventoryRepository.save(inventory);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getQuantity()).isEqualTo(100);
        assertThat(saved.isOutOfStock()).isFalse();
        assertThat(saved.getProduct().getId()).isEqualTo(product.getId());
    }
}